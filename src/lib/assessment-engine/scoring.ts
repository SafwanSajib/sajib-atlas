/**
 * Universal MCQ scoring boundary (Phase 3B).
 *
 * Pure and subject-independent. Operates on Assessment Engine contracts.
 * Does not load payload, persist, emit analytics, check entitlements, or
 * touch React/UI. Canonical correctness remains:
 *
 *   selectedOption === question.answer
 *
 * Correct answers are scoring-only inputs. Public outcomes/results omit them.
 * Canonical set identity remains src/lib/assessment/.
 * Geography MCQ payload remains src/lib/geography-data.ts (not imported here).
 * Legacy UI scoring remains src/lib/assessment/scoring.ts.
 */

import { serializeAssessmentQuestionKey } from "./identity";
import type {
  AssessmentQuestionKey,
  McqAssessmentResponse,
  McqQuestionOutcome,
} from "./types";

/**
 * Scoring-only MCQ question. Not a public delivery DTO.
 * `answer` is an internal scoring input and must not appear on delivery,
 * public outcomes, or public results.
 */
export type ScoringMcqQuestion = {
  questionKey: AssessmentQuestionKey;
  modality: "mcq";
  question: string;
  options: readonly string[];
  answer: string;
};

export type ScoreMcqAssessmentInput = {
  assessmentSetId: string;
  contentVersion: number;
  questions: readonly ScoringMcqQuestion[];
  responses: readonly McqAssessmentResponse[];
};

/**
 * Result-compatible scoring structure. Session identity and result status
 * belong to a later session layer; this boundary does not invent them.
 */
export type McqAssessmentScore = {
  assessmentSetId: string;
  contentVersion: number;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  percentage: number;
  outcomes: readonly McqQuestionOutcome[];
};

export const ASSESSMENT_SCORING_ERROR_CODES = [
  "invalid_request",
  "validation_failure",
] as const;
export type AssessmentScoringErrorCode = (typeof ASSESSMENT_SCORING_ERROR_CODES)[number];

export type AssessmentScoringError = {
  code: AssessmentScoringErrorCode;
  message: string;
};

export type AssessmentScoringSuccess = {
  ok: true;
  data: McqAssessmentScore;
};

export type AssessmentScoringFailure = {
  ok: false;
  error: AssessmentScoringError;
};

export type AssessmentScoringResult = AssessmentScoringSuccess | AssessmentScoringFailure;

function scoringSuccess(data: McqAssessmentScore): AssessmentScoringSuccess {
  return { ok: true, data };
}

function scoringFailure(
  code: AssessmentScoringErrorCode,
  message: string,
): AssessmentScoringFailure {
  return { ok: false, error: { code, message } };
}

function copyQuestionKey(key: AssessmentQuestionKey): AssessmentQuestionKey {
  return {
    assessmentSetId: key.assessmentSetId,
    contentVersion: key.contentVersion,
    ordinal: key.ordinal,
  };
}

function emptyScore(assessmentSetId: string, contentVersion: number): McqAssessmentScore {
  return {
    assessmentSetId,
    contentVersion,
    total: 0,
    answered: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    score: 0,
    percentage: 0,
    outcomes: [],
  };
}

/**
 * Single-question correctness. Exact string equality. Null is not correct.
 * Does not mutate inputs. Does not normalize case or whitespace.
 */
export function isMcqAnswerCorrect(
  question: Pick<ScoringMcqQuestion, "answer">,
  selectedOption: string | null,
): boolean {
  return selectedOption === question.answer;
}

/**
 * Set-level MCQ scorer. Matches responses by structured question key.
 * Null selectedOption is unanswered (not incorrect). score = correct.
 * percentage = total > 0 ? (correct / total) * 100 : 0.
 */
