/**
 * Deterministic performance-state classification.
 * Thresholds are explicit constants, not mastery science.
 */

import {
  LEARNER_PERFORMANCE_THRESHOLDS,
  type LearnerPerformanceState,
} from "./types";

export function derivePerformanceState(
  questionsAnswered: number,
  percentage: number,
): LearnerPerformanceState {
  if (questionsAnswered <= 0) return "not-started";
  if (percentage < LEARNER_PERFORMANCE_THRESHOLDS.developingAt) return "active";
  if (percentage < LEARNER_PERFORMANCE_THRESHOLDS.strongAt) return "developing";
  return "strong";
}

export function safePercentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}
