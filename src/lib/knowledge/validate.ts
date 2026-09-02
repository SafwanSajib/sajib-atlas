import type { Concept, KnowledgeCatalog, TopicHierarchyRefs } from "./types";

function fail(message: string): never {
  throw new Error(`Knowledge catalog: ${message}`);
}

export function validateKnowledgeCatalog(
  catalog: KnowledgeCatalog,
): KnowledgeCatalog {
  const disciplineIds = new Set<string>();
  for (const discipline of catalog.disciplines) {
    if (!discipline.id?.trim()) fail("empty discipline id");
    if (!discipline.slug?.trim()) fail(`empty discipline slug for ${discipline.id}`);
    if (!discipline.title?.trim()) fail(`empty discipline title for ${discipline.id}`);
    if (disciplineIds.has(discipline.id)) fail(`duplicate discipline id ${discipline.id}`);
    disciplineIds.add(discipline.id);
  }

  const subjectIds = new Set<string>();
  for (const subject of catalog.subjects) {
    if (!subject.id?.trim()) fail("empty subject id");
    if (!subject.slug?.trim()) fail(`empty subject slug for ${subject.id}`);
    if (!subject.title?.trim()) fail(`empty subject title for ${subject.id}`);
    if (!subject.disciplineId?.trim()) fail(`empty disciplineId for subject ${subject.id}`);
    if (!disciplineIds.has(subject.disciplineId)) {
      fail(`subject ${subject.id} references unknown discipline ${subject.disciplineId}`);
    }
    if (subjectIds.has(subject.id)) fail(`duplicate subject id ${subject.id}`);
    subjectIds.add(subject.id);
  }

  const categoryIds = new Set<string>();
  const categoryKeys = new Set<string>();
  for (const category of catalog.categories) {
    if (!category.id?.trim()) fail("empty category id");
    if (!category.slug?.trim()) fail(`empty category slug for ${category.id}`);
    if (!category.title?.trim()) fail(`empty category title for ${category.id}`);
    if (!category.subjectId?.trim()) fail(`empty subjectId for category ${category.id}`);
    if (!subjectIds.has(category.subjectId)) {
      fail(`category ${category.id} references unknown subject ${category.subjectId}`);
    }
    const expectedId = `${category.subjectId}/${category.slug}`;
    if (category.id !== expectedId) {
      fail(`category id must equal subjectId/slug: ${category.id} !== ${expectedId}`);
    }
    const withinSubject = `${category.subjectId}::${category.slug}`;
    if (categoryKeys.has(withinSubject)) {
      fail(`duplicate category ${category.slug} within subject ${category.subjectId}`);
    }
    categoryKeys.add(withinSubject);
    if (categoryIds.has(category.id)) fail(`duplicate category id ${category.id}`);
    categoryIds.add(category.id);
    if (category.href !== undefined && category.href !== `/${category.id}`) {
      fail(`category href must match identity: ${category.href} !== /${category.id}`);
    }
  }

  return catalog;
}

export function validateTopicsAgainstCatalog<T extends TopicHierarchyRefs>(
  topics: T[],
  catalog: KnowledgeCatalog,
): T[] {
  const subjectIds = new Set(catalog.subjects.map((item) => item.id));
  const categoryIds = new Set(catalog.categories.map((item) => item.id));
  const subjectsById = new Map(catalog.subjects.map((item) => [item.id, item]));

  for (const topic of topics) {
    if (!subjectIds.has(topic.subjectId)) {
      fail(`topic ${topic.id} references unknown subject ${topic.subjectId}`);
    }
    if (!categoryIds.has(topic.categoryId)) {
      fail(`topic ${topic.id} references unknown category ${topic.categoryId}`);
    }
    const subject = subjectsById.get(topic.subjectId);
    if (subject && topic.disciplineId !== subject.disciplineId) {
      fail(
        `topic ${topic.id} disciplineId ${topic.disciplineId} does not match subject ${subject.id}`,
      );
    }
  }

  return topics;
}

