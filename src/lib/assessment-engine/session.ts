/**
 * In-memory assessment session lifecycle (Phase 3E).
 *
 * Delivery → session → responses → completed | abandoned.
 * Execution state only. Not learner history, persistence, analytics, or UI.
 *
 * Completion reuses Phase 3B `scoreMcqAssessment`. This module does not
 * import Geography payload or duplicate scoring.
 */

import { serializeAssessmentQuestionKey } from "./identity";
import { createMcqAssessmentResult } from "./result";
import { scoreMcqAssessment, type ScoringMcqQuestion } from "./scoring";
import type {
  AssessmentDelivery,
  AssessmentQuestionKey,
  AssessmentResponse,
  AssessmentResult,
  AssessmentSession,
  McqAssessmentResponse,
  McqQuestionOutcome,
} from "./types";

export type AssessmentClock = {
  now(): string;
};

export type AssessmentSessionIdFactory = {
  createSessionId(): string;
};

export type AssessmentSessionDependencies = {
  clock?: AssessmentClock;
  sessionIds?: AssessmentSessionIdFactory;
};

export type CompleteAssessmentSessionInput = {
  questions: readonly ScoringMcqQuestion[];
};

export const ASSESSMENT_SESSION_ERROR_CODES = [
  "invalid_request",
  "validation_failure",
] as const;
export type AssessmentSessionErrorCode = (typeof ASSESSMENT_SESSION_ERROR_CODES)[number];

export type AssessmentSessionError = {
  code: AssessmentSessionErrorCode;
  message: string;
};

export type AssessmentSessionSuccess = {
  ok: true;
  data: AssessmentSession;
};

export type AssessmentSessionFailure = {
  ok: false;
  error: AssessmentSessionError;
};

export type AssessmentSessionResult = AssessmentSessionSuccess | AssessmentSessionFailure;

function sessionSuccess(data: AssessmentSession): AssessmentSessionSuccess {
  return { ok: true, data };
}

function sessionFailure(code: AssessmentSessionErrorCode, message: string): AssessmentSessionFailure {
  return { ok: false, error: { code, message } };
}

export function createAssessmentSessionClock(): AssessmentClock {
  return {
    now() {
      return new Date().toISOString();
    },
  };
}

export function createAssessmentSessionIdFactory(): AssessmentSessionIdFactory {
  return {
    createSessionId() {
      return crypto.randomUUID();
    },
  };
}

function clockFrom(dependencies?: AssessmentSessionDependencies): AssessmentClock {
  return dependencies?.clock ?? createAssessmentSessionClock();
}

function sessionIdsFrom(dependencies?: AssessmentSessionDependencies): AssessmentSessionIdFactory {
  return dependencies?.sessionIds ?? createAssessmentSessionIdFactory();
}

function copyQuestionKey(key: AssessmentQuestionKey): AssessmentQuestionKey {
  return {
    assessmentSetId: key.assessmentSetId,
    contentVersion: key.contentVersion,
    ordinal: key.ordinal,
  };
}

function copyResponse(response: McqAssessmentResponse): McqAssessmentResponse {
  return {
    questionKey: copyQuestionKey(response.questionKey),
    modality: "mcq",
    selectedOption: response.selectedOption,
  };
}

function copyOutcome(outcome: McqQuestionOutcome): McqQuestionOutcome {
  return {
    questionKey: copyQuestionKey(outcome.questionKey),
    modality: "mcq",
    correct: outcome.correct,
    selectedOption: outcome.selectedOption,
  };
}

function copyResult(result: AssessmentResult): AssessmentResult {
  return {
    assessmentSetId: result.assessmentSetId,
    contentVersion: result.contentVersion,
    sessionId: result.sessionId,
    total: result.total,
    answered: result.answered,
    correct: result.correct,
    incorrect: result.incorrect,
    unanswered: result.unanswered,
    score: result.score,
    percentage: result.percentage,
    status: result.status,
    outcomes: result.outcomes.map(copyOutcome),
  };
}

function copySession(session: AssessmentSession): AssessmentSession {
  const next: AssessmentSession = {
    sessionId: session.sessionId,
    assessmentSetId: session.assessmentSetId,
    contentVersion: session.contentVersion,
    mode: session.mode,
    status: session.status,
    responses: session.responses.map(copyResponse),
  };
  if (session.startedAt !== undefined) next.startedAt = session.startedAt;
  if (session.completedAt !== undefined) next.completedAt = session.completedAt;
  if (session.result !== undefined) next.result = copyResult(session.result);
  if (session.questionKeys !== undefined) {
    next.questionKeys = session.questionKeys.map(copyQuestionKey);
  }
  return next;
}

