import { canonicalHref } from "@/lib/content/href";
import type { Category, Discipline, Subject } from "./types";

/**
 * Geography as the first implementation of the universal knowledge contracts.
 *
 * Identity/classification only (discipline, subject, categories).
 * Concept identity is src/lib/knowledge/geography-concepts.ts.
 * Study text and MCQs remain in geography-data.ts.
 * Titles and slugs match existing Geography routes and geography-data categories.
 */

export const GEOGRAPHY_DISCIPLINE_ID = "geography";
export const GEOGRAPHY_SUBJECT_ID = "geography";

export const geographyDiscipline: Discipline = {
  id: GEOGRAPHY_DISCIPLINE_ID,
  slug: "geography",
  title: "Geography",
};

export const geographySubject: Subject = {
  id: GEOGRAPHY_SUBJECT_ID,
  disciplineId: GEOGRAPHY_DISCIPLINE_ID,
  slug: "geography",
  title: "Geography",
};

function geographyCategory(slug: string, title: string): Category {
  return {
    id: `${GEOGRAPHY_SUBJECT_ID}/${slug}`,
    subjectId: GEOGRAPHY_SUBJECT_ID,
    slug,
    title,
    href: canonicalHref("geography", slug),
  };
}

export const geographyCategories: Category[] = [
  geographyCategory("physical-geography", "Physical Geography"),
  geographyCategory("human-geography", "Human Geography"),
  geographyCategory("economic-geography", "Economic Geography"),
  geographyCategory("environmental-geography", "Environmental Geography"),
  geographyCategory("geography-of-bangladesh", "Geography of Bangladesh"),
];
