/**
 * SearchDocument builders. Project canonical catalogs; do not copy payloads.
 */

import { assessmentSets } from "@/lib/assessment/sets";
import { contentManifest, getCanonicalTopic } from "@/lib/content/manifest";
import { categories, subjects } from "@/lib/knowledge/catalog";
import { concepts } from "@/lib/knowledge/concepts";
import type { AssessmentSet } from "@/lib/assessment/types";
import type { CanonicalTopic } from "@/lib/content/types";
import type { Category, Concept, Subject } from "@/lib/knowledge/types";
import { SEARCH_DOCUMENT_KINDS, type SearchDocument, type SearchDocumentKind } from "./types";

function kindOrder(kind: SearchDocumentKind): number {
  return SEARCH_DOCUMENT_KINDS.indexOf(kind);
}

function searchTextFor(parts: readonly (string | undefined)[]): string {
  const unique: string[] = [];
  for (const part of parts) {
    if (!part || !part.trim()) continue;
    if (unique.includes(part)) continue;
    unique.push(part);
  }
  return unique.join(" ");
}

function optionalString<K extends string>(key: K, value: string | undefined): { [P in K]?: string } {
  if (value === undefined || !value.trim()) return {};
  return { [key]: value } as { [P in K]: string };
}

export function subjectSearchDocument(subject: Subject): SearchDocument {
  return {
    id: subject.id,
    kind: "subject",
    title: subject.title,
    slug: subject.slug,
    subjectId: subject.id,
    keywords: [subject.slug],
    searchText: searchTextFor([subject.title, subject.slug, subject.id]),
  };
}

export function categorySearchDocument(category: Category): SearchDocument {
  return {
    id: category.id,
    kind: "category",
    title: category.title,
    slug: category.slug,
    subjectId: category.subjectId,
    categoryId: category.id,
    keywords: [category.slug],
    searchText: searchTextFor([category.title, category.slug, category.id]),
    ...optionalString("href", category.href),
  };
}

export function topicSearchDocument(topic: CanonicalTopic): SearchDocument {
  return {
    id: topic.id,
    kind: "topic",
    title: topic.title,
    slug: topic.slug,
    href: topic.href,
    subjectId: topic.subjectId,
    categoryId: topic.categoryId,
    topicId: topic.id,
    keywords: [topic.slug, topic.category],
    searchText: searchTextFor([topic.title, topic.slug, topic.id]),
  };
}

export function conceptSearchDocument(concept: Concept): SearchDocument {
  const topic = getCanonicalTopic(concept.topicId);
  return {
    id: concept.id,
    kind: "concept",
    title: concept.title,
    slug: concept.slug,
    topicId: concept.topicId,
    conceptId: concept.id,
    keywords: [concept.slug],
    searchText: searchTextFor([concept.title, concept.slug, concept.id]),
    ...optionalString("subjectId", topic?.subjectId),
    ...optionalString("categoryId", topic?.categoryId),
  };
}

export function assessmentSetSearchDocument(set: AssessmentSet): SearchDocument {
  const topic = getCanonicalTopic(set.topicId);
  return {
    id: set.id,
    kind: "assessment_set",
    title: set.title,
    assessmentSetId: set.id,
    topicId: set.topicId,
    keywords: [set.kind],
    searchText: searchTextFor([set.title, set.kind, set.id]),
    ...optionalString("subjectId", topic?.subjectId),
    ...optionalString("categoryId", topic?.categoryId),
    ...optionalString("href", topic?.href),
  };
}

export function compareSearchDocuments(left: SearchDocument, right: SearchDocument): number {
  const kindDelta = kindOrder(left.kind) - kindOrder(right.kind);
  if (kindDelta !== 0) return kindDelta;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export function buildSearchDocuments(): SearchDocument[] {
  const documents: SearchDocument[] = [
    ...subjects.map(subjectSearchDocument),
    ...categories.map(categorySearchDocument),
    ...contentManifest.map(topicSearchDocument),
    ...concepts.map(conceptSearchDocument),
    ...assessmentSets.map(assessmentSetSearchDocument),
  ];
  return documents.sort(compareSearchDocuments);
}