function keyId(key: AssessmentQuestionKey): string {
  return serializeAssessmentQuestionKey(copyQuestionKey(key));
}

function deliveredKeySet(session: AssessmentSession): Set<string> | AssessmentSessionFailure {
  if (!Array.isArray(session.questionKeys)) {
    return sessionFailure("invalid_request", "session is missing delivery question keys");
  }
  return new Set(session.questionKeys.map(keyId));
}

function requireInProgress(session: AssessmentSession): AssessmentSessionFailure | undefined {
  if (session.status === "completed") {
    return sessionFailure("invalid_request", "completed session is terminal");
  }
  if (session.status === "abandoned") {
    return sessionFailure("invalid_request", "abandoned session is terminal");
  }
  if (session.status !== "in-progress") {
    return sessionFailure("invalid_request", "session must be in-progress");
  }
  return undefined;
}

/**
 * Start an in-memory practice session from a public AssessmentDelivery.
 * Does not persist. Does not store answers.
 */
export function startAssessmentSession(
  delivery: AssessmentDelivery,
  dependencies?: AssessmentSessionDependencies,
): AssessmentSessionResult {
  if (delivery === null || typeof delivery !== "object") {
    return sessionFailure("invalid_request", "delivery must be an object");
  }
  if (typeof delivery.assessmentSetId !== "string" || !delivery.assessmentSetId.trim()) {
    return sessionFailure("invalid_request", "assessmentSetId is required");
  }
  if (!Number.isInteger(delivery.contentVersion) || delivery.contentVersion < 1) {
    return sessionFailure("invalid_request", "contentVersion must be an integer >= 1");
  }
  if (!Array.isArray(delivery.questions)) {
    return sessionFailure("invalid_request", "delivery questions must be an array");
  }

  const questionKeys: AssessmentQuestionKey[] = [];
  const seen = new Set<string>();
  for (const question of delivery.questions) {
    if (question === null || typeof question !== "object") {
      return sessionFailure("invalid_request", "delivery question is invalid");
    }
    const key = question.questionKey;
    if (key === null || typeof key !== "object") {
      return sessionFailure("invalid_request", "delivery question key is required");
    }
    if (key.assessmentSetId !== delivery.assessmentSetId) {
      return sessionFailure("invalid_request", "delivery question assessmentSetId does not match");
    }
    if (key.contentVersion !== delivery.contentVersion) {
      return sessionFailure("invalid_request", "delivery question contentVersion does not match");
    }
    const serialized = keyId(key);
    if (seen.has(serialized)) {
      return sessionFailure("invalid_request", "delivery contains duplicate question keys");
    }
    seen.add(serialized);
    questionKeys.push(copyQuestionKey(key));
  }

  const sessionId = sessionIdsFrom(dependencies).createSessionId();
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return sessionFailure("invalid_request", "sessionId is required");
  }
  if (sessionId === delivery.assessmentSetId) {
    return sessionFailure("invalid_request", "sessionId must be distinct from assessmentSetId");
  }

  const startedAt = clockFrom(dependencies).now();
  if (typeof startedAt !== "string" || !startedAt.trim()) {
    return sessionFailure("invalid_request", "startedAt must be an ISO-8601 string");
  }

  return sessionSuccess({
    sessionId,
    assessmentSetId: delivery.assessmentSetId,
    contentVersion: delivery.contentVersion,
    mode: delivery.mode,
    status: "in-progress",
    startedAt,
    responses: [],
    questionKeys,
  });
}

/**
 * Record or replace an MCQ response on an in-progress session.
 * Same question key replaces the previous response. Does not mutate input.
 */
