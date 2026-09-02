/**
 * Deterministic lexical matching against SearchDocument fields.
 */

import { normalizeSearchField } from "./normalize";
import { SEARCH_RANK_WEIGHTS, type SearchDocument, type SearchMatchedField } from "./types";
import type { RankedMatch } from "./rank";

function fieldEquals(value: string | undefined, query: string): boolean {
  if (!value) return false;
  return normalizeSearchField(value) === query;
}

function fieldStartsWith(value: string | undefined, query: string): boolean {
  if (!value) return false;
  return normalizeSearchField(value).startsWith(query);
}

function fieldContains(value: string | undefined, query: string): boolean {
  if (!value) return false;
  return normalizeSearchField(value).includes(query);
}

function keywordMatches(keywords: readonly string[] | undefined, query: string): boolean {
  if (!keywords) return false;
  for (const keyword of keywords) {
    if (fieldContains(keyword, query)) return true;
  }
  return false;
}

function identifierMatches(document: SearchDocument, query: string): boolean {
  return (
    fieldContains(document.id, query) ||
    fieldContains(document.slug, query) ||
    fieldContains(document.subjectId, query) ||
    fieldContains(document.categoryId, query) ||
    fieldContains(document.topicId, query) ||
    fieldContains(document.conceptId, query) ||
    fieldContains(document.assessmentSetId, query)
  );
}

function titleScore(document: SearchDocument, query: string): number {
  if (fieldEquals(document.title, query)) return SEARCH_RANK_WEIGHTS.titleExact;
  if (fieldStartsWith(document.title, query)) return SEARCH_RANK_WEIGHTS.titlePrefix;
  if (fieldContains(document.title, query)) return SEARCH_RANK_WEIGHTS.titleContains;
  return 0;
}

export function matchSearchDocument(document: SearchDocument, query: string): RankedMatch | undefined {
  if (!query) return undefined;

  const matchedFields: SearchMatchedField[] = [];
  let score = 0;

  const title = titleScore(document, query);
  if (title > 0) {
    matchedFields.push("title");
    score = Math.max(score, title);
  }

  if (keywordMatches(document.keywords, query)) {
    matchedFields.push("keywords");
    score = Math.max(score, SEARCH_RANK_WEIGHTS.keyword);
  }

  if (fieldContains(document.summary, query) || fieldContains(document.searchText, query)) {
    matchedFields.push("searchText");
    score = Math.max(score, SEARCH_RANK_WEIGHTS.searchText);
  }

  if (identifierMatches(document, query)) {
    matchedFields.push("identifier");
    score = Math.max(score, SEARCH_RANK_WEIGHTS.identifier);
  }

  if (score <= 0) return undefined;
  return { score, matchedFields };
}
