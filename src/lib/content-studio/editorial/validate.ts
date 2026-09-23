import type { PilotPackage } from "@/lib/content/pilot/types";
import { evaluateProductionQuality } from "@/lib/content/production/workflow";
import type { ProductionRecord } from "@/lib/content/production/types";
import { buildReviewProjection } from "@/lib/content/review/projection";

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
const SCOPE_KINDS = new Set(["geographic", "institutional", "disciplinary", "temporal"]);
const MUST_NOT_BE_BLOCKED = new Set([
  "identity-structure",
  "knowledge-unit",
  "content-block",
  "objective",
  "claim",
  "provenance",
  "classification",
  "time-scope",
  "version-lifecycle",
  "assessment-alignment",
  "universal-core",
]);

function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

function assertScope(scope: { kind?: string; value?: string } | undefined): void {
  if (!scope) return;
  if (!SCOPE_KINDS.has(scope.kind ?? "") || typeof scope.value !== "string") fail("malformed draft");
}

export function assertActorLabel(actorLabel: string | undefined): void {
  if (actorLabel !== undefined && actorLabel.length > 80) fail("malformed draft");
}

export function assertEditablePackage(record: ProductionRecord): void {
  if (!record || typeof record !== "object" || !record.content?.topic) fail("malformed draft");
  if (record.workflowState !== "draft") fail("malformed draft");
  if (record.publishedAt !== undefined || record.supersedesVersion !== undefined) fail("malformed draft: immutable field");
  if (!Array.isArray(record.reviews)) fail("malformed draft");
  const content: PilotPackage = record.content;
  const topic = content.topic;
  if (topic.lifecycle !== "draft") fail("malformed draft");
  if (!Number.isInteger(topic.contentVersion) || topic.contentVersion < 1) fail("malformed draft");
  if (!PROVENANCE.has(topic.provenanceStatus) || !LEVELS.has(topic.level)) fail("malformed draft");
  if (!content.disciplineId || content.disciplineId !== topic.disciplineId) fail("malformed draft");
  if (!content.subjectId || content.subjectId !== topic.subjectId) fail("malformed draft");
  if (!Array.isArray(content.knowledgeUnits)) fail("missing knowledge unit");
  for (const unit of content.knowledgeUnits) {
    if (unit.contentVersion !== topic.contentVersion) fail("malformed draft");
    if (unit.lifecycle !== "draft") fail("malformed draft");
  }
  for (const alignment of content.assessmentAlignments ?? []) {
    if (alignment.contentVersion !== topic.contentVersion) fail("malformed draft");
  }
  if (content.knowledgeUnits.length === 0) fail("missing knowledge unit");
  const conceptIds = new Set(content.concepts.map((concept) => concept.id));
  const objectiveIds = new Set(content.objectives.map((objective) => objective.id));
  const claimIds = new Set(content.claims.map((claim) => claim.id));
  const sourceIds = new Set(content.sources.map((source) => source.id));
  const referenceIds = new Set(content.sourceReferences.map((reference) => reference.id));
  for (const objective of content.objectives) {
    if (!VERBS.has(objective.verb) || !LEVELS.has(objective.level) || !objective.statement.trim()) fail("malformed draft");
  }
  for (const source of content.sources) {
    if (!SOURCE_TYPES.has(source.type) || !source.title.trim() || !source.reference.trim()) fail("malformed draft");
    assertScope(source.scope);
  }
  for (const reference of content.sourceReferences) {
    if (!reference.sourceId || !sourceIds.has(reference.sourceId)) fail("missing source");
    if (!REFERENCE_SUPPORT.has(reference.supportType) || !reference.citation?.trim()) fail("invalid source reference");
  }
  for (const claim of content.claims) {
    if (!CLAIM_KINDS.has(claim.kind) || !INTERPRETATION.has(claim.interpretationStatus) || !CLAIM_SUPPORT.has(claim.supportStatus)) {
      fail("malformed draft");
    }
    if (claim.sourceReferenceIds.length === 0 || claim.sourceReferenceIds.some((id) => !referenceIds.has(id))) {
      fail("broken claim relationship");
    }
    if (claim.interpretationStatus === "disputed" && !claim.conflictGroupId) fail("broken claim relationship");
    assertScope(claim.scope);
  }
  for (const unit of content.knowledgeUnits) {
    if (!LEVELS.has(unit.level) || !unit.title.trim()) fail("malformed draft");
    if (unit.blocks.length === 0) fail("missing required block");
    if (unit.conceptIds.some((id: string) => !conceptIds.has(id))) fail("malformed draft");
    if (unit.objectiveIds.some((id: string) => !objectiveIds.has(id))) fail("malformed draft");
    if (unit.claimIds?.some((id: string) => !claimIds.has(id))) fail("malformed draft");
    if (unit.sourceReferenceIds?.some((id: string) => !referenceIds.has(id))) fail("invalid source reference");
    assertScope(unit.scope);
    for (const block of unit.blocks) {
      if (!BLOCK_TYPES.has(block.type)) fail("invalid block type");
      if (!block.payload || Object.keys(block.payload).length === 0) fail("missing required block");
      if (block.interpretationStatus && !INTERPRETATION.has(block.interpretationStatus)) fail("malformed draft");
      if (block.claimIds?.some((id: string) => !claimIds.has(id))) fail("malformed draft");
      if (block.sourceReferenceIds?.some((id: string) => !referenceIds.has(id))) fail("invalid source reference");
    }
  }
}

