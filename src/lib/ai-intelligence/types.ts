/**
 * AI Intelligence contracts (Phase 6A).
 *
 * Canonical Knowledge → Search → AI Context → Provider boundary → Response.
 * AI is not a knowledge database. JSON-safe primitives only.
 * No provider SDKs, RAG, HTTP, React, or persistence.
 */

export const AI_SCHEMA_VERSION = 1;

export const AI_INTENTS = [
  "knowledge-answer",
  "explain-topic",
  "explain-concept",
  "explain-assessment",
] as const;
export type AiIntent = (typeof AI_INTENTS)[number];

export const AI_RESPONSE_STATUSES = ["success", "failed", "blocked", "insufficient_context"] as const;
export type AiResponseStatus = (typeof AI_RESPONSE_STATUSES)[number];

export const AI_KNOWLEDGE_KINDS = [
  "subject",
  "category",
  "topic",
  "concept",
  "assessment_set",
] as const;
export type AiKnowledgeKind = (typeof AI_KNOWLEDGE_KINDS)[number];

export const AI_MAX_INPUT_LENGTH = 2000;
export const AI_MAX_CONTEXT_ITEMS = 20;
export const AI_MAX_EXCERPT_LENGTH = 2000;
export const AI_MAX_OUTPUT_LENGTH = 4000;
export const AI_DEFAULT_CONTEXT_SOURCES = 8;
export const AI_MAX_CONTEXT_ITEM_CHARS = 400;
/** Minimum Phase 5 search score to call the provider (keyword weight). */
export const AI_MIN_GROUNDING_SCORE = 40;
/** Phase 5 title-contains weight: at or above this is fully grounded. */
export const AI_GROUNDED_MIN_SCORE = 60;

export const AI_RETRIEVAL_SCHEMA_VERSION = 1;
export const AI_RETRIEVAL_METHODS = [
  "lexical",
  "semantic",
  "hybrid",
  "vector",
  "reranked",
] as const;
export type AiRetrievalMethod = (typeof AI_RETRIEVAL_METHODS)[number];
export const CURRENT_AI_RETRIEVAL_METHOD: AiRetrievalMethod = "lexical";

export const AI_GROUNDING_STATES = ["grounded", "weakly-grounded", "insufficient-context"] as const;
export type AiGroundingState = (typeof AI_GROUNDING_STATES)[number];

export const AI_ANSWER_STYLES = ["concise", "standard", "detailed", "exam-focused"] as const;
export type AiAnswerStyle = (typeof AI_ANSWER_STYLES)[number];

export type AiRequestInput = {
  text: string;
};

export type AiConstraints = {
  maxInputLength?: number;
  maxContextItems?: number;
};

export type AiKnowledgeReference = {
  id: string;
  kind: AiKnowledgeKind;
  title: string;
  href?: string;
  score?: number;
  contentVersion?: number;
  subjectId?: string;
  categoryId?: string;
  topicId?: string;
  conceptId?: string;
  assessmentSetId?: string;
  retrievalMethod?: AiRetrievalMethod;
};

export type AiApprovedExcerpt = {
  sourceId: string;
  sourceKind: AiKnowledgeKind;
  text: string;
};

export type AiAssessmentContext = {
  assessmentSetId: string;
  topicId: string;
  title?: string;
  contentVersion?: number;
  result?: {
    sessionId: string;
    status: "completed";
    total: number;
    answered: number;
    correct: number;
    score: number;
    percentage: number;
  };
};

export type AiContext = {
  references: readonly AiKnowledgeReference[];
  excerpts?: readonly AiApprovedExcerpt[];
  assessment?: AiAssessmentContext;
};

export type AiLearnerTopicProgress = {
  topicId: string;
  performanceState: "not-started" | "active" | "developing" | "strong";
  percentage: number;
  questionsAnswered: number;
  isCompleted: boolean;
};

export type AiLearnerAssessmentPerformance = {
  assessmentSetId: string;
  sessionId: string;
  contentVersion: number;
  percentage: number;
};

export type AiLearnerContext = {
  learnerId: string;
  topicProgress?: AiLearnerTopicProgress;
  assessmentPerformance?: AiLearnerAssessmentPerformance;
};

export type AiRequest = {
  schemaVersion: typeof AI_SCHEMA_VERSION;
  requestId: string;
  intent: AiIntent;
  input: AiRequestInput;
  context: AiContext;
  learnerContext?: AiLearnerContext;
  constraints?: AiConstraints;
  style?: AiAnswerStyle;
};

export type AiGroundingReference = {
  sourceId: string;
  sourceKind: AiKnowledgeKind;
  title: string;
  href?: string;
  contentVersion?: number;
  score?: number;
  retrievalMethod?: AiRetrievalMethod;
};

export type KnowledgeRetrievalQuery = {
  query: string;
  limit?: number;
};

export type KnowledgeRetrievalResult = {
  query: string;
  results: readonly AiKnowledgeReference[];
  total: number;
  method: AiRetrievalMethod;
  retrievalVersion: typeof AI_RETRIEVAL_SCHEMA_VERSION;
};

export type AiGeneratedOutput = {
  kind: "generated";
  text: string;
};

export type AiProviderMetadata = {
  bound: boolean;
};

export type AiResponse = {
  schemaVersion: typeof AI_SCHEMA_VERSION;
  requestId: string;
  responseId: string;
  status: AiResponseStatus;
  output: AiGeneratedOutput;
  grounding: readonly AiGroundingReference[];
  groundingState: AiGroundingState;
  provider: AiProviderMetadata;
};

export const AI_ERROR_CODES = [
  "invalid_request",
  "validation_failure",
  "blocked",
  "provider_failure",
] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export type AiError = {
  code: AiErrorCode;
  message: string;
};

export type AiSuccess<T> = {
  ok: true;
  data: T;
};

export type AiFailure = {
  ok: false;
  error: AiError;
};

export type AiIntelligenceResult<T> = AiSuccess<T> | AiFailure;

export type KnowledgeRetriever = {
  retrieve(query: KnowledgeRetrievalQuery): AiIntelligenceResult<KnowledgeRetrievalResult>;
};

export const AI_FORBIDDEN_KEYS = [
  "answer",
  "correctAnswer",
  "explanation",
  "shortcutOrTrap",
  "module",
  "field",
  "payload",
  "mcqResults",
  "completedTopics",
  "entitlement",
  "subscription",
  "purchase",
  "payment",
  "order",
  "pricing",
  "apiKey",
] as const;
