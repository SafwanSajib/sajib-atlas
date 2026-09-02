/**
 * Routing contract: current live topic/grouping href is `/${subject}/${slug}`.
 * Future `/topics/[slug]` is deferred; this helper does not emit that route.
 */
export function canonicalHref(subject: string, slug: string): string {
  return `/${subject}/${slug}`;
}
