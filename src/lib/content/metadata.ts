import type { ContentLifecycle, ContentMetadata, ContentSource } from "./types";

/**
 * Content metadata helpers (Phase 1C).
 *
 * Version is an explicit integer on the current payload, not a hash, timestamp,
 * or array index. Topic identity does not include version.
 */

export const INITIAL_CONTENT_VERSION = 1;

export const CONTENT_LIFECYCLES: readonly ContentLifecycle[] = [
  "draft",
  "published",
  "archived",
];

export function provenanceIdForContentSource(contentSource: ContentSource): string {
  return `module/${contentSource}`;
}

/**
 * Deterministic defaults for the current static catalog.
 * Live routes are published. Provenance is the payload module already declared
 * as contentSource. updatedAt is omitted: the repository has no per-topic dates.
 */
export function defaultContentMetadata(contentSource: ContentSource): ContentMetadata {
  return {
    version: INITIAL_CONTENT_VERSION,
    lifecycle: "published",
    sourceId: provenanceIdForContentSource(contentSource),
  };
}