function assertStillDraft(before: ProductionRecord, evaluated: ProductionRecord): void {
  if (evaluated.workflowState !== "draft" || evaluated.content.topic.lifecycle !== "draft") fail("malformed draft");
  if (evaluated.content.knowledgeUnits.some((unit) => unit.lifecycle !== "draft")) fail("malformed draft");
  if (evaluated.content.topic.contentVersion !== before.content.topic.contentVersion) fail("malformed draft");
  for (const unit of evaluated.content.knowledgeUnits) {
    const baseline = before.content.knowledgeUnits.find((item) => item.id === unit.id);
    if (!baseline || unit.contentVersion !== baseline.contentVersion) fail("malformed draft");
  }
  const snapshot = evaluated.qualitySnapshot;
  if (!snapshot) fail("malformed draft");
  if (snapshot.contentId !== evaluated.content.topic.id || snapshot.contentVersion !== evaluated.content.topic.contentVersion) fail("malformed draft");
  if (snapshot.report.contentId !== snapshot.contentId || snapshot.report.contentVersion !== snapshot.contentVersion) fail("malformed draft");
  if (!snapshot.evaluatorVersion.trim() || Number.isNaN(Date.parse(snapshot.evaluatedAt))) fail("malformed draft");
}

export function validateEditorialDraft(record: ProductionRecord, evaluatedAt: string): ProductionRecord {
  assertEditablePackage(record);
  const evaluated = evaluateProductionQuality(record, evaluatedAt);
  assertStillDraft(record, evaluated);
  return evaluated;
}

export function previewEditorialAdvance(record: ProductionRecord, evaluatedAt: string): ProductionRecord {
  const evaluated = validateEditorialDraft(record, evaluatedAt);
  if (evaluated.publishedAt !== undefined) fail("invalid editorial transition");
  const report = evaluated.qualitySnapshot?.report;
  if (!report) fail("malformed draft");
  if (report.overall === "blocked") fail("editorial_quality_blocked");
  for (const result of report.dimensions) {
    if (MUST_NOT_BE_BLOCKED.has(result.dimension) && result.status === "blocked") fail("editorial_quality_blocked");
  }
  const projection = buildReviewProjection(evaluated);
  if (
    projection.lifecycle.workflowState !== "draft"
    || projection.lifecycle.deliverable
    || projection.lifecycle.aiGroundable
    || projection.lifecycle.publishable
  ) {
    fail("invalid editorial transition");
  }
  return evaluated;
}
