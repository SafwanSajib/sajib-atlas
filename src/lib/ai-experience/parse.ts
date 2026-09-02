/**
 * Validate public AI experience requests. Does not invoke AI or providers.
 */

import { getCanonicalTopic } from "@/lib/content/manifest";
import { getConcept } from "@/lib/knowledge/concepts";
import {
  AI_MAX_INPUT_LENGTH,
  isAiAnswerStyle,
  isAiIntent,
} from "@/lib/ai-intelligence/index";
import type {
  AiExperienceFailure,
  AiExperienceLearnerProjection,
  AiExperienceParseResult,
  AiExperienceRequest,
} from "./types";

function failure(code: string, message: string): AiExperienceFailure {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseLearner(
  value: unknown,
): { ok: true; data: AiExperienceLearnerProjection } | AiExperienceFailure {
  if (!isRecord(value)) return failure("validation_failure", "Learner context is invalid.");
  if (typeof value.topicId !== "string" || !getCanonicalTopic(value.topicId)) {
    return failure("validation_failure", "Learner context must use a canonical topic id.");
  }
  if (
    value.performanceState !== "not-started" &&
    value.performanceState !== "active" &&
    value.performanceState !== "developing" &&
    value.performanceState !== "strong"
  ) {
    return failure("validation_failure", "Learner performance state is invalid.");
  }
  if (typeof value.percentage !== "number" || !Number.isFinite(value.percentage)) {
    return failure("validation_failure", "Learner percentage is invalid.");
  }
  if (typeof value.questionsAnswered !== "number" || !Number.isInteger(value.questionsAnswered) || value.questionsAnswered < 0) {
    return failure("validation_failure", "Learner answered count is invalid.");
  }
  if (typeof value.isCompleted !== "boolean") {
    return failure("validation_failure", "Learner completion flag is invalid.");
  }
  if ("mcqResults" in value || "completedTopics" in value || "intelligence" in value) {
    return failure("validation_failure", "Learner context contains private fields.");
  }
  return {
    ok: true,
    data: {
      topicId: value.topicId,
      performanceState: value.performanceState,
      percentage: value.percentage,
      questionsAnswered: value.questionsAnswered,
      isCompleted: value.isCompleted,
    },
  };
}

export function parseAiExperienceRequest(value: unknown): AiExperienceParseResult {
  if (!isRecord(value)) return failure("invalid_request", "Request must be an object.");
  if (
    "assessmentResult" in value ||
    "answer" in value ||
    "payload" in value ||
    "apiKey" in value ||
    "messages" in value ||
    "system" in value ||
    "tools" in value ||
    "model" in value
  ) {
    return failure(
      "validation_failure",
      "Untrusted assessment, provider, or instruction fields are not accepted.",
    );
  }
  if (typeof value.text !== "string") return failure("invalid_request", "Enter a knowledge question.");
  const text = value.text.trim();
  if (!text) return failure("validation_failure", "Enter a knowledge question.");
  if (text.length > AI_MAX_INPUT_LENGTH) {
    return failure("validation_failure", `Questions must be at most ${AI_MAX_INPUT_LENGTH} characters.`);
  }
  if (typeof value.intent !== "string" || !isAiIntent(value.intent)) {
    return failure("validation_failure", "Choose a supported question type.");
  }
  if (typeof value.style !== "string" || !isAiAnswerStyle(value.style)) {
    return failure("validation_failure", "Choose a supported explanation style.");
  }

  const request: AiExperienceRequest = {
    text,
    intent: value.intent,
    style: value.style,
  };

  if (value.topicId !== undefined && value.topicId !== "") {
    if (typeof value.topicId !== "string" || !getCanonicalTopic(value.topicId)) {
      return failure("validation_failure", "Topic must use a canonical topic id.");
    }
    request.topicId = value.topicId;
  }
  if (value.conceptId !== undefined && value.conceptId !== "") {
    if (typeof value.conceptId !== "string" || !getConcept(value.conceptId)) {
      return failure("validation_failure", "Concept must use a canonical concept id.");
    }
    request.conceptId = value.conceptId;
  }
  if (value.intent === "explain-topic" && !request.topicId) {
    return failure("validation_failure", "Explain a topic requires a canonical topic id.");
  }
  if (value.intent === "explain-concept" && !request.conceptId) {
    return failure("validation_failure", "Explain a concept requires a canonical concept id.");
  }
  if (value.intent === "explain-assessment") {
    return failure(
      "validation_failure",
      "Assessment explanation is not available from this form. Client-supplied assessment results are not accepted.",
    );
  }
  if (value.learner !== undefined) {
    const learner = parseLearner(value.learner);
    if (!learner.ok) return learner;
    request.learner = learner.data;
    if (request.topicId && request.learner.topicId !== request.topicId) {
      return failure("validation_failure", "Learner context must match the canonical topic id.");
    }
  }

  return { ok: true, data: request };
}

export function parseAiExperienceFormData(formData: FormData): AiExperienceParseResult {
  let learner: unknown;
  const rawLearner = formData.get("learner");
  if (typeof rawLearner === "string" && rawLearner.trim()) {
    try {
      learner = JSON.parse(rawLearner);
    } catch {
      return failure("validation_failure", "Learner context is invalid.");
    }
  }
  return parseAiExperienceRequest({
    text: formData.get("text"),
    intent: formData.get("intent"),
    style: formData.get("style"),
    topicId: formData.get("topicId") || undefined,
    conceptId: formData.get("conceptId") || undefined,
    learner,
  });
}
