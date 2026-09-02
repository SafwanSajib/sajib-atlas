/**
 * Learner profile and goals identity (Phase 1G).
 *
 * Canonical learnerId is owned by the identity foundation (Phase 7A).
 * Local-first contracts. Not an account, not authentication, not completion
 * storage, and not analytics events.
 *
 * JSON-safe primitives only. No Date, Map, functions, or PII fields.
 */

export { LOCAL_LEARNER_ID } from "@/lib/identity/types";

export type LearnerProfile = {
  learnerId: string;
  displayName?: string;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const LEARNER_GOAL_TYPES = ["study", "complete", "practice"] as const;
export type LearnerGoalType = (typeof LEARNER_GOAL_TYPES)[number];

export const LEARNER_GOAL_STATUSES = ["active", "completed", "archived"] as const;
export type LearnerGoalStatus = (typeof LEARNER_GOAL_STATUSES)[number];

/**
 * Canonical id refs only. Do not embed subjects, topics, or MCQ arrays.
 * Which field is required depends on goal type (see validateLearnerGoal).
 */
export type LearnerGoalTarget = {
  subjectId?: string;
  topicId?: string;
  assessmentSetId?: string;
};

export type LearnerGoal = {
  id: string;
  type: LearnerGoalType;
  status: LearnerGoalStatus;
  target: LearnerGoalTarget;
  createdAt?: string;
  updatedAt?: string;
};
