/**
 * Universal MCQ payload adapter (Phase 3C).
 *
 * Translates a canonical AssessmentSet payload into Assessment Engine
 * ScoringMcqQuestion rows. Does not score, persist, create sessions, or
 * emit analytics.
 *
 * Canonical set identity remains src/lib/assessment/.
 * Geography MCQ arrays remain in src/lib/geography-data.ts and are not copied.
 * This is the only Assessment Engine module allowed to import that payload.
 *
 * ScoringMcqQuestion is a scoring-only input. Public delivery omits `answer`.
 */

import { getAssessmentSet } from "@/lib/assessment/sets";
import type { AssessmentSet } from "@/lib/assessment/types";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { geographyTopicsBySlug } from "@/lib/geography-data";
import type { ScoringMcqQuestion } from "./scoring";
import type { McqDeliveryQuestion } from "./types";

export type AdaptMcqAssessmentPayloadInput = {
  assessmentSetId: string;
  contentVersion: number;
  /**
   * Optional explicit MCQ items. When omitted, the adapter loads the
   * canonical payload through the AssessmentSet pointer.
   */
  payload?: readonly unknown[];
};

export type AdaptedMcqPayload = {
  assessmentSetId: string;
  contentVersion: number;
  questions: readonly ScoringMcqQuestion[];
};

export const ASSESSMENT_PAYLOAD_ADAPTER_ERROR_CODES = [
  "invalid_request",
  "not_found",
  "validation_failure",
] as const;
export type AssessmentPayloadAdapterErrorCode =
  (typeof ASSESSMENT_PAYLOAD_ADAPTER_ERROR_CODES)[number];

export type AssessmentPayloadAdapterError = {
  code: AssessmentPayloadAdapterErrorCode;
  message: string;
};

export type AssessmentPayloadAdapterSuccess<T> = {
  ok: true;
  data: T;
};

export type AssessmentPayloadAdapterFailure = {
  ok: false;
  error: AssessmentPayloadAdapterError;
};

export type AssessmentPayloadAdapterResult<T> =
  | AssessmentPayloadAdapterSuccess<T>
  | AssessmentPayloadAdapterFailure;

function adapterSuccess<T>(data: T): AssessmentPayloadAdapterSuccess<T> {
  return { ok: true, data };
}

function adapterFailure(
  code: AssessmentPayloadAdapterErrorCode,
  message: string,
): AssessmentPayloadAdapterFailure {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function copyOptions(options: readonly string[]): string[] {
  return options.slice();
}

function loadCanonicalMcqItems(
  set: AssessmentSet,
): AssessmentPayloadAdapterResult<readonly unknown[]> {
  if (set.payload.module !== "geography-data") {
    return adapterFailure("invalid_request", "unsupported assessment payload module");
  }
  if (set.payload.field !== "sections.mcqPractice") {
    return adapterFailure("invalid_request", "unsupported assessment payload field");
  }

  const topic = getCanonicalTopic(set.topicId);
  if (!topic) {
    return adapterFailure("not_found", "assessment set topic is not in the canonical catalog");
  }

  const geographyTopic = geographyTopicsBySlug[topic.slug];
  if (!geographyTopic) {
    return adapterFailure("not_found", "geography payload is missing for this assessment set");
  }

  const items = geographyTopic.sections.mcqPractice;
  if (!Array.isArray(items)) {
    return adapterFailure("validation_failure", "canonical MCQ payload is not an array");
  }

  return adapterSuccess(items);
}

function adaptMcqItem(
  item: unknown,
  assessmentSetId: string,
  contentVersion: number,
  ordinal: number,
): AssessmentPayloadAdapterResult<ScoringMcqQuestion> {
  if (!isRecord(item)) {
    return adapterFailure("validation_failure", `MCQ item at ordinal ${ordinal} is not an object`);
  }
  if (typeof item.question !== "string") {
    return adapterFailure("validation_failure", `MCQ question text at ordinal ${ordinal} is invalid`);
  }
  if (!Array.isArray(item.options)) {
    return adapterFailure("validation_failure", `MCQ options at ordinal ${ordinal} are invalid`);
  }
  if (item.options.length === 0) {
    return adapterFailure("validation_failure", `MCQ options at ordinal ${ordinal} are empty`);
  }
  for (const option of item.options) {
    if (typeof option !== "string") {
      return adapterFailure(
        "validation_failure",
        `MCQ option at ordinal ${ordinal} is not a string`,
      );
    }
  }
  if (typeof item.answer !== "string") {
    return adapterFailure("validation_failure", `MCQ answer at ordinal ${ordinal} is invalid`);
  }
  if (!item.options.includes(item.answer)) {
    return adapterFailure(
      "validation_failure",
      `MCQ answer at ordinal ${ordinal} is not one of the options`,
    );
  }

  return adapterSuccess({
    questionKey: {
      assessmentSetId,
      contentVersion,
      ordinal,
    },
    modality: "mcq",
    question: item.question,
    options: copyOptions(item.options),
    answer: item.answer,
  });
}

/**
 * Convert a canonical AssessmentSet payload into scoring-only MCQ questions.
 * Preserves assessmentSetId, supplied contentVersion, and canonical order.
 * Does not score, create sessions, or leak payload module/field pointers.
 */
export function adaptMcqAssessmentPayload(
  input: AdaptMcqAssessmentPayloadInput,
): AssessmentPayloadAdapterResult<AdaptedMcqPayload> {
  if (input === null || typeof input !== "object") {
    return adapterFailure("invalid_request", "adapter input must be an object");
  }

  const { assessmentSetId, contentVersion, payload } = input;

  if (typeof assessmentSetId !== "string" || !assessmentSetId.trim()) {
    return adapterFailure("invalid_request", "assessmentSetId is required");
  }
  if (!Number.isInteger(contentVersion) || contentVersion < 1) {
    return adapterFailure("invalid_request", "contentVersion must be an integer >= 1");
  }

  const set = getAssessmentSet(assessmentSetId);
  if (!set) {
    return adapterFailure("not_found", "assessment set is unknown");
  }

  let items: readonly unknown[];
  if (payload !== undefined) {
    if (!Array.isArray(payload)) {
      return adapterFailure("validation_failure", "MCQ payload is not an array");
    }
    items = payload;
  } else {
    const loaded = loadCanonicalMcqItems(set);
    if (!loaded.ok) return loaded;
    items = loaded.data;
  }

  const questions: ScoringMcqQuestion[] = [];
  for (let ordinal = 0; ordinal < items.length; ordinal += 1) {
    const adapted = adaptMcqItem(items[ordinal], set.id, contentVersion, ordinal);
    if (!adapted.ok) return adapted;
    questions.push(adapted.data);
  }

  return adapterSuccess({
    assessmentSetId: set.id,
    contentVersion,
    questions,
  });
}

/**
 * Strip scoring-only fields for public delivery.
 * Does not include answer, explanation, shortcutOrTrap, module, or field.
 */
export function toMcqDeliveryQuestion(question: ScoringMcqQuestion): McqDeliveryQuestion {
  return {
    questionKey: {
      assessmentSetId: question.questionKey.assessmentSetId,
      contentVersion: question.questionKey.contentVersion,
      ordinal: question.questionKey.ordinal,
    },
    modality: "mcq",
    question: question.question,
    options: copyOptions(question.options),
  };
}

export function toMcqDeliveryQuestions(
  questions: readonly ScoringMcqQuestion[],
): McqDeliveryQuestion[] {
  return questions.map(toMcqDeliveryQuestion);
}