export function recordAssessmentResponse(
  session: AssessmentSession,
  response: McqAssessmentResponse,
): AssessmentSessionResult {
  if (session === null || typeof session !== "object") {
    return sessionFailure("invalid_request", "session must be an object");
  }
  const terminal = requireInProgress(session);
  if (terminal) return terminal;

  if (response === null || typeof response !== "object") {
    return sessionFailure("invalid_request", "response must be an object");
  }
  if (response.modality !== "mcq") {
    return sessionFailure("validation_failure", "response modality must be mcq");
  }
  const key = response.questionKey;
  if (key === null || typeof key !== "object") {
    return sessionFailure("invalid_request", "response question key is required");
  }
  if (key.assessmentSetId !== session.assessmentSetId) {
    return sessionFailure("validation_failure", "response assessmentSetId does not match session");
  }
  if (key.contentVersion !== session.contentVersion) {
    return sessionFailure("validation_failure", "response contentVersion does not match session");
  }
  if (response.selectedOption !== null && typeof response.selectedOption !== "string") {
    return sessionFailure("invalid_request", "selectedOption must be a string or null");
  }

  const delivered = deliveredKeySet(session);
  if (!(delivered instanceof Set)) return delivered;
  const serialized = keyId(key);
  if (!delivered.has(serialized)) {
    return sessionFailure("validation_failure", "response does not correspond to a delivered question");
  }

  const nextResponses: AssessmentResponse[] = [];
  let replaced = false;
  for (const existing of session.responses) {
    if (keyId(existing.questionKey) === serialized) {
      nextResponses.push(copyResponse(response));
      replaced = true;
    } else {
      nextResponses.push(copyResponse(existing));
    }
  }
  if (!replaced) nextResponses.push(copyResponse(response));

  const next = copySession(session);
  next.responses = nextResponses;
  return sessionSuccess(next);
}

function scoringKeysMatchSession(
  session: AssessmentSession,
  questions: readonly ScoringMcqQuestion[],
): AssessmentSessionFailure | undefined {
  const delivered = deliveredKeySet(session);
  if (!(delivered instanceof Set)) return delivered;
  if (questions.length !== delivered.size) {
    return sessionFailure(
      "validation_failure",
      "scoring questions must match the session delivery keys",
    );
  }
  const seen = new Set<string>();
  for (const question of questions) {
    const serialized = keyId(question.questionKey);
    if (!delivered.has(serialized)) {
      return sessionFailure(
        "validation_failure",
        "scoring question does not correspond to a delivered question",
      );
    }
    if (seen.has(serialized)) {
      return sessionFailure("validation_failure", "scoring questions contain duplicate keys");
    }
    seen.add(serialized);
  }
  return undefined;
}

/**
 * Complete an in-progress session using Phase 3B scoring and the Phase 3F
 * result boundary. Scoring questions are supplied by the caller (adapter).
 */
export function completeAssessmentSession(
  session: AssessmentSession,
  scoring: CompleteAssessmentSessionInput,
  dependencies?: AssessmentSessionDependencies,
): AssessmentSessionResult {
  if (session === null || typeof session !== "object") {
    return sessionFailure("invalid_request", "session must be an object");
  }
  const terminal = requireInProgress(session);
  if (terminal) return terminal;
  if (scoring === null || typeof scoring !== "object" || !Array.isArray(scoring.questions)) {
    return sessionFailure("invalid_request", "scoring questions are required");
  }

  const mismatch = scoringKeysMatchSession(session, scoring.questions);
  if (mismatch) return mismatch;

  const scored = scoreMcqAssessment({
    assessmentSetId: session.assessmentSetId,
    contentVersion: session.contentVersion,
    questions: scoring.questions,
    responses: session.responses,
  });
  if (!scored.ok) {
    return sessionFailure(scored.error.code, scored.error.message);
  }

  const completedAt = clockFrom(dependencies).now();
  if (typeof completedAt !== "string" || !completedAt.trim()) {
    return sessionFailure("invalid_request", "completedAt must be an ISO-8601 string");
  }

  const created = createMcqAssessmentResult({
    sessionId: session.sessionId,
    assessmentSetId: session.assessmentSetId,
    contentVersion: session.contentVersion,
    questionKeys: session.questionKeys ?? [],
    score: scored.data,
  });
  if (!created.ok) {
    return sessionFailure(created.error.code, created.error.message);
  }

  const next = copySession(session);
  next.status = "completed";
  next.completedAt = completedAt;
  next.result = created.data;
  return sessionSuccess(next);
}

/**
 * Abandon an in-progress session. Terminal. Preserves responses. No result.
 */
export function abandonAssessmentSession(
  session: AssessmentSession,
  dependencies?: AssessmentSessionDependencies,
): AssessmentSessionResult {
  if (session === null || typeof session !== "object") {
    return sessionFailure("invalid_request", "session must be an object");
  }
  const terminal = requireInProgress(session);
  if (terminal) return terminal;

  const completedAt = clockFrom(dependencies).now();
  if (typeof completedAt !== "string" || !completedAt.trim()) {
    return sessionFailure("invalid_request", "completedAt must be an ISO-8601 string");
  }

  const next = copySession(session);
  next.status = "abandoned";
  next.completedAt = completedAt;
  delete next.result;
  return sessionSuccess(next);
}
