/**
 * AI request construction. Request identity is opaque and distinct from
 * learner, topic, concept, assessment, session, and search ids.
 */

import { aiFailure } from "./errors";
import {
  AI_SCHEMA_VERSION,
  type AiAnswerStyle,
  type AiConstraints,
  type AiContext,
  type AiIntelligenceResult,
  type AiIntent,
  type AiLearnerContext,
  type AiRequest,
} from "./types";
import { validateAiRequest } from "./validate";

export type CreateAiRequestInput = {
  requestId: string;
  intent: AiIntent;
  text: string;
  context?: AiContext;
  learnerContext?: AiLearnerContext;
  constraints?: AiConstraints;
  style?: AiAnswerStyle;
};

export function createAiRequest(input: CreateAiRequestInput): AiIntelligenceResult<AiRequest> {
  if (input === null || typeof input !== "object") {
    return aiFailure("invalid_request", "request input must be an object");
  }
  const draft: AiRequest = {
    schemaVersion: AI_SCHEMA_VERSION,
    requestId: input.requestId,
    intent: input.intent,
    input: { text: input.text },
    context: input.context ?? { references: [] },
  };
  if (input.learnerContext) draft.learnerContext = input.learnerContext;
  if (input.constraints) draft.constraints = input.constraints;
  if (input.style) draft.style = input.style;
  return validateAiRequest(draft);
}

export function responseIdForRequest(requestId: string): string {
  return requestId.replace(/^ai-request\//, "ai-response/");
}
