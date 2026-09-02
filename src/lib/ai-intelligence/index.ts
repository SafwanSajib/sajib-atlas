/**
 * AI Intelligence (Phase 6A–6C).
 *
 * Provider-agnostic foundation over Search, Assessment Engine, and
 * Learner Intelligence. Retrieval is abstracted for future RAG.
 * No SDK, vector DB, HTTP, UI, or persistence.
 */

export { explainAssessment, explainConcept, explainTopic } from "./answer";
export { assembleAiContext } from "./assemble";
export {
  answerWithGrounding,
  composeAiRequestFromRetrieval,
  invokeAiIntelligence,
} from "./compose";
export { deriveGroundingState, hasSufficientGrounding, highestRetrievalScore } from "./grounding";
export { buildAiPrompt } from "./prompt";
export type { AiPrompt } from "./prompt";
export {
  projectAssessmentResultToAiContext,
  projectLearnerProgressToAiContext,
  projectSearchResultsToAiContext,
  retrieveAiKnowledgeReferences,
} from "./context";
export { aiFailure, aiSuccess } from "./errors";
export type { AiProvider, AiProviderInput, AiProviderInstructions, AiProviderOutput } from "./provider";
export { createAiRequest, responseIdForRequest } from "./request";
export { createAiResponse } from "./response";
export { createLexicalKnowledgeRetriever, lexicalKnowledgeRetriever } from "./retrieve";
export {
  AI_ANSWER_STYLES,
  AI_DEFAULT_CONTEXT_SOURCES,
  AI_ERROR_CODES,
  AI_FORBIDDEN_KEYS,
  AI_GROUNDED_MIN_SCORE,
  AI_GROUNDING_STATES,
  AI_INTENTS,
  AI_KNOWLEDGE_KINDS,
  AI_MAX_CONTEXT_ITEM_CHARS,
  AI_MAX_CONTEXT_ITEMS,
  AI_MAX_EXCERPT_LENGTH,
  AI_MAX_INPUT_LENGTH,
  AI_MAX_OUTPUT_LENGTH,
  AI_MIN_GROUNDING_SCORE,
  AI_RESPONSE_STATUSES,
  AI_RETRIEVAL_METHODS,
  AI_RETRIEVAL_SCHEMA_VERSION,
  AI_SCHEMA_VERSION,
  CURRENT_AI_RETRIEVAL_METHOD,
} from "./types";
export type {
  AiAnswerStyle,
  AiApprovedExcerpt,
  AiAssessmentContext,
  AiConstraints,
  AiContext,
  AiError,
  AiErrorCode,
  AiFailure,
  AiGeneratedOutput,
  AiGroundingReference,
  AiGroundingState,
  AiIntelligenceResult,
  AiIntent,
  AiKnowledgeKind,
  AiKnowledgeReference,
  AiLearnerAssessmentPerformance,
  AiLearnerContext,
  AiLearnerTopicProgress,
  AiProviderMetadata,
  AiRequest,
  AiRequestInput,
  AiResponse,
  AiResponseStatus,
  AiRetrievalMethod,
  AiSuccess,
  KnowledgeRetrievalQuery,
  KnowledgeRetrievalResult,
  KnowledgeRetriever,
} from "./types";
export {
  isAiAnswerStyle,
  isAiGroundingState,
  isAiIntent,
  isAiKnowledgeKind,
  isAiRequestId,
  isAiResponseId,
  isAiRetrievalMethod,
  validateAiContext,
  validateAiLearnerContext,
  validateAiRequest,
  validateAiResponse,
} from "./validate";
