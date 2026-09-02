/**
 * AssessmentResult ingestion. Consumes engine facts; does not rescore.
 */

import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { validateMcqAssessmentResult } from "@/lib/assessment-engine/result";
import type { AssessmentResult } from "@/lib/assessment-engine/types";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { deriveLearnerIntelligenceSnapshot, emptyLearnerIntelligenceState, sortAssessments } from "./derive";
import type {
  IngestAssessmentResultContext,
  LearnerAssessmentPerformance,
  LearnerIntelligenceResult,
  LearnerIntelligenceState,
  LearnerIntelligenceUpdate,
} from "./types";

function failure(
  code: "invalid_request" | "validation_failure",
  message: string,
): LearnerIntelligenceResult<LearnerIntelligenceUpdate> {
  return { ok: false, error: { code, message } };
}

function success(data: LearnerIntelligenceUpdate): LearnerIntelligenceResult<LearnerIntelligenceUpdate> {
  return { ok: true, data };
}

function copyPerformance(item: LearnerAssessmentPerformance): LearnerAssessmentPerformance {
  return {
    learnerId: item.learnerId,
    sessionId: item.sessionId,
    assessmentSetId: item.assessmentSetId,
    topicId: item.topicId,
    contentVersion: item.contentVersion,
    total: item.total,
    answered: item.answered,
    correct: item.correct,
    incorrect: item.incorrect,
    unanswered: item.unanswered,
    score: item.score,
    percentage: item.percentage,
    completedAt: item.completedAt,
  };
}

function toUpdate(
  state: LearnerIntelligenceState,
  completedTopicIds: readonly string[],
  ingested: boolean,
): LearnerIntelligenceUpdate {
  const next: LearnerIntelligenceState = {
    learnerId: state.learnerId,
    assessments: sortAssessments(state.assessments.map(copyPerformance)),
  };
  return {
    state: next,
    snapshot: deriveLearnerIntelligenceSnapshot(next, completedTopicIds),
    ingested,
  };
}

/**
 * Ingest a completed AssessmentResult into learner-intelligence state.
 * Idempotent on sessionId. Does not call Assessment Engine scoring.
 */
export function ingestAssessmentResult(
  result: AssessmentResult,
  context: IngestAssessmentResultContext,
  previous: LearnerIntelligenceState = emptyLearnerIntelligenceState(),
): LearnerIntelligenceResult<LearnerIntelligenceUpdate> {
  if (result === null || typeof result !== "object") {
    return failure("invalid_request", "assessment result must be an object");
  }
  if (context === null || typeof context !== "object") {
    return failure("invalid_request", "ingest context must be an object");
  }
  if (typeof context.completedAt !== "string" || !context.completedAt.trim()) {
    return failure("invalid_request", "completedAt is required");
  }

  const learnerId = context.learnerId ?? LOCAL_LEARNER_ID;
  if (learnerId !== LOCAL_LEARNER_ID) {
    return failure("invalid_request", "learnerId must be learner/local");
  }
  if (previous.learnerId !== learnerId) {
    return failure("invalid_request", "intelligence state learnerId does not match");
  }

  const validated = validateMcqAssessmentResult(result, {
    sessionId: result.sessionId,
    assessmentSetId: result.assessmentSetId,
    contentVersion: result.contentVersion,
    questionKeys: result.outcomes.map((outcome) => outcome.questionKey),
  });
  if (!validated.ok) {
    return failure(validated.error.code, validated.error.message);
  }

  const parsedSet = parseAssessmentSetId(result.assessmentSetId);
  if (!parsedSet) {
    return failure("invalid_request", "assessmentSetId is not a canonical assessment-set id");
  }

  const completedTopicIds = context.completedTopicIds ?? [];
  const already = previous.assessments.some((item) => item.sessionId === result.sessionId);
  if (already) {
    return success(toUpdate(previous, completedTopicIds, false));
  }

  const performance: LearnerAssessmentPerformance = {
    learnerId,
    sessionId: result.sessionId,
    assessmentSetId: result.assessmentSetId,
    topicId: parsedSet.topicId,
    contentVersion: result.contentVersion,
    total: result.total,
    answered: result.answered,
    correct: result.correct,
    incorrect: result.incorrect,
    unanswered: result.unanswered,
    score: result.score,
    percentage: result.percentage,
    completedAt: context.completedAt,
  };

  return success(
    toUpdate(
      {
        learnerId,
        assessments: [...previous.assessments, performance],
      },
      completedTopicIds,
      true,
    ),
  );
}
