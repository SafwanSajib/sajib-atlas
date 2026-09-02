import type { AssessmentKind } from "@/lib/assessment/types";
import type { ContentLifecycle, ContentStatus } from "@/lib/content/types";

/**
 * API-ready read contracts (Phase 1E).
 *
 * JSON-safe projections of canonical identity. Not HTTP, not a second catalog.
 * Do not embed Geography study paragraphs or MCQ arrays.
 */

export type DisciplineRead = {
  id: string;
  slug: string;
  title: string;
};

export type SubjectRead = {
  id: string;
  disciplineId: string;
  slug: string;
  title: string;
};

export type CategoryRead = {
  id: string;
  subjectId: string;
  slug: string;
  title: string;
  href?: string;
};

export type ConceptRead = {
  id: string;
  topicId: string;
  slug: string;
  title: string;
};

export type ContentMetadataRead = {
  version: number;
  lifecycle: ContentLifecycle;
  sourceId?: string;
  updatedAt?: string;
};

export type AssessmentPayloadRefRead = {
  module: "geography-data" | "knowledge-data";
  field: "sections.mcqPractice";
};

export type AssessmentSetRead = {
  id: string;
  topicId: string;
  kind: AssessmentKind;
  title: string;
  payload: AssessmentPayloadRefRead;
};

/**
 * Canonical topic as a consumer-facing read model.
 * Identity, metadata, and assessment-set refs stay separate fields.
 * Study paragraphs and MCQ arrays are not included.
 */
export type TopicRead = {
  id: string;
  href: string;
  title: string;
  slug: string;
  disciplineId: string;
  subjectId: string;
  categoryId: string;
  contentStatus: ContentStatus;
  contentMetadata: ContentMetadataRead;
  conceptIds: readonly string[];
  assessmentSetIds: readonly string[];
};
