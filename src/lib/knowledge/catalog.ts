import {
  geographyCategories,
  geographyDiscipline,
  geographySubject,
} from "./geography";
import type { Category, Discipline, KnowledgeCatalog, Subject } from "./types";
import { validateKnowledgeCatalog } from "./validate";

/**
 * Universal knowledge catalog (taxonomy).
 *
 * Hierarchy owned here: Discipline → Subject → Category.
 * Topic identity lives in src/lib/content/manifest.ts.
 * Concept identity lives in src/lib/knowledge/concepts.ts.
 *
 * Geography is the first full implementation (routable categories + study topics).
 * BCS and English are existing catalog stubs from knowledge-data / the Phase 0
 * manifest — represented here so future subjects can share this structure
 * without EnglishRegistry.ts / EnglishSearch.ts copies.
 */

const bcsDiscipline: Discipline = {
  id: "bcs",
  slug: "bcs",
  title: "BCS Preparation",
};

const englishDiscipline: Discipline = {
  id: "english",
  slug: "english",
  title: "English & IELTS",
};

const bcsSubject: Subject = {
  id: "bcs",
  disciplineId: "bcs",
  slug: "bcs",
  title: "BCS Preparation",
};

const englishSubject: Subject = {
  id: "english",
  disciplineId: "english",
  slug: "english",
  title: "English & IELTS",
};

const stubCategory = (subjectId: string, slug: string, title: string): Category => ({
  id: `${subjectId}/${slug}`,
  subjectId,
  slug,
  title,
});

export const knowledgeCatalog: KnowledgeCatalog = validateKnowledgeCatalog({
  disciplines: [geographyDiscipline, bcsDiscipline, englishDiscipline],
  subjects: [geographySubject, bcsSubject, englishSubject],
  categories: [
    ...geographyCategories,
    stubCategory("bcs", "core", "Core"),
    stubCategory("english", "core", "Core"),
  ],
});

export const disciplines = knowledgeCatalog.disciplines;
export const subjects = knowledgeCatalog.subjects;
export const categories = knowledgeCatalog.categories;

export const disciplinesById: Readonly<Record<string, Discipline>> =
  Object.fromEntries(disciplines.map((item) => [item.id, item]));

export const subjectsById: Readonly<Record<string, Subject>> =
  Object.fromEntries(subjects.map((item) => [item.id, item]));

export const categoriesById: Readonly<Record<string, Category>> =
  Object.fromEntries(categories.map((item) => [item.id, item]));

export function getDiscipline(id: string): Discipline | undefined {
  return disciplinesById[id];
}

export function getSubject(id: string): Subject | undefined {
  return subjectsById[id];
}

export function getCategory(id: string): Category | undefined {
  return categoriesById[id];
}

export function getCategoriesBySubject(subjectId: string): Category[] {
  return categories.filter((item) => item.subjectId === subjectId);
}

export function getRoutableCategoryHrefs(subjectId: string): string[] {
  return categories
    .filter((item) => item.subjectId === subjectId && item.href)
    .map((item) => item.href)
    .filter((href): href is string => typeof href === "string")
    .sort();
}
