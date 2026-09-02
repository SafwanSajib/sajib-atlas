import { topicEngineFailure, topicEngineSuccess, type TopicEngineResult } from "./errors";
import { composeTopicCapabilityModelForTopicId, isTopicCapabilityKind } from "./capabilities";
import { parseTopicId } from "./identity";
import type { TopicCapabilityAnswer, TopicCapabilityQuestion } from "./types";

/**
 * Universal capability questions.
 *
 * The engine answers availability of study, concepts, assessment, completion,
 * revision, and search. It does not execute those features.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseTopicCapabilityQuestion(value: unknown): TopicCapabilityQuestion {
  if (!isRecord(value) || typeof value.ask !== "string") {
    throw new Error("Topic engine: capability question must be an object with ask");
  }
  if (value.ask === "availability") {
    if (typeof value.kind !== "string" || !isTopicCapabilityKind(value.kind)) {
      throw new Error("Topic engine: availability question requires a capability kind");
    }
    return { ask: "availability", kind: value.kind };
  }
  if (
    value.ask === "study-content" ||
    value.ask === "concepts" ||
    value.ask === "assessment-set" ||
    value.ask === "concept-count" ||
    value.ask === "assessment-identity" ||
    value.ask === "learner-identity" ||
    value.ask === "search-index" ||
    value.ask === "catalog-access"
  ) {
    return { ask: value.ask };
  }
  throw new Error(`Topic engine: unknown capability question ${value.ask}`);
}

export function answerTopicCapabilityQuestion(
  model: NonNullable<ReturnType<typeof composeTopicCapabilityModelForTopicId>>,
  question: TopicCapabilityQuestion,
): TopicCapabilityAnswer {
  if (question.ask === "availability") {
    return {
      ask: "availability",
      kind: question.kind,
      availability: model.availability[question.kind],
    };
  }
  if (question.ask === "study-content") {
    return {
      ask: "study-content",
      studyContent: model.discovery.content.contentStatus === "available" ? "present" : "absent",
      contentStatus: model.discovery.content.contentStatus,
    };
  }
  if (question.ask === "concepts") {
    return {
      ask: "concepts",
      concepts: model.discovery.content.conceptCount > 0 ? "present" : "absent",
      conceptCount: model.discovery.content.conceptCount,
    };
  }
  if (question.ask === "assessment-set") {
    return {
      ask: "assessment-set",
      assessmentSet: model.discovery.assessment.assessmentSetCount > 0 ? "present" : "absent",
      assessmentSetCount: model.discovery.assessment.assessmentSetCount,
      assessmentSetIds: model.discovery.assessment.assessmentSetIds,
    };
  }
  if (question.ask === "concept-count") {
    return { ask: "concept-count", conceptCount: model.discovery.content.conceptCount };
  }
  if (question.ask === "assessment-identity") {
    return {
      ask: "assessment-identity",
      assessmentSetIds: model.discovery.assessment.assessmentSetIds,
      kinds: model.discovery.assessment.kinds,
      assessmentSetCount: model.discovery.assessment.assessmentSetCount,
    };
  }
  if (question.ask === "learner-identity") {
    return { ask: "learner-identity", localLearnerId: model.discovery.learner.localLearnerId };
  }
  if (question.ask === "search-index") {
    return { ask: "search-index", index: model.discovery.search.index };
  }
  return { ask: "catalog-access", catalogAccess: model.discovery.access.catalogAccess };
}

export function askTopicCapability(
  topicId: string,
  question: TopicCapabilityQuestion,
): TopicEngineResult<TopicCapabilityAnswer> {
  if (!parseTopicId(topicId)) {
    return topicEngineFailure("invalid_request", "topicId is not a canonical topic id");
  }
  const model = composeTopicCapabilityModelForTopicId(topicId);
  if (!model) return topicEngineFailure("not_found", "topic not found");
  return topicEngineSuccess(answerTopicCapabilityQuestion(model, question));
}
