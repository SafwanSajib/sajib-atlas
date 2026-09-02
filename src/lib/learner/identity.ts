import { LOCAL_LEARNER_ID, type LearnerGoalType, type LearnerProfile } from "./types";

export { LOCAL_LEARNER_ID };

/**
 * Local learner profile factory. Canonical learnerId comes from identity.
 * Distinct from topic, concept, assessment-set, and analytics event ids.
 */
export function defaultLocalProfile(): LearnerProfile {
  return { learnerId: LOCAL_LEARNER_ID };
}

export function isLocalLearnerId(id: string): boolean {
  return id === LOCAL_LEARNER_ID;
}

export function learnerGoalId(type: LearnerGoalType, targetId: string): string {
  return `goal/${type}/${targetId}`;
}

export function primaryTargetId(
  type: LearnerGoalType,
  target: { subjectId?: string; topicId?: string; assessmentSetId?: string },
): string | undefined {
  if (type === "study") return target.subjectId;
  if (type === "complete") return target.topicId;
  return target.assessmentSetId;
}
