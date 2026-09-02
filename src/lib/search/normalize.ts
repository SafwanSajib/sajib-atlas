/**
 * Pure query normalization. Collapses surrounding/repeated whitespace and case.
 * Does not translate, stem, or interpret language.
 */

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeSearchField(value: string): string {
  return normalizeSearchQuery(value);
}
