/**
 * Deterministic in-memory search index. Derived from canonical catalogs.
 * Not Elasticsearch, Algolia, or a database.
 */

import { buildSearchDocuments } from "./documents";
import { SEARCH_SCHEMA_VERSION, type SearchIndex } from "./types";

export function buildSearchIndex(): SearchIndex {
  return {
    schemaVersion: SEARCH_SCHEMA_VERSION,
    documents: buildSearchDocuments(),
  };
}

export const searchIndex: SearchIndex = buildSearchIndex();
