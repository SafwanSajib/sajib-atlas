/**
 * Structured AI context projection. Does not scan Geography payload,
 * does not re-rank search, and does not copy answers.
 */

import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { getAssessmentSet } from "@/lib/assessment/sets";
import type { AssessmentResult } from "@/lib/assessment-engine/types";
import type { LearnerAssessmentPerformance, LearnerTopicProgress } from "@/lib/learner-intelligence/types";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { searchKnowledge } from "@/lib/search/retrieve";
import type { SearchResult } from "@/lib/search/types";
import { aiFailure, aiSuccess } from "./errors";
import type {
  AiAssessmentContext,
  AiGroundingReference,
  AiIntelligenceResult,
  AiKnowledgeKind,
  AiKnowledgeReference,
  AiLearnerContext,
} from "./types";
import { isAiKnowledgeKind } from "./validate";

function optionalAssign<K extends string>(
  target: Record<string, unknown>,
  key: K,
  value: string | number | undefined,
): void {
  if (value === undefined) return;
  target[key] = value;
}

export function projectSearchResultToAiContext(result: SearchResult): AiKnowledgeReference | undefined {
  if (!isAiKnowledgeKind(result.kind)) return undefined;
  const reference: AiKnowledgeReference = {
    id: result.id,
    kind: result.kind as AiKnowledgeKind,
    title: result.title,
    score: result.score,
  };
  if (result.href) reference.href = result.href;
  if (result.subjectId) reference.subjectId = result.subjectId;
  if (result.categoryId) reference.categoryId = result.categoryId;
  if (result.topicId) reference.topicId = result.topicId;
  if (result.conceptId) reference.conceptId = result.conceptId;
  if (result.assessmentSetId) reference.assessmentSetId = result.assessmentSetId;
  return reference;
}

export function projectSearchResultsToAiContext(
  results: readonly SearchResult[],
): AiKnowledgeReference[] {
  const references: AiKnowledgeReference[] = [];
  for (const result of results) {
    const projected = projectSearchResultToAiContext(result);
    if (projected) references.push(projected);
  }
  return references;
}

/**
 * Retrieval adapter. Phase 5 remains the ranking/search authority.
 */
export function retrieveAiKnowledgeReferences(
  query: string,
  options: { limit?: number } = {},
): AiIntelligenceResult<AiKnowledgeReference[]> {
  const retrieved = searchKnowledge(query, options);
  if (!retrieved.ok) {
    return aiFailure(retrieved.error.code === "invalid_request" ? "invalid_request" : "validation_failure", retrieved.error.message);
  }
  return aiSuccess(projectSearchResultsToAiContext(retrieved.data.results));
}

export function projectAssessmentResultToAiContext(
  result: AssessmentResult,
  title?: string,
): AiIntelligenceResult<AiAssessmentContext> {
  const parsed = parseAssessmentSetId(result.assessmentSetId);
  if (!parsed) return aiFailure("validation_failure", "assessmentSetId is not canonical");
  const catalog = getAssessmentSet(result.assessmentSetId);
  const assessment: AiAssessmentContext = {
    assessmentSetId: result.assessmentSetId,
    topicId: parsed.topicId,
    contentVersion: result.contentVersion,
    result: {
      sessionId: result.sessionId,
      status: "completed",
      total: result.total,
      answered: result.answered,
      correct: result.correct,
      score: result.score,
      percentage: result.percentage,
    },
  };
  const resolvedTitle = title ?? catalog?.title;
  if (resolvedTitle) assessment.title = resolvedTitle;
  return aiSuccess(assessment);
}

export function projectLearnerProgressToAiContext(input: {
  topicProgress?: LearnerTopicProgress;
  assessmentPerformance?: LearnerAssessmentPerformance;
}): AiIntelligenceResult<AiLearnerContext> {
  const learner: AiLearnerContext = { learnerId: LOCAL_LEARNER_ID };
  if (input.topicProgress) {
    learner.topicProgress = {
      topicId: input.topicProgress.topicId,
      performanceState: input.topicProgress.performanceState,
      percentage: input.topicProgress.percentage,
      questionsAnswered: input.topicProgress.questionsAnswered,
      isCompleted: input.topicProgress.isCompleted,
    };
  }
  if (input.assessmentPerformance) {
    learner.assessmentPerformance = {
      assessmentSetId: input.assessmentPerformance.assessmentSetId,
      sessionId: input.assessmentPerformance.sessionId,
      contentVersion: input.assessmentPerformance.contentVersion,
      percentage: input.assessmentPerformance.percentage,
    };
  }
  return aiSuccess(learner);
}

export function groundingFromReferences(
  references: readonly AiKnowledgeReference[],
): AiGroundingReference[] {
  return references.map((item) => {
    const grounding: AiGroundingReference = {
      sourceId: item.id,
      sourceKind: item.kind,
      title: item.title,
    };
    if (item.href) grounding.href = item.href;
    optionalAssign(grounding, "contentVersion", item.contentVersion);
    optionalAssign(grounding, "score", item.score);
    if (item.retrievalMethod) grounding.retrievalMethod = item.retrievalMethod;
    return grounding;
  });
}
