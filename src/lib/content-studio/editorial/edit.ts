import type {
  PilotBlockType,
  PilotClaim,
  PilotConcept,
  PilotContentBlock,
  PilotInterpretationStatus,
  PilotKnowledgeUnit,
  PilotObjective,
  PilotScope,
  PilotSource,
  PilotSourceReference,
  PilotValidity,
} from "@/lib/content/pilot/types";
import type { ProductionRecord } from "@/lib/content/production/types";

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "authorization",
  "apiKey",
  "api_key",
  "headers",
  "rawText",
  "raw",
  "body",
  "accessToken",
  "access_token",
  "token",
]);

const BLOCK_TYPES = new Set<string>([
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

const LEVELS = new Set(["foundational", "intermediate"]);
const PROVENANCE = new Set(["verified", "corroborated", "synthesized", "disputed"]);
const VERBS = new Set(["explain", "distinguish", "apply", "analyze"]);
const INTERPRETATION = new Set(["fact", "interpretation", "synthesis", "illustrative", "disputed"]);
const CLAIM_KINDS = new Set(["factual", "historical", "definition", "interpretive"]);
const CLAIM_SUPPORT = new Set(["verified", "corroborated", "synthesized", "disputed"]);
const SOURCE_TYPES = new Set(["government", "international-organization", "university", "academic-paper", "textbook", "reference-editorial"]);
const REFERENCE_SUPPORT = new Set(["direct", "synthesized", "contextual"]);

export type EditorialTopicPatch = {
  title?: string;
  summary?: string;
  audience?: string;
  level?: "foundational" | "intermediate";
  provenanceStatus?: "verified" | "corroborated" | "synthesized" | "disputed";
  categoryId?: string;
};

export type EditorialConceptPatch = {
  title?: string;
  aliases?: readonly string[];
};

export type EditorialObjectivePatch = {
  verb?: PilotObjective["verb"];
  statement?: string;
  level?: PilotObjective["level"];
};

export type EditorialBlockPatch = {
  type?: PilotBlockType;
  order?: number;
  payload?: Readonly<Record<string, string | readonly string[]>>;
  interpretationStatus?: PilotInterpretationStatus;
  claimIds?: readonly string[];
  sourceReferenceIds?: readonly string[];
};

export type EditorialKnowledgeUnitPatch = {
  title?: string;
  summary?: string;
  audience?: string;
  level?: PilotKnowledgeUnit["level"];
  scope?: PilotScope;
  validity?: PilotValidity;
  extension?: Readonly<Record<string, string | readonly string[]>>;
  conceptIds?: readonly string[];
  objectiveIds?: readonly string[];
  claimIds?: readonly string[];
  sourceReferenceIds?: readonly string[];
  blocks?: Record<string, EditorialBlockPatch>;
};

export type EditorialClaimPatch = {
  statement?: string;
  kind?: PilotClaim["kind"];
  interpretationStatus?: PilotInterpretationStatus;
  supportStatus?: PilotClaim["supportStatus"];
  sourceReferenceIds?: readonly string[];
  scope?: PilotScope;
  validity?: PilotValidity;
  conflictGroupId?: string;
};

export type EditorialSourcePatch = {
  type?: PilotSource["type"];
  title?: string;
  publisherOrOrganization?: string;
  reference?: string;
  language?: string;
  publicationDate?: string;
  accessedDate?: string;
  scope?: PilotScope;
};

export type EditorialSourceReferencePatch = {
  sourceId?: string;
  supportType?: PilotSourceReference["supportType"];
  citation?: string;
  locator?: string;
  quote?: string;
};

export type EditorialPatch = {
  topic?: EditorialTopicPatch;
  concepts?: Record<string, EditorialConceptPatch>;
  objectives?: Record<string, EditorialObjectivePatch>;
  knowledgeUnits?: Record<string, EditorialKnowledgeUnitPatch>;
  claims?: Record<string, EditorialClaimPatch>;
  sources?: Record<string, EditorialSourcePatch>;
  sourceReferences?: Record<string, EditorialSourceReferencePatch>;
};

function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function rejectKeys(value: Record<string, unknown>, allowed: readonly string[], immutable: readonly string[] = []): void {
  for (const key of Object.keys(value)) {
    if (immutable.includes(key)) fail("malformed draft: immutable field");
    if (!allowed.includes(key)) fail("malformed draft");
  }
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`malformed draft`);
  void label;
  return value;
}

function stringList(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) fail("malformed draft");
  return [...value];
}

