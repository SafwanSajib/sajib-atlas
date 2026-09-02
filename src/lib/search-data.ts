/**
 * Legacy topic substring search over the canonical content manifest.
 *
 * Public behavior is unchanged: trim/lowercase, empty → [], title/slug
 * includes, manifest order. Universal retrieval lives in src/lib/search/.
 */

import {
  contentManifest,
  type CanonicalTopic,
} from "@/lib/content/manifest";

export function searchTopics(query: string): CanonicalTopic[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return contentManifest.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.slug.toLowerCase().includes(normalizedQuery),
  );
}
