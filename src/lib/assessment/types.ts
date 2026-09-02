import type { ContentSource } from "@/lib/content/types";

/**
 * Subject-independent MCQ assessment object.
 * Question identity (`id`) is deferred: existing Geography items have none,
 * and adding one would require a mass content rewrite.
 */
export type MCQQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  shortcutOrTrap: string;
};

/**
 * Assessment kinds currently used in the repository.
 * Additional kinds must not change topic identity.
 */
export const ASSESSMENT_KINDS = ["mcq-practice"] as const;
export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

/**
 * Pointer at an existing payload location. Does not copy questions.
 */
export type AssessmentPayloadRef = {
  module: ContentSource;
  field: "sections.mcqPractice";
};

/**
 * Identity-level assessment set. Not the MCQ payload.
 * `id` is `${topicId}/${kind}`. Version is not included: contentMetadata.version
 * already versions the payload that this set points at.
 */
export type AssessmentSet = {
  id: string;
  topicId: string;
  kind: AssessmentKind;
  title: string;
  payload: AssessmentPayloadRef;
};