export function scoreMcqAssessment(input: ScoreMcqAssessmentInput): AssessmentScoringResult {
  if (input === null || typeof input !== "object") {
    return scoringFailure("invalid_request", "scoring input must be an object");
  }

  const { assessmentSetId, contentVersion, questions, responses } = input;

  if (typeof assessmentSetId !== "string" || !assessmentSetId.trim()) {
    return scoringFailure("invalid_request", "assessmentSetId is required");
  }
  if (!Number.isInteger(contentVersion) || contentVersion < 1) {
    return scoringFailure("invalid_request", "contentVersion must be an integer >= 1");
  }
  if (!Array.isArray(questions)) {
    return scoringFailure("invalid_request", "questions must be an array");
  }
  if (!Array.isArray(responses)) {
    return scoringFailure("invalid_request", "responses must be an array");
  }

  if (questions.length === 0) {
    if (responses.length > 0) {
      return scoringFailure(
        "invalid_request",
        "response does not correspond to a delivered question",
      );
    }
    return scoringSuccess(emptyScore(assessmentSetId, contentVersion));
  }

  const questionByKey = new Map<string, ScoringMcqQuestion>();
  for (const question of questions) {
    if (question === null || typeof question !== "object") {
      return scoringFailure("invalid_request", "scoring question is invalid");
    }
    if (question.modality !== "mcq") {
      return scoringFailure("invalid_request", "scoring questions must use modality mcq");
    }
    const key = question.questionKey;
    if (key === null || typeof key !== "object") {
      return scoringFailure("invalid_request", "scoring question key is required");
    }
    if (key.assessmentSetId !== assessmentSetId) {
      return scoringFailure(
        "invalid_request",
        "question assessmentSetId does not match scoring input",
      );
    }
    if (key.contentVersion !== contentVersion) {
      return scoringFailure("invalid_request", "questions must share a single contentVersion");
    }
    if (!Number.isInteger(key.ordinal) || key.ordinal < 0) {
      return scoringFailure("invalid_request", "question ordinal is invalid");
    }
    if (!Array.isArray(question.options) || question.options.length === 0) {
      return scoringFailure("invalid_request", "scoring question options are required");
    }
    if (typeof question.answer !== "string") {
      return scoringFailure("invalid_request", "scoring question answer is required");
    }
    if (!question.options.includes(question.answer)) {
      return scoringFailure(
        "validation_failure",
        "scoring question answer is not one of the options",
      );
    }

    const serialized = serializeAssessmentQuestionKey(copyQuestionKey(key));
    if (questionByKey.has(serialized)) {
      return scoringFailure("invalid_request", "duplicate scoring question key");
    }
    questionByKey.set(serialized, question);
  }

  const responseByKey = new Map<string, McqAssessmentResponse>();
  for (const response of responses) {
    if (response === null || typeof response !== "object") {
      return scoringFailure("invalid_request", "assessment response is invalid");
    }
    if (response.modality !== "mcq") {
      return scoringFailure("invalid_request", "responses must use modality mcq");
    }
    const key = response.questionKey;
    if (key === null || typeof key !== "object") {
      return scoringFailure("invalid_request", "response question key is required");
    }
    if (key.assessmentSetId !== assessmentSetId) {
      return scoringFailure(
        "invalid_request",
        "response assessmentSetId does not match scoring input",
      );
    }
    if (key.contentVersion !== contentVersion) {
      return scoringFailure(
        "invalid_request",
        "response contentVersion does not match scoring input",
      );
    }

    const serialized = serializeAssessmentQuestionKey(copyQuestionKey(key));
    if (!questionByKey.has(serialized)) {
      return scoringFailure(
        "invalid_request",
        "response does not correspond to a delivered question",
      );
    }
    if (responseByKey.has(serialized)) {
      return scoringFailure("invalid_request", "duplicate response for the same question key");
    }

    const selectedOption = response.selectedOption;
    if (selectedOption !== null) {
      if (typeof selectedOption !== "string") {
        return scoringFailure("invalid_request", "selectedOption must be a string or null");
      }
      const scoredQuestion = questionByKey.get(serialized);
      if (!scoredQuestion) {
        return scoringFailure(
          "invalid_request",
          "response does not correspond to a delivered question",
        );
      }
      if (!scoredQuestion.options.includes(selectedOption)) {
        return scoringFailure(
          "validation_failure",
          "selectedOption is not one of the question options",
        );
      }
    }

    responseByKey.set(serialized, response);
  }

  const outcomes: McqQuestionOutcome[] = [];
  let answeredCount = 0;
  let correctCount = 0;

  for (const question of questions) {
    const serialized = serializeAssessmentQuestionKey(copyQuestionKey(question.questionKey));
    const response = responseByKey.get(serialized);
    const selectedOption = response === undefined ? null : response.selectedOption;
    const isAnswered = selectedOption !== null;
    if (isAnswered) answeredCount += 1;
    const correct = isMcqAnswerCorrect(question, selectedOption);
    if (correct) correctCount += 1;
    outcomes.push({
      questionKey: copyQuestionKey(question.questionKey),
      modality: "mcq",
      correct,
      selectedOption,
    });
  }

  const total = questions.length;
  const unanswered = total - answeredCount;
  const incorrect = answeredCount - correctCount;
  const score = correctCount;
  const percentage = total > 0 ? (correctCount / total) * 100 : 0;

  return scoringSuccess({
    assessmentSetId,
    contentVersion,
    total,
    answered: answeredCount,
    correct: correctCount,
    incorrect,
    unanswered,
    score,
    percentage,
    outcomes,
  });
}
