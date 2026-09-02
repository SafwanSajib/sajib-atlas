/**
 * Canonical topic identity + content metadata (Phase 0C / 1C).
 *
 * Hierarchy parent ids (disciplineId, subjectId, categoryId) come from
 * src/lib/knowledge. Concept identity refs are `conceptIds`.
 * Payload (study text, MCQs) is not stored here.
 * Assessment-set identity refs are `assessmentSetIds`.
 *
 * contentStatus = payload completeness (available / partial / planned).
 * contentMetadata.lifecycle = publication state (draft / published / archived).
 * contentMetadata.version is not part of topic id.
 */

export type ContentStatus = "available" | "partial" | "planned";

/**
 * Existing educational/catalog payload that a canonical topic points at.
 * Geography study/MCQ content remains in geography-data.ts.
 * BCS/English catalog stubs remain in knowledge-data.ts.
 */
export type ContentSource = "geography-data" | "knowledge-data";

/**
 * Editorial lifecycle. Independent of contentStatus (payload completeness).
 * Live Geography/BCS/English catalog entries are `published`.
 */
export type ContentLifecycle = "draft" | "published" | "archived";

/**
 * Provenance kind currently known from the repository.
 * Scholarly citation types are deferred until a trustworthy source exists.
 */
export type ContentProvenanceKind = "repository-module";

/**
 * Identity-level provenance record. Not a citation.
 * Optional `reference` / `publisher` exist for future use and stay unset
 * unless the repository actually records them.
 */
export type ContentProvenance = {
  id: string;
  kind: ContentProvenanceKind;
  title: string;
  reference?: string;
  publisher?: string;
};

/**
 * Metadata around a topic's current payload. Does not contain paragraphs or MCQs.
 * `sourceId` and `updatedAt` are omitted when unknown — never invented.
 */
export type ContentMetadata = {
  /** Explicit integer version of the current payload. Starts at 1. */
  version: number;
  lifecycle: ContentLifecycle;
  /** Identity ref into the provenance catalog. */
  sourceId?: string;
  /** Calendar date `YYYY-MM-DD` when last updated is known. */
  updatedAt?: string;
};

export type CanonicalTopic = {
  /** Deterministic identity: `${subjectId}/${slug}`. Never an index or UUID. */
  id: string;
  disciplineId: string;
  subjectId: string;
  /** Subject slug; equal to subjectId. Kept for Phase 0 consumers. */
  subject: string;
  slug: string;
  title: string;
  /** Canonical route: `/${subjectId}/${slug}`. Future `/topics/[slug]` is deferred. */
  href: string;
  /** Category slug (e.g. physical-geography). */
  category: string;
  /** Canonical category id: `${subjectId}/${category}`. */
  categoryId: string;
  contentStatus: ContentStatus;
  contentSource: ContentSource;
  /**
   * Identity references into the concept catalog.
   * Empty when the topic has no concepts yet. Never embeds Concept objects.
   */
  conceptIds: readonly string[];
  contentMetadata: ContentMetadata;
  /**
   * Identity references into the assessment-set catalog.
   * Empty when the topic has no assessment payload. Never embeds questions.
   */
  assessmentSetIds: readonly string[];
};