function oneOf(value: unknown, allowed: ReadonlySet<string>): string {
  if (typeof value !== "string" || !allowed.has(value)) fail("malformed draft");
  return value;
}

function replacementMap(
  baseline: Readonly<Record<string, string | readonly string[]>> | undefined,
  value: unknown,
): Readonly<Record<string, string | readonly string[]>> {
  if (!isRecord(value)) fail("malformed draft");
  const baselineKeys = new Set(Object.keys(baseline ?? {}));
  const next: Record<string, string | readonly string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key) && !baselineKeys.has(key)) fail("malformed draft");
    if (typeof entry === "string") next[key] = entry;
    else if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) next[key] = [...entry];
    else fail("malformed draft");
  }
  return next;
}

function applyBlock(
  block: PilotContentBlock,
  patch: EditorialBlockPatch,
  claimIds: ReadonlySet<string>,
  referenceIds: ReadonlySet<string>,
): PilotContentBlock {
  if (!isRecord(patch)) fail("malformed draft");
  rejectKeys(patch, ["type", "order", "payload", "interpretationStatus", "claimIds", "sourceReferenceIds"], ["id"]);
  let next = block;
  if (patch.type !== undefined) {
    if (!BLOCK_TYPES.has(patch.type)) fail("invalid block type");
    next = { ...next, type: patch.type };
  }
  if (patch.order !== undefined) {
    if (!Number.isInteger(patch.order)) fail("malformed draft");
    next = { ...next, order: patch.order };
  }
  if (patch.payload !== undefined) next = { ...next, payload: replacementMap(block.payload, patch.payload) };
  if (patch.interpretationStatus !== undefined) {
    next = { ...next, interpretationStatus: oneOf(patch.interpretationStatus, INTERPRETATION) as PilotInterpretationStatus };
  }
  if (patch.claimIds !== undefined) {
    const ids = stringList(patch.claimIds);
    if (ids.some((id) => !claimIds.has(id))) fail("malformed draft");
    next = { ...next, claimIds: ids };
  }
  if (patch.sourceReferenceIds !== undefined) {
    const ids = stringList(patch.sourceReferenceIds);
    if (ids.some((id) => !referenceIds.has(id))) fail("invalid source reference");
    next = { ...next, sourceReferenceIds: ids };
  }
  return next;
}

