/**
 * Candidate retrieval, ranking, limit, and safe result projection.
 */

import { matchSearchDocument } from "./match";
import { normalizeSearchQuery } from "./normalize";
import { compareRankedResults } from "./rank";
import { searchIndex } from "./collection";
import {
  SEARCH_DEFAULT_LIMIT,
  SEARCH_MAX_LIMIT,
  SEARCH_SCHEMA_VERSION,
  type SearchDocument,
  type SearchIndex,
  type SearchKnowledgeResult,
  type SearchOptions,
  type SearchResponse,
  type SearchResult,
} from "./types";

function failure(
  code: "invalid_request" | "validation_failure",
  message: string,
): SearchKnowledgeResult {
  return { ok: false, error: { code, message } };
}

function success(data: SearchResponse): SearchKnowledgeResult {
  return { ok: true, data };
}

function projectResult(
  document: SearchDocument,
  score: number,
  matchedFields: readonly SearchResult["matchedFields"][number][],
): SearchResult {
  const result: SearchResult = {
    id: document.id,
    kind: document.kind,
    title: document.title,
    score,
    matchedFields: [...matchedFields],
  };
  if (document.href) result.href = document.href;
  if (document.subjectId) result.subjectId = document.subjectId;
  if (document.categoryId) result.categoryId = document.categoryId;
  if (document.topicId) result.topicId = document.topicId;
  if (document.conceptId) result.conceptId = document.conceptId;
  if (document.assessmentSetId) result.assessmentSetId = document.assessmentSetId;
  return result;
}

function resolveLimit(limit: number | undefined): number | SearchKnowledgeResult {
  if (limit === undefined) return SEARCH_DEFAULT_LIMIT;
  if (typeof limit !== "number" || !Number.isInteger(limit)) {
    return failure("validation_failure", "limit must be an integer");
  }
  if (limit < 1) {
    return failure("validation_failure", "limit must be at least 1");
  }
  if (limit > SEARCH_MAX_LIMIT) {
    return failure("validation_failure", `limit must be at most ${SEARCH_MAX_LIMIT}`);
  }
  return limit;
}

/**
 * Lexical search over a SearchIndex.
 * Empty/whitespace queries return no results (not discovery mode).
 */
export function searchKnowledge(
  query: string,
  options: SearchOptions = {},
  index: SearchIndex = searchIndex,
): SearchKnowledgeResult {
  if (typeof query !== "string") {
    return failure("invalid_request", "query must be a string");
  }
  if (options === null || typeof options !== "object") {
    return failure("invalid_request", "options must be an object");
  }
  if (index === null || typeof index !== "object" || !Array.isArray(index.documents)) {
    return failure("invalid_request", "search index must be an object");
  }

  const limitOrError = resolveLimit(options.limit);
  if (typeof limitOrError !== "number") return limitOrError;
  const limit = limitOrError;

  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return success({
      query: normalized,
      results: [],
      total: 0,
      limit,
      schemaVersion: SEARCH_SCHEMA_VERSION,
    });
  }

  const ranked: SearchResult[] = [];
  for (const document of index.documents) {
    const match = matchSearchDocument(document, normalized);
    if (!match) continue;
    ranked.push(projectResult(document, match.score, match.matchedFields));
  }

  ranked.sort(compareRankedResults);
  const total = ranked.length;
  return success({
    query: normalized,
    results: ranked.slice(0, limit),
    total,
    limit,
    schemaVersion: SEARCH_SCHEMA_VERSION,
  });
}
