/**
 * Search & Knowledge Retrieval contracts (Phase 5).
 *
 * Canonical Knowledge → SearchDocument → Index → normalize → match → rank → result.
 * JSON-safe primitives only. Not HTTP, AI, embeddings, or a second identity system.
 */

export const SEARCH_SCHEMA_VERSION = 1;

export const SEARCH_DOCUMENT_KINDS = [
  "subject",
  "category",
  "topic",
  "concept",
  "assessment_set",
] as const;
export type SearchDocumentKind = (typeof SEARCH_DOCUMENT_KINDS)[number];

export const SEARCH_MATCHED_FIELDS = ["title", "keywords", "searchText", "identifier"] as const;
export type SearchMatchedField = (typeof SEARCH_MATCHED_FIELDS)[number];

/** Explicit ranking weights. Higher wins. Final tie-breaker is canonical id. */
export const SEARCH_RANK_WEIGHTS = {
  titleExact: 100,
  titlePrefix: 80,
  titleContains: 60,
  keyword: 40,
  searchText: 20,
  identifier: 10,
} as const;

export const SEARCH_DEFAULT_LIMIT = 25;
export const SEARCH_MAX_LIMIT = 100;

export type SearchDocument = {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  slug?: string;
  href?: string;
  subjectId?: string;
  categoryId?: string;
  topicId?: string;
  conceptId?: string;
  assessmentSetId?: string;
  summary?: string;
  keywords?: readonly string[];
  searchText?: string;
};

export type SearchIndex = {
  schemaVersion: typeof SEARCH_SCHEMA_VERSION;
  documents: readonly SearchDocument[];
};

export type SearchResult = {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  href?: string;
  score: number;
  matchedFields: readonly SearchMatchedField[];
  subjectId?: string;
  categoryId?: string;
  topicId?: string;
  conceptId?: string;
  assessmentSetId?: string;
};

export type SearchResponse = {
  query: string;
  results: readonly SearchResult[];
  total: number;
  limit: number;
  schemaVersion: typeof SEARCH_SCHEMA_VERSION;
};

export type SearchOptions = {
  limit?: number;
};

export const SEARCH_ERROR_CODES = ["invalid_request", "validation_failure"] as const;
export type SearchErrorCode = (typeof SEARCH_ERROR_CODES)[number];

export type SearchError = {
  code: SearchErrorCode;
  message: string;
};

export type SearchSuccess = {
  ok: true;
  data: SearchResponse;
};

export type SearchFailure = {
  ok: false;
  error: SearchError;
};

export type SearchKnowledgeResult = SearchSuccess | SearchFailure;

export const SEARCH_FORBIDDEN_RESULT_KEYS = [
  "answer",
  "correctAnswer",
  "explanation",
  "shortcutOrTrap",
  "module",
  "field",
  "payload",
  "learnerId",
  "mcqResults",
  "completedTopics",
  "entitlement",
  "subscription",
  "purchase",
  "payment",
  "order",
  "pricing",
] as const;
