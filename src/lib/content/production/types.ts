import type { ContentQualityReport } from "@/lib/content-quality";
import type { PilotPackage } from "@/lib/content/pilot/index";

export type ProductionWorkflowState =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "deprecated"
  | "archived";

export type ProductionReviewType = "editorial" | "academic-source" | "automated";
export type ProductionReviewOutcome = "passed" | "failed" | "warning";

export type ProductionReview = {
  type: ProductionReviewType;
  outcome: ProductionReviewOutcome;
  reviewerId: string;
  reviewedAt: string;
  notes?: string;
  contentVersion: number;
};

export type ProductionQualitySnapshot = {
  contentId: string;
  contentVersion: number;
  evaluatedAt: string;
  evaluatorVersion: string;
  report: ContentQualityReport;
};

export type ProductionRecord = {
  content: PilotPackage;
  workflowState: ProductionWorkflowState;
  reviews: readonly ProductionReview[];
  qualityReport?: ContentQualityReport;
  qualitySnapshot?: ProductionQualitySnapshot;
  publishedAt?: string;
  supersedesVersion?: number;
};
