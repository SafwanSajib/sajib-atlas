import { isAssessmentKind, parseAssessmentSetId } from "@/lib/assessment/identity";
import { CONTENT_LIFECYCLES } from "./metadata";
import { contentProvenanceCatalog } from "./sources";
import type { CanonicalTopic, ContentLifecycle, ContentMetadata } from "./types";

function fail(message: string): never {
  throw new Error(`Canonical content manifest: ${message}`);
}

/**
 * Development/build-time checks for the identity catalog.
 * Pure: does not import payload modules or the manifest singleton.
 */
export function validateCanonicalManifest(
  topics: CanonicalTopic[],
): CanonicalTopic[] {
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();

  for (const topic of topics) {
    if (!topic.id?.trim()) fail("empty canonical id");
    if (!topic.slug?.trim()) fail(`empty slug for ${topic.id || "(missing id)"}`);
    if (!topic.subject?.trim()) fail(`empty subject for ${topic.id}`);
    if (!topic.subjectId?.trim()) fail(`empty subjectId for ${topic.id}`);
    if (!topic.disciplineId?.trim()) fail(`empty disciplineId for ${topic.id}`);
    if (!topic.title?.trim()) fail(`empty title for ${topic.id}`);
    if (!topic.href?.trim()) fail(`empty href for ${topic.id}`);
    if (!topic.category?.trim()) fail(`empty category for ${topic.id}`);
    if (!topic.categoryId?.trim()) fail(`empty categoryId for ${topic.id}`);

    if (topic.subjectId !== topic.subject) {
      fail(`subjectId must equal subject: ${topic.subjectId} !== ${topic.subject}`);
    }

    const expectedId = `${topic.subjectId}/${topic.slug}`;
    if (topic.id !== expectedId) {
      fail(`id must equal subjectId/slug: ${topic.id} !== ${expectedId}`);
    }

    const expectedHref = `/${expectedId}`;
    if (topic.href !== expectedHref) {
      fail(`href must match identity: ${topic.href} !== ${expectedHref}`);
    }

    const expectedCategoryId = `${topic.subjectId}/${topic.category}`;
    if (topic.categoryId !== expectedCategoryId) {
      fail(`categoryId must equal subjectId/category: ${topic.categoryId} !== ${expectedCategoryId}`);
    }

    if (seenIds.has(topic.id)) fail(`duplicate canonical id ${topic.id}`);
    if (seenHrefs.has(topic.href)) fail(`duplicate canonical href ${topic.href}`);

    if (!Array.isArray(topic.conceptIds)) {
      fail(`conceptIds must be an array on ${topic.id}`);
    }
    const seenConceptIds = new Set<string>();
    for (const conceptId of topic.conceptIds) {
      if (!conceptId?.trim()) fail(`empty conceptId on ${topic.id}`);
      if (seenConceptIds.has(conceptId)) {
        fail(`duplicate conceptId ${conceptId} on ${topic.id}`);
      }
      seenConceptIds.add(conceptId);
    }

    validateContentMetadata(topic.contentMetadata, topic.id);

    if (!Array.isArray(topic.assessmentSetIds)) {
      fail(`assessmentSetIds must be an array on ${topic.id}`);
    }
    const seenAssessmentSetIds = new Set<string>();
    for (const setId of topic.assessmentSetIds) {
      if (!setId?.trim()) fail(`empty assessmentSetId on ${topic.id}`);
      if (seenAssessmentSetIds.has(setId)) {
        fail(`duplicate assessmentSetId ${setId} on ${topic.id}`);
      }
      seenAssessmentSetIds.add(setId);
      const parsed = parseAssessmentSetId(setId);
      if (!parsed) fail(`malformed assessmentSetId ${setId} on ${topic.id}`);
      if (parsed.topicId !== topic.id) {
        fail(`assessmentSetId ${setId} does not belong to topic ${topic.id}`);
      }
      if (!isAssessmentKind(parsed.kind)) {
        fail(`invalid assessment kind ${parsed.kind} on ${topic.id}`);
      }
    }

    seenIds.add(topic.id);
    seenHrefs.add(topic.href);
  }

  return topics;
}

