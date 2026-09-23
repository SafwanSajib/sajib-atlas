export type PilotLifecycle = "draft" | "review" | "published" | "deprecated" | "archived" | "replaced";

export type PilotBlockType =
  | "definition"
  | "explanation"
  | "mechanism-process"
  | "chronology"
  | "comparison"
  | "cause-effect"
  | "example"
  | "case-study"
  | "formula-rule"
  | "exception"
  | "misconception"
  | "procedure-derivation";

export type PilotInterpretationStatus =
  | "fact"
  | "interpretation"
  | "synthesis"
  | "illustrative"
  | "disputed";

export type PilotSourceType =
  | "government"
  | "international-organization"
  | "university"
  | "academic-paper"
  | "textbook"
  | "reference-editorial";

export type PilotScope = {
  kind: "geographic" | "institutional" | "disciplinary" | "temporal";
  value: string;
};

export type PilotValidity = {
  effectiveFrom?: string;
  effectiveUntil?: string;
  reviewBy?: string;
};

export type PilotSource = {
  id: string;
  type: PilotSourceType;
  title: string;
  publisherOrOrganization: string;
  reference: string;
  language: string;
  publicationDate?: string;
  accessedDate?: string;
  scope?: PilotScope;
};

export type PilotSourceReference = {
  id: string;
  sourceId: string;
  supportType: "direct" | "synthesized" | "contextual";
  citation: string;
  locator?: string;
  quote?: string;
};

export type PilotClaim = {
  id: string;
  statement: string;
  kind: "factual" | "historical" | "definition" | "interpretive";
  interpretationStatus: PilotInterpretationStatus;
  supportStatus: "verified" | "corroborated" | "synthesized" | "disputed";
  sourceReferenceIds: readonly string[];
  scope?: PilotScope;
  validity?: PilotValidity;
  conflictGroupId?: string;
};

export type PilotObjective = {
  id: string;
  verb: "explain" | "distinguish" | "apply" | "analyze";
  statement: string;
  level: "foundational" | "intermediate";
};

export type PilotContentBlock = {
  id: string;
  type: PilotBlockType;
  order: number;
  interpretationStatus?: PilotInterpretationStatus;
  claimIds?: readonly string[];
  sourceReferenceIds?: readonly string[];
  payload: Readonly<Record<string, string | readonly string[]>>;
};

export type PilotKnowledgeUnit = {
  id: string;
  title: string;
  summary?: string;
  conceptIds: readonly string[];
  objectiveIds: readonly string[];
  blocks: readonly PilotContentBlock[];
  contentVersion: number;
  lifecycle: PilotLifecycle;
  claimIds?: readonly string[];
  sourceReferenceIds?: readonly string[];
  audience: string;
  level: "foundational" | "intermediate";
  scope?: PilotScope;
  validity?: PilotValidity;
  extension?: Readonly<Record<string, string | readonly string[]>>;
};

export type PilotConcept = {
  id: string;
  title: string;
  aliases: readonly string[];
  knowledgeUnitIds: readonly string[];
};

export type PilotAssessmentAlignment = {
  id: string;
  objectiveIds: readonly string[];
  conceptIds: readonly string[];
  knowledgeUnitIds: readonly string[];
  assessmentSetId: string;
  assessmentItemId?: string;
  contentVersion: number;
};

export type PilotTopic = {
  id: string;
  disciplineId: string;
  subjectId: string;
  categoryId?: string;
  title: string;
  summary: string;
  contentVersion: number;
  lifecycle: PilotLifecycle;
  conceptIds: readonly string[];
  knowledgeUnitIds: readonly string[];
  objectiveIds: readonly string[];
  assessmentAlignmentIds: readonly string[];
  audience: string;
  level: "foundational" | "intermediate";
  provenanceStatus: "verified" | "corroborated" | "synthesized" | "disputed";
};

export type PilotPackage = {
  disciplineId: string;
  subjectId: string;
  topic: PilotTopic;
  concepts: readonly PilotConcept[];
  objectives: readonly PilotObjective[];
  knowledgeUnits: readonly PilotKnowledgeUnit[];
  claims: readonly PilotClaim[];
  sources: readonly PilotSource[];
  sourceReferences: readonly PilotSourceReference[];
  assessmentAlignments: readonly PilotAssessmentAlignment[];
};

export type PilotSearchProjection = {
  id: string;
  kind: "topic" | "concept" | "knowledge_unit";
  title: string;
  canonicalId: string;
  topicId: string;
  subjectId: string;
  contentVersion: number;
  lifecycle: PilotLifecycle;
  keywords: readonly string[];
  searchText: string;
};

export type PilotAiGroundingProjection = {
  sourceId: string;
  title: string;
  subjectId: string;
  topicId: string;
  conceptId: string;
  knowledgeUnitId: string;
  blockType: PilotBlockType;
  contentVersion: number;
  lifecycle: "published";
  interpretationStatus: PilotInterpretationStatus;
  sourceReferenceIds: readonly string[];
  audience: string;
};
