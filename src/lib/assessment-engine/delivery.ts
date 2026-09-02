/**
 * Universal MCQ delivery (Phase 3D).
 *
 * AssessmentSet → Phase 3C adapter → ScoringMcqQuestion[] → McqDeliveryQuestion[]
 * → AssessmentDelivery.
 *
 * Delivers questions only. Does not score, create sessions, persist, or
 * import Geography payload. Canonical set identity remains src/lib/assessment/.
 * Public delivery omits answer, explanation, and payload pointers.
 */

import {
  adaptMcqAssessmentPayload,
  toMcqDeliveryQuestion,
  type AdaptMcqAssessmentPayloadInput,
  type AdaptedMcqPayload,
  type AssessmentPayloadAdapterResult,
} from "./payload-adapter";
import {
  CURRENT_ASSESSMENT_SESSION_MODE,
  type AssessmentDelivery,
} from "./types";

export type DeliverMcqAssessmentInput = AdaptMcqAssessmentPayloadInput;
export type AssessmentDeliveryResult = AssessmentPayloadAdapterResult<AssessmentDelivery>;

function toPublicDelivery(adapted: AdaptedMcqPayload): AssessmentDelivery {
  return {
    assessmentSetId: adapted.assessmentSetId,
    contentVersion: adapted.contentVersion,
    mode: CURRENT_ASSESSMENT_SESSION_MODE,
    questions: adapted.questions.map(toMcqDeliveryQuestion),
  };
}

/**
 * Compose a public, answer-safe AssessmentDelivery for practice mode.
 * Consumes Phase 3C. Preserves assessmentSetId, contentVersion, keys, and order.
 */
export function deliverMcqAssessment(
  input: DeliverMcqAssessmentInput,
): AssessmentDeliveryResult {
  const adapted = adaptMcqAssessmentPayload(input);
  if (!adapted.ok) return adapted;

  return {
    ok: true,
    data: toPublicDelivery(adapted.data),
  };
}
