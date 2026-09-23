import type {
  PilotAssessmentAlignment,
  PilotClaim,
  PilotConcept,
  PilotContentBlock,
  PilotKnowledgeUnit,
  PilotObjective,
  PilotPackage,
  PilotSource,
  PilotSourceReference,
  PilotTopic,
} from "@/lib/content/pilot/index";
import type { StudioTopicIdentity } from "./types";

export type StudioParseResult =
  | { ok: true; pkg: PilotPackage }
  | { ok: false; error: { code: "parse_failure"; message: string } };

const BLOCK_TYPES = new Set([
  "definition",
  "explanation",
  "mechanism-process",
  "chronology",
  "comparison",
  "cause-effect",
  "example",
  "case-study",
  "formula-rule",
  "exception",
  "misconception",
  "procedure-derivation",
]);

function fail(message: string): StudioParseResult {
  return { ok: false, error: { code: "parse_failure", message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  if (!candidate.startsWith("{") || !candidate.endsWith("}")) {
    throw new Error("output must be a single JSON object");
  }
  return JSON.parse(candidate) as unknown;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(`${path} must be an integer`);
  return value;
}

function asStringArray(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`${path} must be a string array`);
  return value;
}

function asPayload(value: unknown, path: string): PilotContentBlock["payload"] {
  if (!isRecord(value) || Object.keys(value).length === 0) throw new Error(`${path} must be a non-empty object`);
  const payload: Record<string, string | readonly string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") payload[key] = entry;
    else if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) payload[key] = entry;
    else throw new Error(`${path}.${key} must be a string or string array`);
  }
  return payload;
}

function parseBlock(value: unknown, path: string): PilotContentBlock {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  const type = asString(value.type, `${path}.type`);
  if (!BLOCK_TYPES.has(type)) throw new Error(`${path}.type is not a valid ContentBlock type`);
  const block: PilotContentBlock = {
    id: asString(value.id, `${path}.id`),
    type: type as PilotContentBlock["type"],
    order: asNumber(value.order, `${path}.order`),
    payload: asPayload(value.payload, `${path}.payload`),
  };
  const interpretationStatus = asOptionalString(value.interpretationStatus);
  if (interpretationStatus) block.interpretationStatus = interpretationStatus as PilotContentBlock["interpretationStatus"];
  if (value.claimIds !== undefined) block.claimIds = asStringArray(value.claimIds, `${path}.claimIds`);
  if (value.sourceReferenceIds !== undefined) block.sourceReferenceIds = asStringArray(value.sourceReferenceIds, `${path}.sourceReferenceIds`);
  return block;
}

function parseUnit(value: unknown, path: string): PilotKnowledgeUnit {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  if (!Array.isArray(value.blocks) || value.blocks.length === 0) throw new Error(`${path}.blocks is required`);
  const unitId = asString(value.id, `${path}.id`);
  if (/@v\d+$/.test(unitId)) throw new Error(`${path}.id must be versionless; contentVersion carries the version`);
  const unit: PilotKnowledgeUnit = {
    id: unitId,
    title: asString(value.title, `${path}.title`),
    conceptIds: asStringArray(value.conceptIds, `${path}.conceptIds`),
    objectiveIds: asStringArray(value.objectiveIds, `${path}.objectiveIds`),
    blocks: value.blocks.map((block, index) => parseBlock(block, `${path}.blocks[${index}]`)),
    contentVersion: asNumber(value.contentVersion, `${path}.contentVersion`),
    lifecycle: asString(value.lifecycle ?? "draft", `${path}.lifecycle`) as PilotKnowledgeUnit["lifecycle"],
    audience: asString(value.audience, `${path}.audience`),
    level: asString(value.level, `${path}.level`) as PilotKnowledgeUnit["level"],
  };
  const summary = asOptionalString(value.summary);
  if (summary) unit.summary = summary;
  if (value.claimIds !== undefined) unit.claimIds = asStringArray(value.claimIds, `${path}.claimIds`);
  if (value.sourceReferenceIds !== undefined) unit.sourceReferenceIds = asStringArray(value.sourceReferenceIds, `${path}.sourceReferenceIds`);
  return unit;
}

