/**
 * Assessment result and outcome boundary (Phase 3F).
 *
 * McqAssessmentScore (Phase 3B) + session identity (Phase 3E)
 *   → AssessmentResult
 *
 * Does not recalculate scoring. Does not mutate sessions. Does not import
 * Geography payload. Public results omit answer, explanation, and payload
 * pointers. Not learner intelligence.
 */

import { serializeAssessmentQuestionKey } from "./identity";
import type { McqAssessmentScore } from "./scoring";
import type {
  AssessmentQuestionKey,
  AssessmentResult,
  McqQuestionOutcome,
} from "./types";

export type CreateMcqAssessmentResultInput = {
  sessionId: string;
  assessmentSetId: string;
  contentVersion: number;
  questionKeys: readonly AssessmentQuestionKey[];
  score: McqAssessmentScore;
};

export type ValidateMcqAssessmentResultExpected = {
  sessionId: string;
  assessmentSetId: string;
  contentVersion: number;
  questionKeys: readonly AssessmentQuestionKey[];
};

export const ASSESSMENT_RESULT_ERROR_CODES = [
  "invalid_request",
  "validation_failure",
] as const;
export type AssessmentResultErrorCode = (typeof ASSESSMENT_RESULT_ERROR_CODES)[number];

export type AssessmentResultError = {
  code: AssessmentResultErrorCode;
  message: string;
};

export type AssessmentResultSuccess = {
  ok: true;
  data: AssessmentResult;
};

export type AssessmentResultFailure = {
  ok: false;
  error: AssessmentResultError;
};

export type AssessmentResultCreationResult = AssessmentResultSuccess | AssessmentResultFailure;

function resultSuccess(data: AssessmentResult): AssessmentResultSuccess {
  return { ok: true, data };
}

function resultFailure(code: AssessmentResultErrorCode, message: string): AssessmentResultFailure {
  return { ok: false, error: { code, message } };
}

function copyQuestionKey(key: AssessmentQuestionKey): AssessmentQuestionKey {
  return {
    assessmentSetId: key.assessmentSetId,
    contentVersion: key.contentVersion,
    ordinal: key.ordinal,
  };
}

