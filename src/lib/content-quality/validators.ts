import { projectPilotToAiGrounding, projectPilotToLearnerReferences, projectPilotToSearch, validatePilotPackage } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import type { QualityDimension, QualityIssue } from "./types";

const issue = (dimension: QualityDimension, code: string, path: string, message: string, severity: QualityIssue["severity"] = "blocker"): QualityIssue => ({ code: `${dimension}.${code}`, severity, path, message });
const empty = (): QualityIssue[] => [];

export function validateIdentity(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (!/^topic\/[a-z0-9-]+\/[a-z0-9-]+$/.test(pkg.topic.id)) issues.push(issue("identity-structure", "invalid-topic-id", "topic.id", "Topic identity must be deterministic and namespaced."));
  if (pkg.topic.id.split("/")[1] !== pkg.subjectId.replace(/^subject\//, "")) issues.push(issue("identity-structure", "subject-mismatch", "topic.subjectId", "Topic subject does not match package subject."));
  const ids = new Set<string>();
  for (const collection of [pkg.concepts, pkg.objectives, pkg.knowledgeUnits, pkg.claims, pkg.sources, pkg.sourceReferences, pkg.assessmentAlignments]) {
    for (const item of collection) {
      const id = item.id;
      if (!id.trim() || ids.has(id)) issues.push(issue("identity-structure", "duplicate-id", id || "package", "IDs must be non-empty and unique within a package."));
      ids.add(id);
    }
  }
  return issues;
}

export function validateKnowledgeUnits(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const unit of pkg.knowledgeUnits) {
    if (!unit.title.trim() || unit.blocks.length === 0) issues.push(issue("knowledge-unit", "incomplete-unit", unit.id, "KnowledgeUnit requires a title and at least one semantic block."));
    for (const conceptId of unit.conceptIds) if (!pkg.concepts.some((concept) => concept.id === conceptId)) issues.push(issue("knowledge-unit", "missing-concept", unit.id, `Unknown concept reference ${conceptId}.`));
    for (const objectiveId of unit.objectiveIds) if (!pkg.objectives.some((objective) => objective.id === objectiveId)) issues.push(issue("knowledge-unit", "missing-objective", unit.id, `Unknown objective reference ${objectiveId}.`));
  }
  return issues;
}

export function validateBlocks(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const allowed = new Set(["definition", "explanation", "mechanism-process", "chronology", "comparison", "cause-effect", "example", "case-study", "formula-rule", "exception", "misconception", "procedure-derivation"]);
  for (const unit of pkg.knowledgeUnits) {
    const orders = new Set<number>();
    for (const contentBlock of unit.blocks) {
      if (!allowed.has(contentBlock.type) || !Number.isInteger(contentBlock.order) || orders.has(contentBlock.order) || Object.keys(contentBlock.payload).length === 0) issues.push(issue("content-block", "invalid-block", `${unit.id}.${contentBlock.id}`, "Block type, order, and payload must be valid without requiring a fixed block sequence."));
      orders.add(contentBlock.order);
    }
  }
  return issues;
}

export function validateObjectives(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const objective of pkg.objectives) {
    if (!objective.statement.trim() || !objective.verb) issues.push(issue("objective", "invalid-objective", objective.id, "Objective statement and observable verb are required."));
  }
  for (const objectiveId of pkg.topic.objectiveIds) if (!pkg.objectives.some((objective) => objective.id === objectiveId)) issues.push(issue("objective", "dangling-objective", "topic.objectiveIds", `Unknown objective reference ${objectiveId}.`));
  return issues;
}

export function validateClaimsAndProvenance(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const claim of pkg.claims) {
    if (claim.sourceReferenceIds.length === 0) issues.push(issue("claim", "missing-evidence", claim.id, "Material claims require evidence."));
    if (claim.interpretationStatus === "disputed" && !claim.conflictGroupId) issues.push(issue("classification", "missing-conflict-group", claim.id, "Disputed claims require a conflict group."));
    for (const referenceId of claim.sourceReferenceIds) if (!pkg.sourceReferences.some((reference) => reference.id === referenceId)) issues.push(issue("claim", "dangling-evidence", claim.id, `Unknown source reference ${referenceId}.`));
  }
  for (const reference of pkg.sourceReferences) {
    const source = pkg.sources.find((item) => item.id === reference.sourceId);
    if (!source || !reference.citation.trim()) issues.push(issue("provenance", "invalid-reference", reference.id, "Source reference must resolve to a source and include a readable citation."));
  }
  for (const source of pkg.sources) if (!source.title.trim() || !source.publisherOrOrganization.trim() || !source.reference.trim()) issues.push(issue("provenance", "incomplete-source", source.id, "Source title, publisher, and reference are required."));
  return issues;
}

