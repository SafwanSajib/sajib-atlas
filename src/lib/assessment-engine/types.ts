/**
 * Universal assessment domain contracts (Phase 3A).
 *
 * Topic Engine discovers assessment capability.
 * Assessment Engine (later increments) runs assessment.
 * These types do not load payload, score, persist, or own set identity.
 *
 * Canonical assessment-set identity remains src/lib/assessment/.
 * Geography MCQ payload remains src/lib/geography-data.ts.
 *
 * JSON-safe primitives only. No Date, Map, Set, functions, React, or `any`.
 */

/**
 * Delivery/response modality. Only `mcq` has a concrete shape in Phase 3A.
 * Other values are reserved vocabulary for later increments.
 */
export const ASSESSMENT_MODALITIES = [
  "mcq",
  "true-false",
  "multi-select",
  "short-answer",
  "matching",
  "ordering",
  "written",
] as const;
export type AssessmentModality = (typeof ASSESSMENT_MODALITIES)[number];
export const CURRENT_ASSESSMENT_MODALITY: AssessmentModality = "mcq";

/**
 * How a session is delivered. Distinct from AssessmentSet.kind (`mcq-practice`).
 * Only `practice` is in scope for Phase 3 behavior later.
 */
export const ASSESSMENT_SESSION_MODES = [
  "practice",
  "timed",
  "mock",
  "exam",
  "review",
] as const;
export type AssessmentSessionMode = (typeof ASSESSMENT_SESSION_MODES)[number];
export const CURRENT_ASSESSMENT_SESSION_MODE: AssessmentSessionMode = "practice";

export const ASSESSMENT_SESSION_STATUSES = ["in-progress", "completed", "abandoned"] as const;
export type AssessmentSessionStatus = (typeof ASSESSMENT_SESSION_STATUSES)[number];

export const ASSESSMENT_RESULT_STATUSES = ["completed"] as const;
export type AssessmentResultStatus = (typeof ASSESSMENT_RESULT_STATUSES)[number];

/**
 * Delivery-scoped question identity. Not an eternal question id.
 * Not an array index in an unversioned payload.
 * If payload changes, contentVersion must be incremented before these keys
 * can represent a new snapshot. Enforcement is not implemented in 3A.
 */
export type AssessmentQuestionKey = {
  assessmentSetId: string;
  contentVersion: number;
  ordinal: number;
};

export type McqDeliveryQuestion = {
  questionKey: AssessmentQuestionKey;
  modality: "mcq";
  question: string;
  options: readonly string[];
  /** Correct answer stays in payload/scoring. Not part of delivery. */
  answer?: never;
  explanation?: never;
  shortcutOrTrap?: never;
  module?: never;
  field?: never;
};

/** Phase 3A delivery union. Future modalities add members; they must not reuse MCQ fields. */
export type AssessmentDeliveryQuestion = McqDeliveryQuestion;

export type AssessmentDelivery = {
  assessmentSetId: string;
  contentVersion: number;
  mode: AssessmentSessionMode;
  questions: readonly AssessmentDeliveryQuestion[];
  module?: never;
  field?: never;
  payload?: never;
};

export type McqAssessmentResponse = {
  questionKey: AssessmentQuestionKey;
  modality: "mcq";
  /** Canonical option text. Null = unanswered. Not an index or A/B/C letter. */
  selectedOption: string | null;
};

export type AssessmentResponse = McqAssessmentResponse;

export type McqQuestionOutcome = {
  questionKey: AssessmentQuestionKey;
  modality: "mcq";
  correct: boolean;
  selectedOption: string | null;
  answer?: never;
};

export type AssessmentQuestionOutcome = McqQuestionOutcome;

/**
 * Raw assessment result. Totals are described, not computed, in Phase 3A.
 * Not mastery, weakness, or recommendation.
 */
export type AssessmentResult = {
  assessmentSetId: string;
  contentVersion: number;
  sessionId: string;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  percentage: number;
  status: AssessmentResultStatus;
  outcomes: readonly AssessmentQuestionOutcome[];
};

/**
 * In-memory session contract. sessionId is opaque and is not derived from
 * topic, assessment-set, learner, or question keys.
 *
 * `questionKeys` is the Phase 3E execution context: delivered keys only,
 * with no answers, explanations, or payload pointers. Optional so Phase 3A
 * samples remain valid; lifecycle-created sessions always set it.
 */
export type AssessmentSession = {
  sessionId: string;
  assessmentSetId: string;
  contentVersion: number;
  mode: AssessmentSessionMode;
  status: AssessmentSessionStatus;
  startedAt?: string;
  completedAt?: string;
  responses: readonly AssessmentResponse[];
  result?: AssessmentResult;
  questionKeys?: readonly AssessmentQuestionKey[];
};
