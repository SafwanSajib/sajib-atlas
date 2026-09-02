/**
 * Topic identity helpers (Phase 2).
 *
 * Canonical id remains `${subjectId}/${slug}`. This module does not mint
 * a second identity and does not import catalogs or payload modules.
 */

export function canonicalTopicId(subjectId: string, slug: string): string {
  return `${subjectId}/${slug}`;
}

export function hrefFromTopicId(topicId: string): string {
  return `/${topicId}`;
}

export function topicIdFromHref(href: string): string | undefined {
  const trimmed = href.trim();
  if (!trimmed) return undefined;
  const withoutSlash = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return parseTopicId(withoutSlash) ? withoutSlash : undefined;
}

/**
 * Topic ids have exactly one slash (`subjectId/slug`).
 * Concept ids and assessment-set ids have more than one and are rejected.
 */
export function parseTopicId(id: string): { subjectId: string; slug: string } | undefined {
  const trimmed = id.trim();
  const separator = trimmed.indexOf("/");
  if (separator <= 0 || separator === trimmed.length - 1) return undefined;
  const subjectId = trimmed.slice(0, separator);
  const slug = trimmed.slice(separator + 1);
  if (!subjectId.trim() || !slug.trim() || slug.includes("/")) return undefined;
  return { subjectId, slug };
}

export function isCanonicalTopicIdShape(id: string): boolean {
  return parseTopicId(id) !== undefined;
}