const ISO_CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const provenanceIds = new Set(contentProvenanceCatalog.map((item) => item.id));

function isContentLifecycle(value: string): value is ContentLifecycle {
  for (const lifecycle of CONTENT_LIFECYCLES) {
    if (lifecycle === value) return true;
  }
  return false;
}

function isRealCalendarDate(value: string): boolean {
  if (!ISO_CALENDAR_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateContentMetadata(
  metadata: {
    version: number;
    lifecycle: string;
    sourceId?: string;
    updatedAt?: string;
  },
  topicId: string,
): ContentMetadata {
  if (!metadata) fail(`missing contentMetadata on ${topicId}`);

  if (!Number.isInteger(metadata.version) || metadata.version < 1) {
    fail(`invalid content version ${String(metadata.version)} on ${topicId}`);
  }

  if (!isContentLifecycle(metadata.lifecycle)) {
    fail(`invalid content lifecycle ${metadata.lifecycle} on ${topicId}`);
  }

  if (metadata.sourceId !== undefined) {
    if (!metadata.sourceId.trim()) fail(`empty sourceId on ${topicId}`);
    if (!provenanceIds.has(metadata.sourceId)) {
      fail(`unknown sourceId ${metadata.sourceId} on ${topicId}`);
    }
  }

  if (metadata.updatedAt !== undefined) {
    if (!metadata.updatedAt.trim()) fail(`empty updatedAt on ${topicId}`);
    if (!isRealCalendarDate(metadata.updatedAt)) {
      fail(`invalid updatedAt ${metadata.updatedAt} on ${topicId}`);
    }
  }

  const valid: ContentMetadata = {
    version: metadata.version,
    lifecycle: metadata.lifecycle,
  };
  if (metadata.sourceId !== undefined) valid.sourceId = metadata.sourceId;
  if (metadata.updatedAt !== undefined) valid.updatedAt = metadata.updatedAt;
  return valid;
}

/**
 * Bidirectional coverage between a subject's payload slugs and the manifest.
 * Used at Geography route-module load so identity and payload cannot drift.
 */
export function assertSubjectPayloadCoverage(input: {
  subject: string;
  payloadSlugs: readonly string[];
  payloadCategorySlugs?: readonly string[];
  manifest: readonly CanonicalTopic[];
}): void {
  const subjectTopics = input.manifest.filter(
    (topic) => topic.subjectId === input.subject,
  );
  const manifestSlugs = new Set(subjectTopics.map((topic) => topic.slug));
  const payloadSlugs = new Set(input.payloadSlugs);

  for (const slug of payloadSlugs) {
    if (!slug.trim()) fail(`empty ${input.subject} payload slug`);
    if (!manifestSlugs.has(slug)) {
      fail(`${input.subject} payload slug missing from manifest: ${slug}`);
    }
  }

  for (const topic of subjectTopics) {
    if (!payloadSlugs.has(topic.slug)) {
      fail(`manifest ${topic.id} has no ${input.subject} payload`);
    }
  }

  if (!input.payloadCategorySlugs) return;

  const payloadCategories = new Set(input.payloadCategorySlugs);
  const manifestCategories = new Set(subjectTopics.map((topic) => topic.category));

  for (const category of payloadCategories) {
    if (!manifestCategories.has(category)) {
      fail(`${input.subject} category missing from manifest topics: ${category}`);
    }
  }

  for (const category of manifestCategories) {
    if (!payloadCategories.has(category)) {
      fail(`manifest category ${category} is not a live ${input.subject} grouping`);
    }
  }

  for (const slug of payloadSlugs) {
    if (payloadCategories.has(slug)) {
      fail(`${input.subject} topic slug collides with category slug: ${slug}`);
    }
  }
}
