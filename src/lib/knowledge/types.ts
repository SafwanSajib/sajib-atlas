/**
 * Universal knowledge contracts (Phase 1A–1B).
 *
 * Hierarchy: Discipline → Subject → Category → Topic → Concept.
 * Topic identity remains the Phase 0C canonical id (`${subjectId}/${slug}`).
 * Concept identity is topic-bound: `${topicId}/${slug}`.
 *
 * This module is platform-independent: no React, browser APIs, or learner state.
 * It does not own educational payload (paragraphs, MCQs).
 */

export type Discipline = {
  id: string;
  slug: string;
  title: string;
};

export type Subject = {
  id: string;
  disciplineId: string;
  slug: string;
  title: string;
};

/**
 * Category/domain grouping under a subject.
 * `id` is `${subjectId}/${slug}` so ids are unique across subjects.
 * `href` is set only when a live grouping route exists today.
 */
export type Category = {
  id: string;
  subjectId: string;
  slug: string;
  title: string;
  href?: string;
};

export type KnowledgeCatalog = {
  disciplines: readonly Discipline[];
  subjects: readonly Subject[];
  categories: readonly Category[];
};

/**
 * Identity-level concept attached to a canonical topic.
 *
 * A topic may have zero or more concepts. Concepts are not a global graph:
 * the same title may exist under different topics with different ids.
 * `id` is `${topicId}/${slug}` so ids are deterministic and unique.
 * Concepts do not own study paragraphs, MCQs, hrefs, or learner state.
 */
export type Concept = {
  id: string;
  topicId: string;
  slug: string;
  title: string;
};

/** Parent refs a topic must carry. Kept in knowledge so validation need not import content. */
export type TopicHierarchyRefs = {
  id: string;
  disciplineId: string;
  subjectId: string;
  categoryId: string;
};
