import type { ProductionQualitySnapshot, ProductionRecord } from "@/lib/content/production/index";
import type {
  PilotAssessmentAlignment,
  PilotClaim,
  PilotConcept,
  PilotContentBlock,
  PilotKnowledgeUnit,
  PilotObjective,
  PilotSource,
  PilotSourceReference,
  PilotTopic,
} from "@/lib/content/pilot/index";

export type ReviewQualityDisplayStatus = "PASS" | "WARNING" | "FAIL" | "NOT EVALUATED";

export type ReviewQualitySnapshot = ProductionQualitySnapshot;

export type ReviewContentBlock = Pick<PilotContentBlock, "id" | "type" | "order" | "interpretationStatus" | "payload">;
export type ReviewKnowledgeUnit = Pick<
  PilotKnowledgeUnit,
  "id" | "title" | "summary" | "conceptIds" | "objectiveIds" | "audience" | "level" | "scope" | "validity" | "extension"
> & {
  blocks: readonly ReviewContentBlock[];
};

export type ReviewProjection = {
  identity: {
    disciplineId: string;
    subjectId: string;
    categoryId?: string;
    topicId: string;
    title: string;
    contentVersion: number;
  };
  content: {
    topic: Pick<PilotTopic, "id" | "title" | "summary" | "audience" | "level" | "provenanceStatus">;
    concepts: readonly Pick<PilotConcept, "id" | "title" | "aliases">[];
    objectives: readonly Pick<PilotObjective, "id" | "verb" | "statement" | "level">[];
    knowledgeUnits: readonly ReviewKnowledgeUnit[];
  };
  evidence: {
    claims: readonly Pick<PilotClaim, "id" | "statement" | "kind" | "interpretationStatus" | "supportStatus" | "scope" | "validity" | "conflictGroupId">[];
    sources: readonly Pick<PilotSource, "id" | "type" | "title" | "publisherOrOrganization" | "reference" | "language" | "publicationDate" | "accessedDate" | "scope">[];
    sourceReferences: readonly Pick<PilotSourceReference, "id" | "sourceId" | "supportType" | "citation" | "locator" | "quote">[];
  };
  lifecycle: {
    workflowState: ProductionRecord["workflowState"];
    contentLifecycle: PilotTopic["lifecycle"];
    contentVersion: number;
    publishedAt?: string;
    supersedesVersion?: number;
    previewable: boolean;
    deliverable: boolean;
    aiGroundable: boolean;
    publishable: boolean;
  };
  quality: {
    evaluationStatus: "evaluated" | "not-evaluated";
    status: ReviewQualityDisplayStatus;
    snapshot?: ReviewQualitySnapshot;
  };
  integrations: {
    assessment: readonly Pick<PilotAssessmentAlignment, "id" | "objectiveIds" | "conceptIds" | "knowledgeUnitIds" | "assessmentSetId" | "assessmentItemId" | "contentVersion">[];
    search: { eligible: boolean; projectionIds: readonly string[] };
    ai: { eligible: boolean; groundingSourceIds: readonly string[] };
    learner: { valid: boolean; referenceIds: readonly string[] };
  };
};
