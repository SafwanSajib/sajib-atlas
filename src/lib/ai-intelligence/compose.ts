/**
 * Compose an approved AI request from typed retrieval/learner/assessment
 * context, then optionally invoke a bound provider.
 */

import type { AssessmentResult } from "@/lib/assessment-engine/types";
import type { LearnerAssessmentPerformance, LearnerTopicProgress } from "@/lib/learner-intelligence/types";
import { assembleAiContext } from "./assemble";
import {
  groundingFromReferences,
  projectAssessmentResultToAiContext,
  projectLearnerProgressToAiContext,
} from "./context";
import { aiSuccess } from "./errors";
import { deriveGroundingState, hasSufficientGrounding } from "./grounding";
import { buildAiPrompt } from "./prompt";
import type { AiProvider } from "./provider";
import { createAiRequest } from "./request";
import { createAiResponse, createInsufficientContextResponse } from "./response";
import { lexicalKnowledgeRetriever } from "./retrieve";
import {
  AI_SCHEMA_VERSION,
  type AiAnswerStyle,
  type AiIntelligenceResult,
  type AiIntent,
  type AiRequest,
  type AiResponse,
  type KnowledgeRetriever,
} from "./types";
import { validateAiRequest } from "./validate";

export type ComposeAiRequestFromRetrievalInput = {
  requestId: string;
  intent: AiIntent;
  text: string;
  query: string;
  limit?: number;
  assessmentResult?: AssessmentResult;
  topicProgress?: LearnerTopicProgress;
  assessmentPerformance?: LearnerAssessmentPerformance;
  style?: AiAnswerStyle;
  retriever?: KnowledgeRetriever;
  maxSources?: number;
};

export function composeAiRequestFromRetrieval(
  input: ComposeAiRequestFromRetrievalInput,
): AiIntelligenceResult<AiRequest> {
  const retriever = input.retriever ?? lexicalKnowledgeRetriever;
  const retrieved = retriever.retrieve({ query: input.query, limit: input.limit });
  if (!retrieved.ok) return retrieved;

  let assessment;
  if (input.assessmentResult) {
    const projected = projectAssessmentResultToAiContext(input.assessmentResult);
    if (!projected.ok) return projected;
    assessment = projected.data;
  }

  let learnerContext;
  if (input.topicProgress || input.assessmentPerformance) {
    const projected = projectLearnerProgressToAiContext({
      topicProgress: input.topicProgress,
      assessmentPerformance: input.assessmentPerformance,
    });
    if (!projected.ok) return projected;
    learnerContext = projected.data;
  }

  const context = assembleAiContext({
    retrieval: retrieved.data,
    assessment,
    maxSources: input.maxSources,
  });

  return createAiRequest({
    requestId: input.requestId,
    intent: input.intent,
    text: input.text,
    context,
    ...(learnerContext ? { learnerContext } : {}),
    ...(input.style ? { style: input.style } : {}),
  });
}

export async function invokeAiIntelligence(
  request: AiRequest,
  provider?: AiProvider,
): Promise<AiIntelligenceResult<AiResponse>> {
  const validated = validateAiRequest(request);
  if (!validated.ok) return validated;
  if (!provider) {
    return aiSuccess({
      schemaVersion: AI_SCHEMA_VERSION,
      requestId: validated.data.requestId,
      responseId: validated.data.requestId.replace(/^ai-request\//, "ai-response/"),
      status: "blocked",
      output: { kind: "generated", text: "" },
      grounding: groundingFromReferences(validated.data.context.references),
      groundingState: deriveGroundingState(validated.data),
      provider: { bound: false },
    });
  }
  if (!hasSufficientGrounding(validated.data)) {
    return aiSuccess(createInsufficientContextResponse(validated.data));
  }
  return createAiResponse(validated.data, provider, buildAiPrompt(validated.data));
}

/**
 * Grounded answering path: retrieve → assemble → quality gate → at most one provider call.
 */
export async function answerWithGrounding(
  input: ComposeAiRequestFromRetrievalInput,
  provider: AiProvider,
): Promise<AiIntelligenceResult<AiResponse>> {
  const composed = composeAiRequestFromRetrieval(input);
  if (!composed.ok) return composed;
  return invokeAiIntelligence(composed.data, provider);
}
