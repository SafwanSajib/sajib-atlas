import { getAssessmentSet } from "@/lib/assessment/sets";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { getSubject } from "@/lib/knowledge/catalog";
import { isLocalLearnerId, learnerGoalId, primaryTargetId } from "./identity";
import {
  LEARNER_GOAL_STATUSES,
  LEARNER_GOAL_TYPES,
  type LearnerGoal,
  type LearnerGoalStatus,
  type LearnerGoalType,
  type LearnerProfile,
} from "./types";

function fail(message: string): never {
  throw new Error(`Learner profile: ${message}`);
}

const ISO_DATE_TIME_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const LOCALE_TAG = /^[a-z]{2}(-[A-Za-z]{2})?$/;

function isGoalType(value: string): value is LearnerGoalType {
  for (const type of LEARNER_GOAL_TYPES) {
    if (type === value) return true;
  }
  return false;
}

function isGoalStatus(value: string): value is LearnerGoalStatus {
  for (const status of LEARNER_GOAL_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function isIsoDateTimeUtc(value: string): boolean {
  if (!ISO_DATE_TIME_UTC.test(value)) return false;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  const iso = new Date(ms).toISOString();
  if (iso === value) return true;
  if (value.endsWith("Z") && !value.includes(".")) {
    return iso === `${value.slice(0, -1)}.000Z`;
  }
  return false;
}

function assertOptionalTimestamp(value: string | undefined, label: string): void {
  if (value === undefined) return;
  if (!value.trim() || !isIsoDateTimeUtc(value)) {
    fail(`invalid ${label}`);
  }
}

export function validateLearnerProfile(input: {
  learnerId: string;
  displayName?: string;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
}): LearnerProfile {
  if (!input.learnerId?.trim()) fail("empty learnerId");
  if (input.learnerId !== input.learnerId.trim()) fail("learnerId has surrounding whitespace");
  if (!isLocalLearnerId(input.learnerId)) {
    fail(`unsupported learnerId ${input.learnerId}; local identity is learner/local`);
  }

  const profile: LearnerProfile = { learnerId: input.learnerId };

  if (input.displayName !== undefined) {
    const name = input.displayName.trim();
    if (!name) fail("empty displayName");
    if (name.includes("@")) fail("displayName must not be an email");
    profile.displayName = name;
  }

  if (input.locale !== undefined) {
    if (!LOCALE_TAG.test(input.locale)) fail(`invalid locale ${input.locale}`);
    profile.locale = input.locale;
  }

  assertOptionalTimestamp(input.createdAt, "createdAt");
  assertOptionalTimestamp(input.updatedAt, "updatedAt");
  if (input.createdAt !== undefined) profile.createdAt = input.createdAt;
  if (input.updatedAt !== undefined) profile.updatedAt = input.updatedAt;

  return profile;
}

export function validateLearnerGoal(input: {
  id: string;
  type: string;
  status: string;
  target: {
    subjectId?: string;
    topicId?: string;
    assessmentSetId?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}): LearnerGoal {
  if (!input.id?.trim()) fail("empty goal id");
  if (!isGoalType(input.type)) fail(`invalid goal type ${input.type}`);
  if (!isGoalStatus(input.status)) fail(`invalid goal status ${input.status}`);
  if (!input.target) fail("missing goal target");

  const primary = primaryTargetId(input.type, input.target);
  if (!primary?.trim()) {
    fail(`goal type ${input.type} requires a primary target id`);
  }
  const expectedId = learnerGoalId(input.type, primary);
  if (input.id !== expectedId) {
    fail(`goal id must equal ${expectedId}`);
  }

  const target: LearnerGoal["target"] = {};

  if (input.type === "study") {
    if (!getSubject(primary)) fail(`unknown subject ${primary}`);
    target.subjectId = primary;
  } else if (input.type === "complete") {
    const topic = getCanonicalTopic(primary);
    if (!topic) fail(`unknown topic ${primary}`);
    target.topicId = primary;
  } else {
    const set = getAssessmentSet(primary);
    if (!set) fail(`unknown assessment set ${primary}`);
    target.assessmentSetId = primary;
  }

  if (input.target.subjectId !== undefined && input.type !== "study") {
    if (!getSubject(input.target.subjectId)) fail(`unknown subject ${input.target.subjectId}`);
    if (input.type === "complete") {
      const topic = getCanonicalTopic(primary);
      if (topic && topic.subjectId !== input.target.subjectId) {
        fail("target.subjectId does not match topic subject");
      }
    }
    target.subjectId = input.target.subjectId;
  }
  if (input.target.topicId !== undefined && input.type !== "complete") {
    const topic = getCanonicalTopic(input.target.topicId);
    if (!topic) fail(`unknown topic ${input.target.topicId}`);
    if (input.type === "practice") {
      const set = getAssessmentSet(primary);
      if (set && set.topicId !== input.target.topicId) {
        fail("target.topicId does not match assessment set topic");
      }
    }
    target.topicId = input.target.topicId;
  }
  if (input.target.assessmentSetId !== undefined && input.type !== "practice") {
    fail("assessmentSetId is only valid on practice goals");
  }

  const goal: LearnerGoal = {
    id: input.id,
    type: input.type,
    status: input.status,
    target,
  };
  assertOptionalTimestamp(input.createdAt, "createdAt");
  assertOptionalTimestamp(input.updatedAt, "updatedAt");
  if (input.createdAt !== undefined) goal.createdAt = input.createdAt;
  if (input.updatedAt !== undefined) goal.updatedAt = input.updatedAt;
  return goal;
}
