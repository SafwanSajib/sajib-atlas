/**
 * Pure learner-intelligence derivation. No storage, clocks, or scoring.
 */

import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import type { AssessmentResult } from "@/lib/assessment-engine/types";
import { derivePerformanceState, safePercentage } from "./performance";
import type {
  LearnerAssessmentPerformance,
  LearnerIntelligenceSnapshot,
  LearnerIntelligenceState,
  LearnerQuestionPerformance,
  LearnerTopicProgress,
} from "./types";

export function emptyLearnerIntelligenceState(
  learnerId: string = LOCAL_LEARNER_ID,
): LearnerIntelligenceState {
  return { learnerId, assessments: [] };
}

function laterTimestamp(left: string, right: string): string {
  return left >= right ? left : right;
}

function compareAssessment(
  left: LearnerAssessmentPerformance,
  right: LearnerAssessmentPerformance,
): number {
  if (left.sessionId < right.sessionId) return -1;
  if (left.sessionId > right.sessionId) return 1;
  if (left.assessmentSetId < right.assessmentSetId) return -1;
  if (left.assessmentSetId > right.assessmentSetId) return 1;
  return left.contentVersion - right.contentVersion;
}

export function sortAssessments(
  assessments: readonly LearnerAssessmentPerformance[],
): LearnerAssessmentPerformance[] {
  return [...assessments].sort(compareAssessment);
}

export function deriveLearnerQuestionPerformance(
  result: AssessmentResult,
  completedAt: string,
): LearnerQuestionPerformance[] {
  return result.outcomes.map((outcome) => {
    const answered = outcome.selectedOption !== null;
    return {
      questionKey: {
        assessmentSetId: outcome.questionKey.assessmentSetId,
        contentVersion: outcome.questionKey.contentVersion,
        ordinal: outcome.questionKey.ordinal,
      },
      attempts: answered ? 1 : 0,
      correct: outcome.correct ? 1 : 0,
      incorrect: answered && !outcome.correct ? 1 : 0,
      lastSeenAt: completedAt,
    };
  });
}

export function deriveLearnerTopicProgress(
  assessments: readonly LearnerAssessmentPerformance[],
  topicId: string,
  learnerId: string,
  completedTopicIds: readonly string[] = [],
): LearnerTopicProgress | undefined {
  const topicAssessments = assessments.filter((item) => item.topicId === topicId);
  if (topicAssessments.length === 0) return undefined;

  let questionsAnswered = 0;
  let questionsCorrect = 0;
  let questionsIncorrect = 0;
  let questionsUnanswered = 0;
  let questionsDelivered = 0;
  let lastActivityAt = topicAssessments[0]!.completedAt;

  for (const item of topicAssessments) {
    questionsAnswered += item.answered;
    questionsCorrect += item.correct;
    questionsIncorrect += item.incorrect;
    questionsUnanswered += item.unanswered;
    questionsDelivered += item.total;
    lastActivityAt = laterTimestamp(lastActivityAt, item.completedAt);
  }

  const percentage = safePercentage(questionsCorrect, questionsDelivered);
  return {
    learnerId,
    topicId,
    assessmentsCompleted: topicAssessments.length,
    questionsAnswered,
    questionsCorrect,
    questionsIncorrect,
    questionsUnanswered,
    score: questionsCorrect,
    percentage,
    lastActivityAt,
    performanceState: derivePerformanceState(questionsAnswered, percentage),
    isCompleted: completedTopicIds.includes(topicId),
  };
}

export function deriveLearnerIntelligenceSnapshot(
  state: LearnerIntelligenceState,
  completedTopicIds: readonly string[] = [],
): LearnerIntelligenceSnapshot {
  const topicIds: string[] = [];
  for (const item of state.assessments) {
    if (!topicIds.includes(item.topicId)) topicIds.push(item.topicId);
  }
  topicIds.sort();

  const topicProgress: LearnerTopicProgress[] = [];
  let questionsAnswered = 0;
  let questionsCorrect = 0;
  let questionsIncorrect = 0;
  let updatedAt: string | undefined;

  for (const topicId of topicIds) {
    const progress = deriveLearnerTopicProgress(
      state.assessments,
      topicId,
      state.learnerId,
      completedTopicIds,
    );
    if (!progress) continue;
    topicProgress.push(progress);
    questionsAnswered += progress.questionsAnswered;
    questionsCorrect += progress.questionsCorrect;
    questionsIncorrect += progress.questionsIncorrect;
    updatedAt = updatedAt ? laterTimestamp(updatedAt, progress.lastActivityAt) : progress.lastActivityAt;
  }

  const completedCanonical = new Set(completedTopicIds);

  return {
    learnerId: state.learnerId,
    ...(updatedAt !== undefined ? { updatedAt } : {}),
    topicProgress,
    overallProgress: {
      topicsStarted: topicIds.length,
      topicsCompleted: completedCanonical.size,
      questionsAnswered,
      questionsCorrect,
      questionsIncorrect,
      accuracy: safePercentage(questionsCorrect, questionsAnswered),
    },
  };
}
