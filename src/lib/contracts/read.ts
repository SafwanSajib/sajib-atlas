import {
  getAssessmentSet,
  getAssessmentSetsByTopicId as getCanonicalAssessmentSetsByTopicId,
} from "@/lib/assessment/sets";
import type { AssessmentSet } from "@/lib/assessment/types";
import { contentManifest, getCanonicalTopic } from "@/lib/content/manifest";
import type { CanonicalTopic, ContentMetadata } from "@/lib/content/types";
import {
  disciplines,
  getCategoriesBySubject,
  getCategory,
  getDiscipline,
  getSubject,
  subjects,
} from "@/lib/knowledge/catalog";
import {
  getConcept,
  getConceptsByTopicId as getCanonicalConceptsByTopicId,
} from "@/lib/knowledge/concepts";
import type { Category, Concept, Discipline, Subject } from "@/lib/knowledge/types";
import type {
  AssessmentSetRead,
  CategoryRead,
  ConceptRead,
  ContentMetadataRead,
  DisciplineRead,
  SubjectRead,
  TopicRead,
} from "./types";

/**
 * Read-contract projection (Phase 1E).
 *
 * Derived from the canonical catalogs. Not a second registry.
 * Pure: no React, learner, browser APIs, or payload modules.
 */

export type {
  AssessmentSetRead,
  CategoryRead,
  ConceptRead,
  ContentMetadataRead,
  DisciplineRead,
  SubjectRead,
  TopicRead,
};

function toDisciplineRead(item: Discipline): DisciplineRead {
  return { id: item.id, slug: item.slug, title: item.title };
}

function toSubjectRead(item: Subject): SubjectRead {
  return {
    id: item.id,
    disciplineId: item.disciplineId,
    slug: item.slug,
    title: item.title,
  };
}

function toCategoryRead(item: Category): CategoryRead {
  const read: CategoryRead = {
    id: item.id,
    subjectId: item.subjectId,
    slug: item.slug,
    title: item.title,
  };
  if (item.href !== undefined) read.href = item.href;
  return read;
}

function toContentMetadataRead(metadata: ContentMetadata): ContentMetadataRead {
  const read: ContentMetadataRead = {
    version: metadata.version,
    lifecycle: metadata.lifecycle,
  };
  if (metadata.sourceId !== undefined) read.sourceId = metadata.sourceId;
  if (metadata.updatedAt !== undefined) read.updatedAt = metadata.updatedAt;
  return read;
}

function toConceptRead(item: Concept): ConceptRead {
  return {
    id: item.id,
    topicId: item.topicId,
    slug: item.slug,
    title: item.title,
  };
}

function toAssessmentSetRead(item: AssessmentSet): AssessmentSetRead {
  return {
    id: item.id,
    topicId: item.topicId,
    kind: item.kind,
    title: item.title,
    payload: {
      module: item.payload.module,
      field: item.payload.field,
    },
  };
}

export function toTopicRead(topic: CanonicalTopic): TopicRead {
  return {
    id: topic.id,
    href: topic.href,
    title: topic.title,
    slug: topic.slug,
    disciplineId: topic.disciplineId,
    subjectId: topic.subjectId,
    categoryId: topic.categoryId,
    contentStatus: topic.contentStatus,
    contentMetadata: toContentMetadataRead(topic.contentMetadata),
    conceptIds: [...topic.conceptIds],
    assessmentSetIds: [...topic.assessmentSetIds],
  };
}

export function getDisciplines(): DisciplineRead[] {
  return disciplines.map(toDisciplineRead);
}

export function getDisciplineRead(id: string): DisciplineRead | undefined {
  const item = getDiscipline(id);
  return item ? toDisciplineRead(item) : undefined;
}

export function getSubjectsByDisciplineId(disciplineId: string): SubjectRead[] {
  return subjects.filter((item) => item.disciplineId === disciplineId).map(toSubjectRead);
}

export function getSubjectRead(id: string): SubjectRead | undefined {
  const item = getSubject(id);
  return item ? toSubjectRead(item) : undefined;
}

export function getCategoriesBySubjectId(subjectId: string): CategoryRead[] {
  return getCategoriesBySubject(subjectId).map(toCategoryRead);
}

export function getCategoryRead(id: string): CategoryRead | undefined {
  const item = getCategory(id);
  return item ? toCategoryRead(item) : undefined;
}

export function getTopicsByCategoryId(categoryId: string): TopicRead[] {
  return contentManifest.filter((topic) => topic.categoryId === categoryId).map(toTopicRead);
}

export function getTopicRead(id: string): TopicRead | undefined {
  const topic = getCanonicalTopic(id);
  return topic ? toTopicRead(topic) : undefined;
}

export function getConceptsByTopicId(topicId: string): ConceptRead[] {
  return getCanonicalConceptsByTopicId(topicId).map(toConceptRead);
}

export function getConceptRead(id: string): ConceptRead | undefined {
  const item = getConcept(id);
  return item ? toConceptRead(item) : undefined;
}

export function getAssessmentSetsByTopicId(topicId: string): AssessmentSetRead[] {
  return getCanonicalAssessmentSetsByTopicId(topicId).map(toAssessmentSetRead);
}

export function getAssessmentSetRead(id: string): AssessmentSetRead | undefined {
  const item = getAssessmentSet(id);
  return item ? toAssessmentSetRead(item) : undefined;
}
