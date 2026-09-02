import type { ContentProvenance } from "./types";

/**
 * Provenance catalog (Phase 1C).
 *
 * These records describe where current payload modules live in the repository.
 * They are not scholarly citations. No publisher, URL, or reference is invented.
 */
export const contentProvenanceCatalog: readonly ContentProvenance[] = [
  {
    id: "module/geography-data",
    kind: "repository-module",
    title: "src/lib/geography-data.ts",
  },
  {
    id: "module/knowledge-data",
    kind: "repository-module",
    title: "src/lib/knowledge-data.ts",
  },
];

export const contentProvenanceById: Readonly<Record<string, ContentProvenance>> =
  Object.fromEntries(contentProvenanceCatalog.map((item) => [item.id, item]));

export function getContentProvenance(id: string): ContentProvenance | undefined {
  return contentProvenanceById[id];
}
