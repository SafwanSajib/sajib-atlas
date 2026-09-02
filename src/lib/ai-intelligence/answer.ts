/**
 * Intent-specific grounded explanation helpers. Presentation only.
 */

import type { AssessmentResult } from "@/lib/assessment-engine/types";
import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { getConcept } from "@/lib/knowledge/concepts";
import type { LearnerAssessmentPerformance, LearnerTopicProgress } from "@/lib/learner-intelligence/types";
import { answerWithGrounding } from "./compose";
import type { AiProvider } from "./provider";
import type { AiAnswerStyle, AiIntelligenceResult, AiResponse, KnowledgeRetriever } from "./types";

export type ExplainTopicInput = {
  requestId: string;
  topicId: string;
  text?: string;
  style?: AiAnswerStyle;
  topicProgress?: LearnerTopicProgress;
  retriever?: KnowledgeRetriever;
};

export type ExplainConceptInput = {
  requestId: string;
  conceptId: string;
  text?: string;
  style?: AiAnswerStyle;
  retriever?: KnowledgeRetriever;
};

export type ExplainAssessmentInput = {
  requestId: string;
  assessmentResult: AssessmentResult;
  text?: string;
  style?: AiAnswerStyle;
  topicProgress?: LearnerTopicProgress;
  assessmentPerformance?: LearnerAssessmentPerformance;
  retriever?: KnowledgeRetriever;
};

export function explainTopic(
  input: ExplainTopicInput,
  provider: AiProvider,
): Promise<AiIntelligenceResult<AiResponse>> {
  const topic = getCanonicalTopic(input.topicId);
  const query = topic?.title ?? input.topicId;
  return answerWithGrounding(
    {
      requestId: input.requestId,
      intent: "explain-topic",
      text: input.text ?? `Explain the topic ${topic?.title ?? input.topicId}.`,
      query,
      topicProgress: input.topicProgress,
      style: input.style,
      retriever: input.retriever,
    },
    provider,
  );
}

export function explainConcept(
  input: ExplainConceptInput,
  provider: AiProvider,
): Promise<AiIntelligenceResult<AiResponse>> {
  const concept = getConcept(input.conceptId);
  const query = concept?.title ?? input.conceptId;
  return answerWithGrounding(
    {
      requestId: input.requestId,
      intent: "explain-concept",
      text: input.text ?? `Explain the concept ${concept?.title ?? input.conceptId}.`,
      query,
      style: input.style,
      retriever: input.retriever,
    },
    provider,
  );
}

export function explainAssessment(
  input: ExplainAssessmentInput,
  provider: AiProvider,
): Promise<AiIntelligenceResult<AiResponse>> {
  const parsed = parseAssessmentSetId(input.assessmentResult.assessmentSetId);
  const query = parsed?.topicId ?? input.assessmentResult.assessmentSetId;
  return answerWithGrounding(
    {
      requestId: input.requestId,
      intent: "explain-assessment",
      text: input.text ?? "Explain this assessment result.",
      query,
      assessmentResult: input.assessmentResult,
      topicProgress: input.topicProgress,
      assessmentPerformance: input.assessmentPerformance,
      style: input.style ?? "exam-focused",
      retriever: input.retriever,
    },
    provider,
  );
}
