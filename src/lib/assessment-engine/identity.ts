/**
 * Delivery question-key helpers (Phase 3A).
 *
 * Structured AssessmentQuestionKey remains the primary contract.
 * Serialized form is optional: `${assessmentSetId}#v${contentVersion}#${ordinal}`.
 * Not a session-id generator. Not a payload question id.
 */

import type { AssessmentQuestionKey } from "./types";

export function serializeAssessmentQuestionKey(key: AssessmentQuestionKey): string {
  return `${key.assessmentSetId}#v${key.contentVersion}#${key.ordinal}`;
}

export function parseAssessmentQuestionKey(serialized: string): AssessmentQuestionKey | undefined {
  const versionMark = serialized.lastIndexOf("#v");
  if (versionMark <= 0) return undefined;
  const assessmentSetId = serialized.slice(0, versionMark);
  const rest = serialized.slice(versionMark + 2);
  const ordinalMark = rest.lastIndexOf("#");
  if (ordinalMark < 0) return undefined;
  const versionText = rest.slice(0, ordinalMark);
  const ordinalText = rest.slice(ordinalMark + 1);
  const contentVersion = Number(versionText);
  const ordinal = Number(ordinalText);
  if (!assessmentSetId.trim()) return undefined;
  if (!Number.isInteger(contentVersion) || contentVersion < 1) return undefined;
  if (!Number.isInteger(ordinal) || ordinal < 0) return undefined;
  return { assessmentSetId, contentVersion, ordinal };
}
