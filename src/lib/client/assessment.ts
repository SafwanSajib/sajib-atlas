/**
 * Assessment-set identity reads. Omits payload pointers and answers.
 * Does not score or deliver MCQ arrays.
 */

import { toAssessmentSetApiRead } from "@/lib/contracts/compose";
import { getAssessmentSetRead } from "@/lib/contracts/read";
import type { AssessmentSetApiRead } from "@/lib/contracts/api";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";

export function clientReadAssessment(assessmentSetId: string): PlatformReadResult<AssessmentSetApiRead> {
  if (typeof assessmentSetId !== "string" || !assessmentSetId.trim()) {
    return platformFailure("invalid_request", "assessmentSetId is required");
  }
  const set = getAssessmentSetRead(assessmentSetId.trim());
  if (!set) return platformFailure("not_found", "assessment set not found");
  const access = decideAccess(
    { scope: "assessment_set", targetId: set.id, learnerId: LOCAL_LEARNER_ID },
    [],
  );
  if (!access.allowed) return platformFailure("invalid_request", "entitlement required");
  return platformSuccess(toAssessmentSetApiRead(set));
}