function keyId(key: AssessmentQuestionKey): string {
  return serializeAssessmentQuestionKey(copyQuestionKey(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateQuestionKey(
  key: unknown,
  label: string,
): AssessmentResultFailure | AssessmentQuestionKey {
  if (!isRecord(key)) {
    return resultFailure("invalid_request", `${label} question key is invalid`);
  }
  const assessmentSetId = key.assessmentSetId;
  const contentVersion = key.contentVersion;
  const ordinal = key.ordinal;
  if (typeof assessmentSetId !== "string" || !assessmentSetId.trim()) {
    return resultFailure("invalid_request", `${label} assessmentSetId is invalid`);
  }
  if (typeof contentVersion !== "number" || !Number.isInteger(contentVersion) || contentVersion < 1) {
    return resultFailure("invalid_request", `${label} contentVersion is invalid`);
  }
  if (typeof ordinal !== "number" || !Number.isInteger(ordinal) || ordinal < 0) {
    return resultFailure("invalid_request", `${label} ordinal is invalid`);
  }
  return copyQuestionKey({
    assessmentSetId,
    contentVersion,
    ordinal,
  });
}

function expectedPercentage(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0;
}

function validateKeyList(
  keys: readonly AssessmentQuestionKey[],
  assessmentSetId: string,
  contentVersion: number,
  label: string,
): AssessmentResultFailure | Set<string> {
  const seen = new Set<string>();
  for (const key of keys) {
    const parsed = validateQuestionKey(key, label);
    if ("ok" in parsed) return parsed;
    if (parsed.assessmentSetId !== assessmentSetId) {
      return resultFailure("validation_failure", `${label} assessmentSetId does not match`);
    }
    if (parsed.contentVersion !== contentVersion) {
      return resultFailure("validation_failure", `${label} contentVersion does not match`);
    }
    const serialized = keyId(parsed);
    if (seen.has(serialized)) {
      return resultFailure("validation_failure", `${label} contains duplicate question keys`);
    }
    seen.add(serialized);
  }
  return seen;
}

function validateTotals(
  total: number,
  answered: number,
  correct: number,
  incorrect: number,
  unanswered: number,
  score: number,
  percentage: number,
): AssessmentResultFailure | undefined {
  const counts = [total, answered, correct, incorrect, unanswered, score];
  for (const value of counts) {
    if (!Number.isInteger(value) || value < 0) {
      return resultFailure("validation_failure", "result counts must be non-negative integers");
    }
  }
  if (typeof percentage !== "number" || !Number.isFinite(percentage)) {
    return resultFailure("validation_failure", "percentage is invalid");
  }
  if (answered + unanswered !== total) {
    return resultFailure("validation_failure", "answered + unanswered must equal total");
  }
  if (correct + incorrect !== answered) {
    return resultFailure("validation_failure", "correct + incorrect must equal answered");
  }
  if (score !== correct) {
    return resultFailure("validation_failure", "score must equal correct");
  }
  if (percentage !== expectedPercentage(correct, total)) {
    return resultFailure("validation_failure", "percentage must equal (correct / total) * 100");
  }
  return undefined;
}

function validateOutcomes(
  outcomes: readonly McqQuestionOutcome[],
  expectedKeys: Set<string>,
  assessmentSetId: string,
  contentVersion: number,
): AssessmentResultFailure | McqQuestionOutcome[] {
  if (!Array.isArray(outcomes)) {
    return resultFailure("invalid_request", "outcomes must be an array");
  }
  if (outcomes.length !== expectedKeys.size) {
    if (outcomes.length < expectedKeys.size) {
      return resultFailure("validation_failure", "missing outcome");
    }
    return resultFailure("validation_failure", "extra outcome");
  }

  const seen = new Set<string>();
  const copied: McqQuestionOutcome[] = [];
  for (const outcome of outcomes) {
    if (!isRecord(outcome)) {
      return resultFailure("invalid_request", "outcome is invalid");
    }
    if ("answer" in outcome) {
      return resultFailure("validation_failure", "outcome must not include answer");
    }
    if ("explanation" in outcome) {
      return resultFailure("validation_failure", "outcome must not include explanation");
    }
    if ("shortcutOrTrap" in outcome) {
      return resultFailure("validation_failure", "outcome must not include shortcutOrTrap");
    }
    if ("module" in outcome || "field" in outcome || "payload" in outcome) {
      return resultFailure("validation_failure", "outcome must not include payload metadata");
    }
    if (outcome.modality !== "mcq") {
      return resultFailure("validation_failure", "outcome modality must be mcq");
    }
    if (typeof outcome.correct !== "boolean") {
      return resultFailure("invalid_request", "outcome correct must be a boolean");
    }
    if (outcome.selectedOption !== null && typeof outcome.selectedOption !== "string") {
      return resultFailure("invalid_request", "outcome selectedOption must be a string or null");
    }
    const key = validateQuestionKey(outcome.questionKey, "outcome");
    if ("ok" in key) return key;
    if (key.assessmentSetId !== assessmentSetId) {
      return resultFailure("validation_failure", "outcome assessmentSetId does not match");
    }
    if (key.contentVersion !== contentVersion) {
      return resultFailure("validation_failure", "outcome contentVersion does not match");
    }
    const serialized = keyId(key);
    if (!expectedKeys.has(serialized)) {
      return resultFailure("validation_failure", "extra outcome");
    }
    if (seen.has(serialized)) {
      return resultFailure("validation_failure", "duplicate outcome");
    }
    seen.add(serialized);
    copied.push({
      questionKey: key,
      modality: "mcq",
      correct: outcome.correct,
      selectedOption: outcome.selectedOption,
    });
  }
  if (seen.size !== expectedKeys.size) {
    return resultFailure("validation_failure", "missing outcome");
  }
  return copied;
}

function validateIdentity(
  sessionId: string,
  assessmentSetId: string,
  contentVersion: number,
): AssessmentResultFailure | undefined {
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return resultFailure("invalid_request", "sessionId is required");
  }
  if (typeof assessmentSetId !== "string" || !assessmentSetId.trim()) {
    return resultFailure("invalid_request", "assessmentSetId is required");
  }
  if (sessionId === assessmentSetId) {
    return resultFailure("invalid_request", "sessionId must be distinct from assessmentSetId");
  }
  if (!Number.isInteger(contentVersion) || contentVersion < 1) {
    return resultFailure("invalid_request", "contentVersion must be an integer >= 1");
  }
  return undefined;
}

/**
 * Attach session identity to a Phase 3B score and validate canonical totals/outcomes.
 * Does not rescore. Does not mutate the score or question keys.
 */
export function createMcqAssessmentResult(
  input: CreateMcqAssessmentResultInput,
): AssessmentResultCreationResult {
  if (input === null || typeof input !== "object") {
    return resultFailure("invalid_request", "result input must be an object");
  }
  const identityError = validateIdentity(input.sessionId, input.assessmentSetId, input.contentVersion);
  if (identityError) return identityError;
  if (!Array.isArray(input.questionKeys)) {
    return resultFailure("invalid_request", "questionKeys must be an array");
  }
  if (!isRecord(input.score)) {
    return resultFailure("invalid_request", "score is required");
  }

  const score = input.score;
  if (score.assessmentSetId !== input.assessmentSetId) {
    return resultFailure("validation_failure", "mismatched assessmentSetId");
  }
  if (score.contentVersion !== input.contentVersion) {
    return resultFailure("validation_failure", "mismatched contentVersion");
  }

  const expectedKeys = validateKeyList(
    input.questionKeys,
    input.assessmentSetId,
    input.contentVersion,
    "question key",
  );
  if (!(expectedKeys instanceof Set)) return expectedKeys;

  const totalsError = validateTotals(
    score.total,
    score.answered,
    score.correct,
    score.incorrect,
    score.unanswered,
    score.score,
    score.percentage,
  );
  if (totalsError) return totalsError;
  if (score.total !== input.questionKeys.length) {
    return resultFailure("validation_failure", "total must equal delivered question count");
  }

  const outcomes = validateOutcomes(
    score.outcomes,
    expectedKeys,
    input.assessmentSetId,
    input.contentVersion,
  );
  if (!Array.isArray(outcomes)) return outcomes;

  return resultSuccess({
    assessmentSetId: input.assessmentSetId,
    contentVersion: input.contentVersion,
    sessionId: input.sessionId,
    total: score.total,
    answered: score.answered,
    correct: score.correct,
    incorrect: score.incorrect,
    unanswered: score.unanswered,
    score: score.score,
    percentage: score.percentage,
    status: "completed",
    outcomes,
  });
}

/**
 * Validate a canonical AssessmentResult against expected session/delivery identity.
 */
export function validateMcqAssessmentResult(
  result: AssessmentResult,
  expected: ValidateMcqAssessmentResultExpected,
): AssessmentResultCreationResult {
  if (!isRecord(result)) {
    return resultFailure("invalid_request", "result must be an object");
  }
  const identityError = validateIdentity(
    expected.sessionId,
    expected.assessmentSetId,
    expected.contentVersion,
  );
  if (identityError) return identityError;
  if (!Array.isArray(expected.questionKeys)) {
    return resultFailure("invalid_request", "questionKeys must be an array");
  }
  if (result.sessionId !== expected.sessionId) {
    return resultFailure("validation_failure", "mismatched sessionId");
  }
  if (result.assessmentSetId !== expected.assessmentSetId) {
    return resultFailure("validation_failure", "mismatched assessmentSetId");
  }
  if (result.contentVersion !== expected.contentVersion) {
    return resultFailure("validation_failure", "mismatched contentVersion");
  }
  if (result.status !== "completed") {
    return resultFailure("validation_failure", "invalid status");
  }
  if ("answer" in result) {
    return resultFailure("validation_failure", "result must not include answer");
  }
  if ("explanation" in result || "shortcutOrTrap" in result) {
    return resultFailure("validation_failure", "result must not include explanation fields");
  }
  if ("module" in result || "field" in result || "payload" in result) {
    return resultFailure("validation_failure", "result must not include payload metadata");
  }

  const expectedKeys = validateKeyList(
    expected.questionKeys,
    expected.assessmentSetId,
    expected.contentVersion,
    "question key",
  );
  if (!(expectedKeys instanceof Set)) return expectedKeys;

  const totalsError = validateTotals(
    result.total,
    result.answered,
    result.correct,
    result.incorrect,
    result.unanswered,
    result.score,
    result.percentage,
  );
  if (totalsError) return totalsError;
  if (result.total !== expected.questionKeys.length) {
    return resultFailure("validation_failure", "total must equal delivered question count");
  }

  const outcomes = validateOutcomes(
    result.outcomes,
    expectedKeys,
    expected.assessmentSetId,
    expected.contentVersion,
  );
  if (!Array.isArray(outcomes)) return outcomes;

  return resultSuccess({
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
    status: "completed",
    outcomes,
  });
}
