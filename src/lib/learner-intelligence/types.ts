/**
 * Learner Intelligence contracts (Phase 4).
 *
 * Assessment Engine produces facts. This layer interprets completed
 * AssessmentResult values into progress/performance signals.
 * Not identity, not persistence, not analytics, not mastery prediction.
 *
 * JSON-safe primitives only. No Date, Map, functions, or React.
 */

import type { AssessmentQuestionKey } from "@/lib/assessment-engine/types";

export const LEARNER_PERFORMANCE_STATES = [
  "not-started",
  "active",
  "developing",
  "strong",
] as const;
export type LearnerPerformanceState = (typeof LEARNER_PERFORMANCE_STATES)[number];

/** Explicit percentage thresholds. Not scientific mastery. */
export const LEARNER_PERFORMANCE_THRESHOLDS = {
  /** percentage < this (and answered > 0) → active */
  developingAt: 60,
  /** percentage >= this → strong */
  strongAt: 80,
} as const;

export type LearnerQuestionPerformance = {
  questionKey: AssessmentQuestionKey;
  attempts: number;
  correct: number;
  incorrect: number;
  lastSeenAt: string;
};

export type LearnerAssessmentPerformance = {
  learnerId: string;
  sessionId: string;
  assessmentSetId: string;
  topicId: string;
  contentVersion: number;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  percentage: number;
  completedAt: string;
};

export type LearnerTopicProgress = {
  learnerId: string;
  topicId: string;
  assessmentsCompleted: number;
  questionsAnswered: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  questionsUnanswered: number;
  score: number;
  percentage: number;
  lastActivityAt: string;
  performanceState: LearnerPerformanceState;
  isCompleted: boolean;
};

export type LearnerOverallProgress = {
  topicsStarted: number;
  topicsCompleted: number;
  questionsAnswered: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  accuracy: number;
};

export type LearnerIntelligenceState = {
  learnerId: string;
  assessments: readonly LearnerAssessmentPerformance[];
};

export type LearnerIntelligenceSnapshot = {
  learnerId: string;
  updatedAt?: string;
  topicProgress: readonly LearnerTopicProgress[];
  overallProgress: LearnerOverallProgress;
};

export type LearnerIntelligenceUpdate = {
  state: LearnerIntelligenceState;
  snapshot: LearnerIntelligenceSnapshot;
  ingested: boolean;
};

export type IngestAssessmentResultContext = {
  completedAt: string;
  learnerId?: string;
  completedTopicIds?: readonly string[];
};

export const LEARNER_INTELLIGENCE_ERROR_CODES = [
  "invalid_request",
  "validation_failure",
] as const;
export type LearnerIntelligenceErrorCode = (typeof LEARNER_INTELLIGENCE_ERROR_CODES)[number];

export type LearnerIntelligenceError = {
  code: LearnerIntelligenceErrorCode;
  message: string;
};

export type LearnerIntelligenceSuccess<T> = {
  ok: true;
  data: T;
};

export type LearnerIntelligenceFailure = {
  ok: false;
  error: LearnerIntelligenceError;
};

export type LearnerIntelligenceResult<T> = LearnerIntelligenceSuccess<T> | LearnerIntelligenceFailure;