export function parseStudioPackage(raw: string, identity: StudioTopicIdentity): StudioParseResult {
  if (typeof raw !== "string" || !raw.trim()) return fail("AI output is empty.");
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    return fail("AI output is not valid JSON.");
  }
  if (!isRecord(parsed)) return fail("AI output must be a PilotPackage object.");
  try {
    if (!isRecord(parsed.topic)) throw new Error("topic is required");
    if (!Array.isArray(parsed.concepts) || !Array.isArray(parsed.objectives) || !Array.isArray(parsed.knowledgeUnits)) {
      throw new Error("concepts, objectives, and knowledgeUnits are required arrays");
    }
    if (!Array.isArray(parsed.claims) || !Array.isArray(parsed.sources) || !Array.isArray(parsed.sourceReferences) || !Array.isArray(parsed.assessmentAlignments)) {
      throw new Error("claims, sources, sourceReferences, and assessmentAlignments are required arrays");
    }
    if (parsed.knowledgeUnits.length === 0) throw new Error("at least one KnowledgeUnit is required");
    const topicFromModel: PilotTopic = {
      id: identity.topicId,
      disciplineId: identity.disciplineId,
      subjectId: identity.subjectId,
      title: identity.title,
      summary: identity.summary || asString(parsed.topic.summary, "topic.summary"),
      contentVersion: asNumber(parsed.topic.contentVersion, "topic.contentVersion"),
      lifecycle: asString(parsed.topic.lifecycle ?? "draft", "topic.lifecycle") as PilotTopic["lifecycle"],
      conceptIds: asStringArray(parsed.topic.conceptIds ?? parsed.concepts.map((item) => isRecord(item) ? item.id : ""), "topic.conceptIds").filter(Boolean),
      knowledgeUnitIds: asStringArray(parsed.topic.knowledgeUnitIds ?? parsed.knowledgeUnits.map((item) => isRecord(item) ? item.id : ""), "topic.knowledgeUnitIds").filter(Boolean),
      objectiveIds: asStringArray(parsed.topic.objectiveIds ?? parsed.objectives.map((item) => isRecord(item) ? item.id : ""), "topic.objectiveIds").filter(Boolean),
      assessmentAlignmentIds: asStringArray(parsed.topic.assessmentAlignmentIds ?? parsed.assessmentAlignments.map((item) => isRecord(item) ? item.id : ""), "topic.assessmentAlignmentIds").filter(Boolean),
      audience: asString(parsed.topic.audience, "topic.audience"),
      level: asString(parsed.topic.level, "topic.level") as PilotTopic["level"],
      provenanceStatus: asString(parsed.topic.provenanceStatus, "topic.provenanceStatus") as PilotTopic["provenanceStatus"],
    };
    const pkg: PilotPackage = {
      disciplineId: identity.disciplineId,
      subjectId: identity.subjectId,
      topic: topicFromModel,
      concepts: parsed.concepts.map((item, index) => {
        if (!isRecord(item)) throw new Error(`concepts[${index}] must be an object`);
        return {
          id: asString(item.id, `concepts[${index}].id`),
          title: asString(item.title, `concepts[${index}].title`),
          aliases: asStringArray(item.aliases ?? [], `concepts[${index}].aliases`),
          knowledgeUnitIds: asStringArray(item.knowledgeUnitIds, `concepts[${index}].knowledgeUnitIds`),
        } satisfies PilotConcept;
      }),
      objectives: parsed.objectives.map((item, index) => {
        if (!isRecord(item)) throw new Error(`objectives[${index}] must be an object`);
        return {
          id: asString(item.id, `objectives[${index}].id`),
          verb: asString(item.verb, `objectives[${index}].verb`) as PilotObjective["verb"],
          statement: asString(item.statement, `objectives[${index}].statement`),
          level: asString(item.level, `objectives[${index}].level`) as PilotObjective["level"],
        } satisfies PilotObjective;
      }),
      knowledgeUnits: parsed.knowledgeUnits.map((item, index) => parseUnit(item, `knowledgeUnits[${index}]`)),
      claims: parsed.claims.map((item, index) => {
        if (!isRecord(item)) throw new Error(`claims[${index}] must be an object`);
        const claim: PilotClaim = {
          id: asString(item.id, `claims[${index}].id`),
          statement: asString(item.statement, `claims[${index}].statement`),
          kind: asString(item.kind, `claims[${index}].kind`) as PilotClaim["kind"],
          interpretationStatus: asString(item.interpretationStatus, `claims[${index}].interpretationStatus`) as PilotClaim["interpretationStatus"],
          supportStatus: asString(item.supportStatus, `claims[${index}].supportStatus`) as PilotClaim["supportStatus"],
          sourceReferenceIds: asStringArray(item.sourceReferenceIds, `claims[${index}].sourceReferenceIds`),
        };
        if (asOptionalString(item.conflictGroupId)) claim.conflictGroupId = asOptionalString(item.conflictGroupId);
        return claim;
      }),
      sources: parsed.sources.map((item, index) => {
        if (!isRecord(item)) throw new Error(`sources[${index}] must be an object`);
        return {
          id: asString(item.id, `sources[${index}].id`),
          type: asString(item.type, `sources[${index}].type`) as PilotSource["type"],
          title: asString(item.title, `sources[${index}].title`),
          publisherOrOrganization: asString(item.publisherOrOrganization, `sources[${index}].publisherOrOrganization`),
          reference: asString(item.reference, `sources[${index}].reference`),
          language: asString(item.language, `sources[${index}].language`),
        } satisfies PilotSource;
      }),
      sourceReferences: parsed.sourceReferences.map((item, index) => {
        if (!isRecord(item)) throw new Error(`sourceReferences[${index}] must be an object`);
        return {
          id: asString(item.id, `sourceReferences[${index}].id`),
          sourceId: asString(item.sourceId, `sourceReferences[${index}].sourceId`),
          supportType: asString(item.supportType, `sourceReferences[${index}].supportType`) as PilotSourceReference["supportType"],
          citation: asString(item.citation, `sourceReferences[${index}].citation`),
        } satisfies PilotSourceReference;
      }),
      assessmentAlignments: parsed.assessmentAlignments.map((item, index) => {
        if (!isRecord(item)) throw new Error(`assessmentAlignments[${index}] must be an object`);
        return {
          id: asString(item.id, `assessmentAlignments[${index}].id`),
          objectiveIds: asStringArray(item.objectiveIds, `assessmentAlignments[${index}].objectiveIds`),
          conceptIds: asStringArray(item.conceptIds, `assessmentAlignments[${index}].conceptIds`),
          knowledgeUnitIds: asStringArray(item.knowledgeUnitIds, `assessmentAlignments[${index}].knowledgeUnitIds`),
          assessmentSetId: asString(item.assessmentSetId, `assessmentAlignments[${index}].assessmentSetId`),
          contentVersion: asNumber(item.contentVersion, `assessmentAlignments[${index}].contentVersion`),
        } satisfies PilotAssessmentAlignment;
      }),
    };
    return { ok: true, pkg };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "AI output is not a PilotPackage.");
  }
}