export function validateTimeScope(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const check = (path: string, validity: { effectiveFrom?: string; effectiveUntil?: string; reviewBy?: string } | undefined) => {
    if (!validity) return;
    const dates = Object.values(validity).filter((value): value is string => Boolean(value));
    if (dates.some((value) => !/^\d{4}-\d{2}-\d{2}$/.test(value))) issues.push(issue("time-scope", "invalid-date", path, "Dates must use YYYY-MM-DD."));
    if (validity.effectiveFrom && validity.effectiveUntil && validity.effectiveFrom > validity.effectiveUntil) issues.push(issue("time-scope", "inverted-range", path, "Effective date range is inverted."));
  };
  for (const claim of pkg.claims) check(claim.id, claim.validity);
  for (const unit of pkg.knowledgeUnits) check(unit.id, unit.validity);
  return issues;
}

export function validateVersionLifecycle(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (!Number.isInteger(pkg.topic.contentVersion) || pkg.topic.contentVersion < 1 || pkg.topic.lifecycle !== "published") issues.push(issue("version-lifecycle", "invalid-topic-publication", "topic", "Published content requires a positive integer version."));
  for (const unit of pkg.knowledgeUnits) if (!Number.isInteger(unit.contentVersion) || unit.contentVersion < 1 || unit.lifecycle !== "published") issues.push(issue("version-lifecycle", "invalid-unit-publication", unit.id, "KnowledgeUnit publication metadata is invalid."));
  return issues;
}

export function validateAssessment(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const alignment of pkg.assessmentAlignments) {
    if (!/^pilot\/[a-z0-9-]+\/[a-z0-9-]+$/.test(alignment.assessmentSetId) || alignment.knowledgeUnitIds.length === 0) issues.push(issue("assessment-alignment", "invalid-reference", alignment.id, "Assessment alignment must be a reference with valid unit IDs."));
    for (const unitId of alignment.knowledgeUnitIds) if (!pkg.knowledgeUnits.some((unit) => unit.id === unitId)) issues.push(issue("assessment-alignment", "dangling-unit", alignment.id, `Unknown unit reference ${unitId}.`));
    if ("answer" in alignment || "score" in alignment || "correctness" in alignment) issues.push(issue("assessment-alignment", "scoring-leak", alignment.id, "Assessment alignment cannot contain scoring or answer state."));
  }
  return issues;
}

export function validateSearch(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const projection = projectPilotToSearch(pkg);
  if (projection.length === 0 || projection.some((item) => !item.id || !item.title || !item.searchText)) issues.push(issue("search-eligibility", "invalid-projection", "search", "Published content must produce a safe search projection."));
  const serialized = JSON.stringify(pkg);
  for (const forbidden of ["answer", "correctAnswer", "learnerId", "learnerState", "mcqResults", "apiKey"]) if (serialized.toLowerCase().includes(`"${forbidden.toLowerCase()}"`)) issues.push(issue("search-eligibility", "private-data", "package", `Forbidden private or answer field ${forbidden} is present.`));
  return issues;
}

export function validateAi(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (pkg.topic.lifecycle !== "published" || pkg.knowledgeUnits.some((unit) => unit.lifecycle !== "published")) issues.push(issue("ai-grounding", "not-published", "package", "Only published content may be AI-groundable."));
  if (projectPilotToAiGrounding(pkg).some((item) => item.sourceReferenceIds.length === 0)) issues.push(issue("ai-grounding", "missing-provenance", "grounding", "Grounding projections require source references."));
  return issues;
}

export function validateLearner(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const reference of projectPilotToLearnerReferences(pkg)) if (!/^unit\/[a-z0-9-]+\/[a-z0-9-]+@v\d+$/.test(reference)) issues.push(issue("learner-compatibility", "invalid-reference", "learner", `Invalid learner reference ${reference}.`));
  return issues;
}

export function validateUniversalCore(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const serialized = JSON.stringify(pkg);
  for (const forbidden of ["html", "css", "pageSection", "sidebar", "accordion", "examNote", "quickRevision"]) if (serialized.includes(`"${forbidden}"`)) issues.push(issue("universal-core", "presentation-leak", "package", `Presentation field ${forbidden} cannot be part of the universal core.`));
  return issues;
}

export function validateOptionalEnrichment(pkg: PilotPackage): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (pkg.concepts.some((concept) => concept.aliases.length === 0)) {
    issues.push(issue("publication-readiness", "missing-alias", "concepts", "One or more concepts have no optional aliases.", "warning"));
  }
  return issues;
}

export function validateStructureWithPilotRules(pkg: PilotPackage): QualityIssue[] {
  try {
    validatePilotPackage(pkg);
    return empty();
  } catch (error) {
    return [issue("identity-structure", "pilot-structure", "package", error instanceof Error ? error.message : "Pilot structure is invalid.")];
  }
}