/**
 * Structural checks for concept identity. Does not require the topic catalog.
 * Topic existence is checked separately so this module stays free of content/.
 */
export function validateConceptStructure(concepts: readonly Concept[]): Concept[] {
  const conceptIds = new Set<string>();
  const withinTopic = new Set<string>();

  for (const concept of concepts) {
    if (!concept.id?.trim()) fail("empty concept id");
    if (!concept.slug?.trim()) fail(`empty concept slug for ${concept.id}`);
    if (!concept.title?.trim()) fail(`empty concept title for ${concept.id}`);
    if (!concept.topicId?.trim()) fail(`empty topicId for concept ${concept.id}`);
    if (concept.slug.includes("/")) {
      fail(`concept slug must not contain '/': ${concept.id}`);
    }

    const expectedId = `${concept.topicId}/${concept.slug}`;
    if (concept.id !== expectedId) {
      fail(`concept id must equal topicId/slug: ${concept.id} !== ${expectedId}`);
    }

    const topicKey = `${concept.topicId}::${concept.slug}`;
    if (withinTopic.has(topicKey)) {
      fail(`duplicate concept ${concept.slug} within topic ${concept.topicId}`);
    }
    withinTopic.add(topicKey);

    if (conceptIds.has(concept.id)) fail(`duplicate concept id ${concept.id}`);
    conceptIds.add(concept.id);
  }

  return [...concepts];
}

/**
 * Concepts are topic-bound. Unknown topicId is invalid.
 * Topics with zero concepts are valid.
 */
export function assertConceptsBoundToTopics(
  concepts: readonly Concept[],
  topicIds: ReadonlySet<string>,
): void {
  for (const concept of concepts) {
    if (!topicIds.has(concept.topicId)) {
      fail(`concept ${concept.id} references unknown topic ${concept.topicId}`);
    }
  }
}

type TopicConceptRefs = {
  id: string;
  conceptIds?: readonly string[];
};

/**
 * Bidirectional identity refs: topic.conceptIds must exist, belong to that
 * topic, and match the concept catalog for that topicId.
 */
export function assertConceptReferences(
  concepts: readonly Concept[],
  topics: readonly TopicConceptRefs[],
): void {
  const topicIds = new Set(topics.map((topic) => topic.id));
  assertConceptsBoundToTopics(concepts, topicIds);

  const conceptsById = new Map(concepts.map((item) => [item.id, item]));
  const conceptIdsByTopic = new Map<string, string[]>();
  for (const concept of concepts) {
    const group = conceptIdsByTopic.get(concept.topicId);
    if (group) group.push(concept.id);
    else conceptIdsByTopic.set(concept.topicId, [concept.id]);
  }

  for (const topic of topics) {
    const listed = topic.conceptIds ?? [];
    const seen = new Set<string>();
    for (const conceptId of listed) {
      if (!conceptId?.trim()) {
        fail(`empty conceptId on topic ${topic.id}`);
      }
      if (seen.has(conceptId)) {
        fail(`duplicate conceptId ${conceptId} on topic ${topic.id}`);
      }
      seen.add(conceptId);
      const concept = conceptsById.get(conceptId);
      if (!concept) {
        fail(`topic ${topic.id} references missing concept ${conceptId}`);
      }
      if (concept.topicId !== topic.id) {
        fail(`topic ${topic.id} lists concept ${conceptId} owned by ${concept.topicId}`);
      }
    }

    const catalogIds = conceptIdsByTopic.get(topic.id) ?? [];
    if (listed.length !== catalogIds.length) {
      fail(
        `topic ${topic.id} conceptIds length ${listed.length} does not match catalog ${catalogIds.length}`,
      );
    }
    for (const conceptId of catalogIds) {
      if (!seen.has(conceptId)) {
        fail(`topic ${topic.id} is missing catalog concept ${conceptId}`);
      }
    }
  }
}
