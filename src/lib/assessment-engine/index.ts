/**
 * Assessment Engine (Phase 3A–3F).
 *
 * Topic Engine discovers assessment capability.
 * Phase 3A contracts describe delivery, response, session, and result shapes.
 * Phase 3B scores MCQ responses against an internal scoring representation.
 * Phase 3C adapts a canonical AssessmentSet payload into scoring questions.
 * Phase 3D composes a public, answer-safe AssessmentDelivery in practice mode.
 * Phase 3E owns in-memory session lifecycle. Sessions are not persisted.
 * Phase 3F owns canonical result/outcome construction and validation.
 * Phases 3G–3H are verification gates, not additional runtime layers.
 *
 * Canonical set identity: src/lib/assessment/
 * Geography MCQ payload: src/lib/geography-data.ts (adapter may import; delivery/scoring/session/result do not)
 * Legacy UI scoring: src/lib/assessment/scoring.ts
 *
 * ScoringMcqQuestion is a scoring-only input. It is not a public delivery DTO.
 */

export {
  deliverMcqAssessment,
} from "./delivery";
export type {
  AssessmentDeliveryResult,
  DeliverMcqAssessmentInput,
} from "./delivery";
export {
  abandonAssessmentSession,
  ASSESSMENT_SESSION_ERROR_CODES,
  completeAssessmentSession,
  createAssessmentSessionClock,
  createAssessmentSessionIdFactory,
  recordAssessmentResponse,
  startAssessmentSession,
} from "./session";
export type {
  AssessmentClock,
  AssessmentSessionDependencies,
  AssessmentSessionError,
  AssessmentSessionErrorCode,
  AssessmentSessionFailure,
  AssessmentSessionIdFactory,
  AssessmentSessionResult,
  AssessmentSessionSuccess,
  CompleteAssessmentSessionInput,
} from "./session";
export {
  parseAssessmentQuestionKey,
  serializeAssessmentQuestionKey,
} from "./identity";
export {
  ASSESSMENT_RESULT_ERROR_CODES,
  createMcqAssessmentResult,
  validateMcqAssessmentResult,
} from "./result";
export type {
  AssessmentResultCreationResult,
  AssessmentResultError,
  AssessmentResultErrorCode,
  AssessmentResultFailure,
  AssessmentResultSuccess,
  CreateMcqAssessmentResultInput,
  ValidateMcqAssessmentResultExpected,
} from "./result";
export {
  ASSESSMENT_PAYLOAD_ADAPTER_ERROR_CODES,
  adaptMcqAssessmentPayload,
  toMcqDeliveryQuestion,
  toMcqDeliveryQuestions,
} from "./payload-adapter";
export type {
  AdaptMcqAssessmentPayloadInput,
  AdaptedMcqPayload,
  AssessmentPayloadAdapterError,
  AssessmentPayloadAdapterErrorCode,
  AssessmentPayloadAdapterFailure,
  AssessmentPayloadAdapterResult,
  AssessmentPayloadAdapterSuccess,
} from "./payload-adapter";
export {
  ASSESSMENT_SCORING_ERROR_CODES,
  isMcqAnswerCorrect,
  scoreMcqAssessment,
} from "./scoring";
export type {
  AssessmentScoringError,
  AssessmentScoringErrorCode,
  AssessmentScoringFailure,
  AssessmentScoringResult,
  AssessmentScoringSuccess,
  McqAssessmentScore,
  ScoreMcqAssessmentInput,
  ScoringMcqQuestion,
} from "./scoring";
export {
  ASSESSMENT_MODALITIES,
  ASSESSMENT_RESULT_STATUSES,
  ASSESSMENT_SESSION_MODES,
  ASSESSMENT_SESSION_STATUSES,
  CURRENT_ASSESSMENT_MODALITY,
  CURRENT_ASSESSMENT_SESSION_MODE,
} from "./types";
export type {
  AssessmentDelivery,
  AssessmentDeliveryQuestion,
  AssessmentModality,
  AssessmentQuestionKey,
  AssessmentQuestionOutcome,
  AssessmentResponse,
  AssessmentResult,
  AssessmentResultStatus,
  AssessmentSession,
  AssessmentSessionMode,
  AssessmentSessionStatus,
  McqAssessmentResponse,
  McqDeliveryQuestion,
  McqQuestionOutcome,
} from "./types";
