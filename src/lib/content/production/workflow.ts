import { validateContentQuality } from "@/lib/content-quality/index";
import type { PilotLifecycle, PilotPackage } from "@/lib/content/pilot/index";
import type {
  ProductionRecord,
  ProductionQualitySnapshot,
  ProductionReview,
  ProductionReviewType,
  ProductionWorkflowState,
} from "./types";

const transitions: Readonly<Record<ProductionWorkflowState, readonly ProductionWorkflowState[]>> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["deprecated"],
  deprecated: ["archived"],
  archived: [],
};

function fail(message: string): never {
  throw new Error(`Canonical content production: ${message}`);
}

function lifecycleForState(state: ProductionWorkflowState): PilotLifecycle {
  if (state === "draft") return "draft";
  if (state === "review") return "review";
  if (state === "deprecated") return "deprecated";
  if (state === "archived") return "archived";
  return "published";
}

function withLifecycle(content: PilotPackage, lifecycle: PilotLifecycle): PilotPackage {
  return {
    ...content,
    topic: { ...content.topic, lifecycle },
    knowledgeUnits: content.knowledgeUnits.map((unit) => ({ ...unit, lifecycle })),
  };
}

function transition(record: ProductionRecord, next: ProductionWorkflowState): ProductionRecord {
  if (!transitions[record.workflowState].includes(next)) {
    fail(`invalid transition ${record.workflowState} -> ${next}`);
  }
  return {
    ...record,
    workflowState: next,
    content: withLifecycle(record.content, lifecycleForState(next)),
  };
}

export function createProductionDraft(content: PilotPackage): ProductionRecord {
  if (content.topic.contentVersion < 1) fail("draft requires a positive content version");
  return {
    content: withLifecycle(content, "draft"),
    workflowState: "draft",
    reviews: [],
  };
}

export function submitProductionForReview(record: ProductionRecord): ProductionRecord {
  return transition(record, "review");
}

export function recordProductionReview(
  record: ProductionRecord,
  review: Omit<ProductionReview, "contentVersion">,
): ProductionRecord {
  if (record.workflowState !== "review") fail("reviews are accepted only in review state");
  if (!review.reviewerId.trim() || !review.reviewedAt.trim()) fail("reviewer and review timestamp are required");
  if (review.type === "automated") fail("automated review is recorded by the quality gate");
  return {
    ...record,
    reviews: [...record.reviews, { ...review, contentVersion: record.content.topic.contentVersion }],
  };
}

function publicationCandidate(record: ProductionRecord): PilotPackage {
  return withLifecycle(record.content, "published");
}

export function evaluateProductionQuality(
  record: ProductionRecord,
  evaluatedAt = "1970-01-01T00:00:00.000Z",
  evaluatorVersion = "content-quality-gate/v1",
): ProductionRecord {
  if (Number.isNaN(Date.parse(evaluatedAt)) || !evaluatorVersion.trim()) {
    fail("quality evaluation metadata is invalid");
  }
  const report = validateContentQuality(publicationCandidate(record));
  const snapshot: ProductionQualitySnapshot = {
    contentId: record.content.topic.id,
    contentVersion: record.content.topic.contentVersion,
    evaluatedAt,
    evaluatorVersion,
    report,
  };
  return { ...record, qualityReport: report, qualitySnapshot: snapshot };
}

function hasPassedReview(record: ProductionRecord, type: ProductionReviewType): boolean {
  return record.reviews.some((review) => review.type === type && review.outcome === "passed");
}

export function approveProduction(record: ProductionRecord): ProductionRecord {
  if (record.workflowState !== "review") fail("only review content can be approved");
  const evaluated = record.qualitySnapshot ? record : evaluateProductionQuality(record);
  if (evaluated.qualitySnapshot?.report.overall === "blocked") fail("quality blockers prevent approval");
  if (!hasPassedReview(evaluated, "editorial") || !hasPassedReview(evaluated, "academic-source")) {
    fail("editorial and academic-source reviews must pass before approval");
  }
  return transition(evaluated, "approved");
}

export function publishProduction(record: ProductionRecord, publishedAt: string): ProductionRecord {
  if (record.workflowState !== "approved") fail("only approved content can be published");
  if (!publishedAt.trim()) fail("publication timestamp is required");
  const evaluated = record.qualitySnapshot ? record : evaluateProductionQuality(record);
  if (evaluated.qualitySnapshot?.report.overall === "blocked") fail("quality blockers prevent publication");
  return {
    ...transition(evaluated, "published"),
    publishedAt,
  };
}

export function deprecateProduction(record: ProductionRecord): ProductionRecord {
  return transition(record, "deprecated");
}

export function archiveProduction(record: ProductionRecord): ProductionRecord {
  return transition(record, "archived");
}

export function createProductionCorrection(
  published: ProductionRecord,
  correctedContent: PilotPackage,
): ProductionRecord {
  if (published.workflowState !== "published" && published.workflowState !== "deprecated") {
    fail("corrections require a published or deprecated version");
  }
  if (correctedContent.topic.id !== published.content.topic.id) fail("correction identity must remain stable");
  if (correctedContent.topic.contentVersion !== published.content.topic.contentVersion + 1) {
    fail("correction must increment content version by exactly one");
  }
  return {
    ...createProductionDraft(correctedContent),
    supersedesVersion: published.content.topic.contentVersion,
  };
}

export function isProductionDeliveryEligible(record: ProductionRecord): boolean {
  return record.workflowState === "published"
    && record.content.topic.lifecycle === "published"
    && record.qualitySnapshot !== undefined
    && record.qualitySnapshot.contentId === record.content.topic.id
    && record.qualitySnapshot.contentVersion === record.content.topic.contentVersion
    && record.qualitySnapshot.report.overall !== "blocked";
}

export function isProductionAiEligible(record: ProductionRecord): boolean {
  return isProductionDeliveryEligible(record);
}
