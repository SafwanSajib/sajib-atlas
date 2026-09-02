import type { EntitlementScope, EntitlementTarget } from "./types";

export function entitlementId(scope: EntitlementScope, targetId: string): string {
  return `entitlement/${scope}/${targetId}`;
}

export function primaryTargetId(
  scope: EntitlementScope,
  target: EntitlementTarget,
): string | undefined {
  if (scope === "feature") return target.featureKey;
  if (scope === "subject") return target.subjectId;
  if (scope === "topic") return target.topicId;
  return target.assessmentSetId;
}