export function applyEditorialPatch(baseline: ProductionRecord, patch: EditorialPatch): ProductionRecord {
  if (!isRecord(patch)) fail("malformed draft");
  rejectKeys(
    patch,
    ["topic", "concepts", "objectives", "knowledgeUnits", "claims", "sources", "sourceReferences"],
    ["workflowState", "reviews", "publishedAt", "supersedesVersion", "contentVersion", "disciplineId", "subjectId", "lifecycle", "id", "assessmentAlignments", "content"],
  );
  const next = structuredClone(baseline);
  const content = next.content;
  const claimIds = new Set(content.claims.map((claim) => claim.id));
  const sourceIds = new Set(content.sources.map((source) => source.id));
  const referenceIds = new Set(content.sourceReferences.map((reference) => reference.id));
  const conceptIds = new Set(content.concepts.map((concept) => concept.id));
  const objectiveIds = new Set(content.objectives.map((objective) => objective.id));

  if (patch.topic) {
    if (!isRecord(patch.topic)) fail("malformed draft");
    rejectKeys(
      patch.topic,
      ["title", "summary", "audience", "level", "provenanceStatus", "categoryId"],
      ["id", "disciplineId", "subjectId", "contentVersion", "lifecycle", "conceptIds", "knowledgeUnitIds", "objectiveIds", "assessmentAlignmentIds"],
    );
    const topic = { ...content.topic };
    if (patch.topic.title !== undefined) topic.title = asString(patch.topic.title, "title");
    if (patch.topic.summary !== undefined) topic.summary = asString(patch.topic.summary, "summary");
    if (patch.topic.audience !== undefined) topic.audience = asString(patch.topic.audience, "audience");
    if (patch.topic.level !== undefined) topic.level = oneOf(patch.topic.level, LEVELS) as PilotKnowledgeUnit["level"];
    if (patch.topic.provenanceStatus !== undefined) {
      topic.provenanceStatus = oneOf(patch.topic.provenanceStatus, PROVENANCE) as typeof topic.provenanceStatus;
    }
    if (patch.topic.categoryId !== undefined) topic.categoryId = asString(patch.topic.categoryId, "categoryId");
    content.topic = topic;
  }

  if (patch.concepts) {
    if (!isRecord(patch.concepts)) fail("malformed draft");
    const concepts = [...content.concepts];
    for (const [id, conceptPatch] of Object.entries(patch.concepts)) {
      if (!isRecord(conceptPatch)) fail("malformed draft");
      if ("knowledgeUnitIds" in conceptPatch) fail("malformed draft");
      rejectKeys(conceptPatch, ["title", "aliases"], ["id"]);
      const index = concepts.findIndex((concept) => concept.id === id);
      if (index < 0) fail("malformed draft");
      const concept: PilotConcept = { ...concepts[index] };
      if (conceptPatch.title !== undefined) concept.title = asString(conceptPatch.title, "title");
      if (conceptPatch.aliases !== undefined) concept.aliases = stringList(conceptPatch.aliases);
      concepts[index] = concept;
    }
    content.concepts = concepts;
  }

  if (patch.objectives) {
    if (!isRecord(patch.objectives)) fail("malformed draft");
    const objectives = [...content.objectives];
    for (const [id, objectivePatch] of Object.entries(patch.objectives)) {
      if (!isRecord(objectivePatch)) fail("malformed draft");
      rejectKeys(objectivePatch, ["verb", "statement", "level"], ["id"]);
      const index = objectives.findIndex((objective) => objective.id === id);
      if (index < 0) fail("malformed draft");
      const objective = { ...objectives[index] };
      if (objectivePatch.verb !== undefined) objective.verb = oneOf(objectivePatch.verb, VERBS) as PilotObjective["verb"];
      if (objectivePatch.statement !== undefined) objective.statement = asString(objectivePatch.statement, "statement");
      if (objectivePatch.level !== undefined) objective.level = oneOf(objectivePatch.level, LEVELS) as PilotObjective["level"];
      objectives[index] = objective;
    }
    content.objectives = objectives;
  }

  if (patch.knowledgeUnits) {
    if (!isRecord(patch.knowledgeUnits)) fail("malformed draft");
    const units = [...content.knowledgeUnits];
    let concepts = [...content.concepts];
    for (const [id, unitPatch] of Object.entries(patch.knowledgeUnits)) {
      if (!isRecord(unitPatch)) fail("malformed draft");
      rejectKeys(
        unitPatch,
        ["title", "summary", "audience", "level", "scope", "validity", "extension", "conceptIds", "objectiveIds", "claimIds", "sourceReferenceIds", "blocks"],
        ["id", "contentVersion", "lifecycle"],
      );
      const index = units.findIndex((unit) => unit.id === id);
      if (index < 0) fail("missing knowledge unit");
      let unit: PilotKnowledgeUnit = { ...units[index] };
      if (unitPatch.title !== undefined) unit = { ...unit, title: asString(unitPatch.title, "title") };
      if (unitPatch.summary !== undefined) unit = { ...unit, summary: asString(unitPatch.summary, "summary") };
      if (unitPatch.audience !== undefined) unit = { ...unit, audience: asString(unitPatch.audience, "audience") };
      if (unitPatch.level !== undefined) unit = { ...unit, level: oneOf(unitPatch.level, LEVELS) as PilotKnowledgeUnit["level"] };
      if (unitPatch.scope !== undefined) unit = { ...unit, scope: unitPatch.scope };
      if (unitPatch.validity !== undefined) unit = { ...unit, validity: unitPatch.validity };
      if (unitPatch.extension !== undefined) unit = { ...unit, extension: replacementMap(unit.extension, unitPatch.extension) };
      if (unitPatch.conceptIds !== undefined) {
        const nextIds = stringList(unitPatch.conceptIds);
        if (nextIds.some((conceptId) => !conceptIds.has(conceptId))) fail("malformed draft");
        const previous = new Set(unit.conceptIds);
        const gained = nextIds.filter((conceptId) => !previous.has(conceptId));
        const lost = [...previous].filter((conceptId) => !nextIds.includes(conceptId));
        concepts = concepts.map((concept) => {
          let knowledgeUnitIds = [...concept.knowledgeUnitIds];
          if (lost.includes(concept.id)) knowledgeUnitIds = knowledgeUnitIds.filter((unitId) => unitId !== id);
          if (gained.includes(concept.id) && !knowledgeUnitIds.includes(id)) knowledgeUnitIds = [...knowledgeUnitIds, id];
          return knowledgeUnitIds === concept.knowledgeUnitIds ? concept : { ...concept, knowledgeUnitIds };
        });
        unit = { ...unit, conceptIds: nextIds };
      }
      if (unitPatch.objectiveIds !== undefined) {
        const ids = stringList(unitPatch.objectiveIds);
        if (ids.some((objectiveId) => !objectiveIds.has(objectiveId))) fail("malformed draft");
        unit = { ...unit, objectiveIds: ids };
      }
      if (unitPatch.claimIds !== undefined) {
        const ids = stringList(unitPatch.claimIds);
        if (ids.some((claimId) => !claimIds.has(claimId))) fail("malformed draft");
        unit = { ...unit, claimIds: ids };
      }
      if (unitPatch.sourceReferenceIds !== undefined) {
        const ids = stringList(unitPatch.sourceReferenceIds);
        if (ids.some((referenceId) => !referenceIds.has(referenceId))) fail("invalid source reference");
        unit = { ...unit, sourceReferenceIds: ids };
      }
      if (unitPatch.blocks) {
        if (!isRecord(unitPatch.blocks)) fail("malformed draft");
        const blocks = [...unit.blocks];
        for (const [blockId, blockPatch] of Object.entries(unitPatch.blocks)) {
          const blockIndex = blocks.findIndex((block) => block.id === blockId);
          if (blockIndex < 0) fail("malformed draft");
          blocks[blockIndex] = applyBlock(blocks[blockIndex], blockPatch, claimIds, referenceIds);
        }
        unit = { ...unit, blocks };
      }
      units[index] = unit;
    }
    content.knowledgeUnits = units;
    content.concepts = concepts;
  }

  if (patch.claims) {
    if (!isRecord(patch.claims)) fail("malformed draft");
    const claims = [...content.claims];
    for (const [id, claimPatch] of Object.entries(patch.claims)) {
      if (!isRecord(claimPatch)) fail("malformed draft");
      rejectKeys(
        claimPatch,
        ["statement", "kind", "interpretationStatus", "supportStatus", "sourceReferenceIds", "scope", "validity", "conflictGroupId"],
        ["id"],
      );
      const index = claims.findIndex((claim) => claim.id === id);
      if (index < 0) fail("broken claim relationship");
      const claim: PilotClaim = { ...claims[index] };
      if (claimPatch.statement !== undefined) claim.statement = asString(claimPatch.statement, "statement");
      if (claimPatch.kind !== undefined) claim.kind = oneOf(claimPatch.kind, CLAIM_KINDS) as PilotClaim["kind"];
      if (claimPatch.interpretationStatus !== undefined) {
        claim.interpretationStatus = oneOf(claimPatch.interpretationStatus, INTERPRETATION) as PilotInterpretationStatus;
      }
      if (claimPatch.supportStatus !== undefined) claim.supportStatus = oneOf(claimPatch.supportStatus, CLAIM_SUPPORT) as PilotClaim["supportStatus"];
      if (claimPatch.sourceReferenceIds !== undefined) {
        const ids = stringList(claimPatch.sourceReferenceIds);
        if (ids.length === 0 || ids.some((referenceId) => !referenceIds.has(referenceId))) fail("broken claim relationship");
        claim.sourceReferenceIds = ids;
      }
      if (claimPatch.scope !== undefined) claim.scope = claimPatch.scope;
      if (claimPatch.validity !== undefined) claim.validity = claimPatch.validity;
      if ("conflictGroupId" in claimPatch) {
        const group = typeof claimPatch.conflictGroupId === "string" ? claimPatch.conflictGroupId.trim() : "";
        if (!group) delete claim.conflictGroupId;
        else claim.conflictGroupId = group;
      }
      if (claim.interpretationStatus === "disputed" && !claim.conflictGroupId) fail("broken claim relationship");
      claims[index] = claim;
    }
    content.claims = claims;
  }

  if (patch.sources) {
    if (!isRecord(patch.sources)) fail("malformed draft");
    const sources = [...content.sources];
    for (const [id, sourcePatch] of Object.entries(patch.sources)) {
      if (!isRecord(sourcePatch)) fail("malformed draft");
      const index = sources.findIndex((source) => source.id === id);
      if (index < 0) fail("missing source");
      rejectKeys(
        sourcePatch,
        ["type", "title", "publisherOrOrganization", "reference", "language", "publicationDate", "accessedDate", "scope"],
        ["id", "url"],
      );
      const source = { ...sources[index] };
      if (sourcePatch.type !== undefined) source.type = oneOf(sourcePatch.type, SOURCE_TYPES) as PilotSource["type"];
      if (sourcePatch.title !== undefined) source.title = asString(sourcePatch.title, "title");
      if (sourcePatch.publisherOrOrganization !== undefined) source.publisherOrOrganization = asString(sourcePatch.publisherOrOrganization, "publisher");
      if (sourcePatch.reference !== undefined) source.reference = asString(sourcePatch.reference, "reference");
      if (sourcePatch.language !== undefined) source.language = asString(sourcePatch.language, "language");
      if (sourcePatch.publicationDate !== undefined) source.publicationDate = asString(sourcePatch.publicationDate, "publicationDate");
      if (sourcePatch.accessedDate !== undefined) source.accessedDate = asString(sourcePatch.accessedDate, "accessedDate");
      if (sourcePatch.scope !== undefined) source.scope = sourcePatch.scope;
      sources[index] = source;
    }
    content.sources = sources;
  }

  if (patch.sourceReferences) {
    if (!isRecord(patch.sourceReferences)) fail("malformed draft");
    const references = [...content.sourceReferences];
    for (const [id, referencePatch] of Object.entries(patch.sourceReferences)) {
      if (!isRecord(referencePatch)) fail("malformed draft");
      const index = references.findIndex((reference) => reference.id === id);
      if (index < 0) fail("invalid source reference");
      rejectKeys(referencePatch, ["sourceId", "supportType", "citation", "locator", "quote"], ["id"]);
      const reference = { ...references[index] };
      if ("sourceId" in referencePatch) {
        if (typeof referencePatch.sourceId !== "string" || !sourceIds.has(referencePatch.sourceId)) fail("missing source");
        reference.sourceId = referencePatch.sourceId;
      }
      if (referencePatch.supportType !== undefined) {
        if (!REFERENCE_SUPPORT.has(referencePatch.supportType)) fail("invalid source reference");
        reference.supportType = referencePatch.supportType;
      }
      if (referencePatch.citation !== undefined) {
        if (typeof referencePatch.citation !== "string" || !referencePatch.citation.trim()) fail("invalid source reference");
        reference.citation = referencePatch.citation;
      }
      if (referencePatch.locator !== undefined) reference.locator = asString(referencePatch.locator, "locator");
      if (referencePatch.quote !== undefined) reference.quote = asString(referencePatch.quote, "quote");
      references[index] = reference;
    }
    content.sourceReferences = references;
  }

  next.content = content;
  return next;
}
