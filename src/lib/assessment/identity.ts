import { ASSESSMENT_KINDS, type AssessmentKind } from "./types";

/**
 * Deterministic assessment-set identity helpers.
 * Pure: no React, learner, payload, or manifest imports.
 */

export function assessmentSetId(topicId: string, kind: AssessmentKind): string {
  return `${topicId}/${kind}`;
}

export function parseAssessmentSetId(id: string): { topicId: string; kind: string } | undefined {
  const separator = id.lastIndexOf("/");
  if (separator <= 0 || separator === id.length - 1) return undefined;
  const topicId = id.slice(0, separator);
  const kind = id.slice(separator + 1);
  if (!topicId.trim() || !kind.trim() || kind.includes("/")) return undefined;
  return { topicId, kind };
}

export function isAssessmentKind(value: string): value is AssessmentKind {
  for (const kind of ASSESSMENT_KINDS) {
    if (kind === value) return true;
  }
  return false;
}
