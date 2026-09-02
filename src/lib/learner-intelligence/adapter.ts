/**
 * Learner-state adapter. Maps intelligence onto existing local-first learner
 * state without browser storage access in this module.
 *
 * CompatibleLearnerState is the persistence shape: mcqResults + completedTopics
 * remain authoritative; intelligence is optional and additive.
 */

import { emptyLearnerIntelligenceState } from "./derive";
import type {
  LearnerAssessmentPerformance,
  LearnerIntelligenceState,
  LearnerIntelligenceUpdate,
} from "./types";

export type CompatibleLearnerState<TMcq = unknown> = {
  mcqResults: TMcq[];
  completedTopics: string[];
  intelligence?: LearnerIntelligenceState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parsePerformance(value: unknown): LearnerAssessmentPerformance | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.learnerId !== "string" || !value.learnerId.trim()) return undefined;
  if (typeof value.sessionId !== "string" || !value.sessionId.trim()) return undefined;
  if (typeof value.assessmentSetId !== "string" || !value.assessmentSetId.trim()) return undefined;
  if (typeof value.topicId !== "string" || !value.topicId.trim()) return undefined;
  const contentVersion = value.contentVersion;
  const total = value.total;
  const answered = value.answered;
  const correct = value.correct;
  const incorrect = value.incorrect;
  const unanswered = value.unanswered;
  const score = value.score;
  const percentage = value.percentage;
  const completedAt = value.completedAt;
  if (typeof contentVersion !== "number" || !Number.isInteger(contentVersion) || contentVersion < 1) {
    return undefined;
  }
  const counts = [total, answered, correct, incorrect, unanswered, score];
  for (const count of counts) {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return undefined;
  }
  if (typeof percentage !== "number" || !Number.isFinite(percentage)) return undefined;
  if (typeof completedAt !== "string" || !completedAt.trim()) return undefined;
  if (typeof total !== "number" || typeof answered !== "number" || typeof correct !== "number") return undefined;
  if (typeof incorrect !== "number" || typeof unanswered !== "number" || typeof score !== "number") return undefined;
  return {
    learnerId: value.learnerId,
    sessionId: value.sessionId,
    assessmentSetId: value.assessmentSetId,
    topicId: value.topicId,
    contentVersion,
    total,
    answered,
    correct,
    incorrect,
    unanswered,
    score,
    percentage,
    completedAt,
  };
}

/**
 * Parse stored intelligence. Malformed input returns undefined so callers can
 * keep mcqResults/completedTopics and initialize intelligence later.
 */
export function parseLearnerIntelligenceState(value: unknown): LearnerIntelligenceState | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return undefined;
  if (typeof value.learnerId !== "string" || !value.learnerId.trim()) return undefined;
  if (!Array.isArray(value.assessments)) return undefined;
  const assessments: LearnerAssessmentPerformance[] = [];
  for (const item of value.assessments) {
    const parsed = parsePerformance(item);
    if (!parsed) return undefined;
    assessments.push(parsed);
  }
  return { learnerId: value.learnerId, assessments };
}

export function intelligenceFromLearnerState<TMcq>(
  state: CompatibleLearnerState<TMcq>,
): LearnerIntelligenceState {
  return state.intelligence ?? emptyLearnerIntelligenceState();
}

/**
 * Apply an intelligence update without deleting mcqResults or completedTopics.
 */
export function applyLearnerIntelligenceUpdate<TMcq>(
  learnerState: CompatibleLearnerState<TMcq>,
  update: LearnerIntelligenceUpdate,
): CompatibleLearnerState<TMcq> {
  return {
    mcqResults: [...learnerState.mcqResults],
    completedTopics: [...learnerState.completedTopics],
    intelligence: {
      learnerId: update.state.learnerId,
      assessments: [...update.state.assessments],
    },
  };
}
