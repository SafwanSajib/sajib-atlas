import type { PilotPackage } from "@/lib/content/pilot/index";

export type QualitySeverity = "blocker" | "warning";
export type QualityStatus = "pass" | "warning" | "blocked";
export type QualityDimension =
  | "identity-structure"
  | "knowledge-unit"
  | "content-block"
  | "objective"
  | "claim"
  | "provenance"
  | "classification"
  | "time-scope"
  | "version-lifecycle"
  | "assessment-alignment"
  | "search-eligibility"
  | "ai-grounding"
  | "learner-compatibility"
  | "universal-core"
  | "publication-readiness";

export type QualityIssue = {
  code: string;
  severity: QualitySeverity;
  path: string;
  message: string;
};

export type QualityDimensionResult = {
  dimension: QualityDimension;
  status: QualityStatus;
  issues: readonly QualityIssue[];
};

export type ContentQualityReport = {
  contentId: string;
  contentVersion: number;
  overall: QualityStatus;
  dimensions: readonly QualityDimensionResult[];
};

export type QualityInput = PilotPackage;
