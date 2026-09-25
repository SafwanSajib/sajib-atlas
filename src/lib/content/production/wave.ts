import { getReviewRecord, replaceReviewRecord } from "@/lib/content/review/registry";
import {
  approveProduction,
  evaluateProductionQuality,
  isProductionAiEligible,
  projectProductionDelivery,
  publishProduction,
  recordProductionReview,
  submitProductionForReview,
} from "./index";
import type { ProductionRecord, ProductionWorkflowState } from "./types";

export type WaveOperatorReview = {
  type: "editorial" | "academic-source";
  outcome: "passed" | "failed" | "warning";
  reviewerId: string;
  reviewedAt: string;
};

export type WaveTopicResult = {
  topicId: string;
  outcome: "published" | "blocked";
  blockers: readonly string[];
  contentVersion: number;
  workflowState: ProductionWorkflowState;
  delivery: "returned" | "undefined";
  aiGroundable: boolean;
  editorialFile: "no editorial file";
};

function reviewsFor(input: {
  operatorReviews?: readonly WaveOperatorReview[];
  operatorReviewsByTopic?: Readonly<Record<string, readonly WaveOperatorReview[]>>;
}, topicId: string): readonly WaveOperatorReview[] | undefined {
  if (input.operatorReviewsByTopic && Object.prototype.hasOwnProperty.call(input.operatorReviewsByTopic, topicId)) {
    return input.operatorReviewsByTopic[topicId];
  }
  return input.operatorReviews;
}

function packetBlockers(reviews: readonly WaveOperatorReview[] | undefined): string[] {
  if (!reviews || reviews.length === 0) return ["missing-editorial-review", "missing-academic-source-review"];
  const blockers: string[] = [];
  if (!reviews.some((review) => review.type === "editorial")) blockers.push("missing-editorial-review");
  if (!reviews.some((review) => review.type === "academic-source")) blockers.push("missing-academic-source-review");
  for (const review of reviews) {
    if (!review.reviewerId.trim() || !review.reviewedAt.trim() || Number.isNaN(Date.parse(review.reviewedAt))) {
      blockers.push("reviewer and review timestamp are required");
    }
    if (review.outcome !== "passed") blockers.push("review outcome is not passed");
  }
  return [...new Set(blockers)];
}

function blocked(topicId: string, blockers: readonly string[], record = getReviewRecord(topicId)): WaveTopicResult {
  return {
    topicId,
    outcome: "blocked",
    blockers,
    contentVersion: record?.content.topic.contentVersion ?? 0,
    workflowState: record?.workflowState ?? "draft",
    delivery: "undefined",
    aiGroundable: false,
    editorialFile: "no editorial file",
  };
}

function snapshotMatchesIdentity(record: ProductionRecord): boolean {
  const snapshot = record.qualitySnapshot;
  if (!snapshot) return false;
  return snapshot.contentId === record.content.topic.id
    && snapshot.contentVersion === record.content.topic.contentVersion
    && snapshot.report.contentId === snapshot.contentId
    && snapshot.report.contentVersion === snapshot.contentVersion;
}

function executePublicationWaveTopic(
  topicId: string,
  record: ProductionRecord,
  reviews: readonly WaveOperatorReview[],
  publishedAt: string,
): WaveTopicResult {
  // Idempotency: an already-published record is returned as published without re-publishing
  // or re-recording reviews (design §11 resume, §15 case 16).
  if (record.workflowState === "published" && record.publishedAt) {
    const delivered = projectProductionDelivery(record);
    return {
      topicId,
      outcome: "published",
      blockers: [],
      contentVersion: record.content.topic.contentVersion,
      workflowState: record.workflowState,
      delivery: delivered ? "returned" : "undefined",
      aiGroundable: isProductionAiEligible(record),
      editorialFile: "no editorial file",
    };
  }

  // Quality Gate boundary (design §8/§120): ensure a snapshot exists. A missing snapshot is
  // evaluated, never assigned pass by hand. A present snapshot is validated and never repaired.
  const withSnapshot = record.qualitySnapshot
    ? record
    : evaluateProductionQuality(record);
  if (withSnapshot.qualitySnapshot && !snapshotMatchesIdentity(withSnapshot)) {
    return blocked(topicId, ["quality snapshot does not match content identity"], record);
  }
  if (withSnapshot.qualitySnapshot?.report.overall === "blocked") {
    return blocked(topicId, ["quality blockers prevent publication"], record);
  }

  // Operator-supplied review evidence only (design §9). One passed row of each type is required.
  const editorial = reviews.find((r) => r.type === "editorial");
  const academic = reviews.find((r) => r.type === "academic-source");
  if (!editorial || !academic) {
    return blocked(topicId, ["missing-editorial-review", "missing-academic-source-review"], record);
  }

  // Canonical publication sequence (design §7). Workflow functions do not mutate inputs, and the
  // registry slot is replaced only after a successful publishProduction return (design §16).
  let working = submitProductionForReview(withSnapshot);
  working = recordProductionReview(working, {
    type: "editorial",
    outcome: "passed",
    reviewerId: editorial.reviewerId,
    reviewedAt: editorial.reviewedAt,
  });
  working = recordProductionReview(working, {
    type: "academic-source",
    outcome: "passed",
    reviewerId: academic.reviewerId,
    reviewedAt: academic.reviewedAt,
  });
  const approved = approveProduction(working);
  const published = publishProduction(approved, publishedAt);
  replaceReviewRecord(topicId, published);
  const delivered = projectProductionDelivery(published);
  return {
    topicId,
    outcome: "published",
    blockers: [],
    contentVersion: published.content.topic.contentVersion,
    workflowState: published.workflowState,
    delivery: delivered ? "returned" : "undefined",
    aiGroundable: isProductionAiEligible(published),
    editorialFile: "no editorial file",
  };
}

export function runPublicationWave(input: {
  topicIds: readonly string[];
  operatorReviews?: readonly WaveOperatorReview[];
  operatorReviewsByTopic?: Readonly<Record<string, readonly WaveOperatorReview[]>>;
  publishedAt: string;
}): readonly WaveTopicResult[] {
  return input.topicIds.map((topicId) => {
    const record = getReviewRecord(topicId);
    if (!record) return blocked(topicId, ["unknown review record"]);
    const reviews = reviewsFor(input, topicId);
    const blockers = packetBlockers(reviews);
    if (blockers.length > 0) return blocked(topicId, blockers, record);
    try {
      return executePublicationWaveTopic(topicId, record, reviews!, input.publishedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return blocked(topicId, [message], record);
    }
  });
}
