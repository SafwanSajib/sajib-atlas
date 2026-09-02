/**
 * Learner Intelligence (Phase 4).
 *
 * Assessment Engine result → derived progress/performance signals.
 * Separate from src/lib/learner/ identity and from store persistence.
 * Local-first. No AI, analytics emission, API, or Geography payload.
 */

export {
  applyLearnerIntelligenceUpdate,
  intelligenceFromLearnerState,
  parseLearnerIntelligenceState,
  type CompatibleLearnerState,
} from "./adapter";
export {
  deriveLearnerIntelligenceSnapshot,
  deriveLearnerQuestionPerformance,
  deriveLearnerTopicProgress,
  emptyLearnerIntelligenceState,
  sortAssessments,
} from "./derive";
export { ingestAssessmentResult } from "./ingest";
export { derivePerformanceState, safePercentage } from "./performance";
export {
  LEARNER_INTELLIGENCE_ERROR_CODES,
  LEARNER_PERFORMANCE_STATES,
  LEARNER_PERFORMANCE_THRESHOLDS,
} from "./types";
export type {
  IngestAssessmentResultContext,
  LearnerAssessmentPerformance,
  LearnerIntelligenceError,
  LearnerIntelligenceErrorCode,
  LearnerIntelligenceFailure,
  LearnerIntelligenceResult,
  LearnerIntelligenceSnapshot,
  LearnerIntelligenceState,
  LearnerIntelligenceSuccess,
  LearnerIntelligenceUpdate,
  LearnerOverallProgress,
  LearnerPerformanceState,
  LearnerQuestionPerformance,
  LearnerTopicProgress,
} from "./types";
