/**
 * Search & Knowledge Retrieval (Phase 5).
 *
 * Canonical catalogs → SearchDocument → in-memory index → lexical retrieval.
 * Independent of Topic Engine ranking, Geography payload, AI, and HTTP.
 */

export { buildSearchIndex, searchIndex } from "./collection";
export {
  assessmentSetSearchDocument,
  buildSearchDocuments,
  categorySearchDocument,
  conceptSearchDocument,
  subjectSearchDocument,
  topicSearchDocument,
} from "./documents";
export { matchSearchDocument } from "./match";
export { normalizeSearchField, normalizeSearchQuery } from "./normalize";
export { compareRankedResults, SEARCH_RANK_WEIGHTS } from "./rank";
export { searchKnowledge } from "./retrieve";
export {
  SEARCH_DEFAULT_LIMIT,
  SEARCH_DOCUMENT_KINDS,
  SEARCH_ERROR_CODES,
  SEARCH_FORBIDDEN_RESULT_KEYS,
  SEARCH_MATCHED_FIELDS,
  SEARCH_MAX_LIMIT,
  SEARCH_SCHEMA_VERSION,
} from "./types";
export type {
  SearchDocument,
  SearchDocumentKind,
  SearchError,
  SearchErrorCode,
  SearchFailure,
  SearchIndex,
  SearchKnowledgeResult,
  SearchMatchedField,
  SearchOptions,
  SearchResponse,
  SearchResult,
  SearchSuccess,
} from "./types";
