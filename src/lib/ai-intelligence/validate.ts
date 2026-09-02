/**
 * Deterministic AI contract validation.
 */

import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { aiFailure, aiSuccess } from "./errors";
import { assertAiSafeSurface, findForbiddenKeys } from "./safety";
import {
  AI_ANSWER_STYLES,
  AI_GROUNDING_STATES,
  AI_INTENTS,
  AI_KNOWLEDGE_KINDS,
  AI_MAX_CONTEXT_ITEMS,
  AI_MAX_EXCERPT_LENGTH,
  AI_MAX_INPUT_LENGTH,
  AI_RETRIEVAL_METHODS,
  AI_SCHEMA_VERSION,
  type AiAnswerStyle,
  type AiApprovedExcerpt,
  type AiAssessmentContext,
  type AiContext,
  type AiGroundingState,
  type AiIntelligenceResult,
  type AiIntent,
  type AiKnowledgeKind,
  type AiKnowledgeReference,
  type AiLearnerContext,
  type AiRequest,
  type AiResponse,
  type AiRetrievalMethod,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isAiIntent(value: string): value is AiIntent {
  for (const intent of AI_INTENTS) {
    if (intent === value) return true;
  }
  return false;
}

export function isAiKnowledgeKind(value: string): value is AiKnowledgeKind {
  for (const kind of AI_KNOWLEDGE_KINDS) {
    if (kind === value) return true;
  }
  return false;
}

export function isAiAnswerStyle(value: string): value is AiAnswerStyle {
  for (const style of AI_ANSWER_STYLES) {
    if (style === value) return true;
  }
  return false;
}

export function isAiGroundingState(value: string): value is AiGroundingState {
  for (const state of AI_GROUNDING_STATES) {
    if (state === value) return true;
  }
  return false;
}

export function isAiRetrievalMethod(value: string): value is AiRetrievalMethod {
  for (const method of AI_RETRIEVAL_METHODS) {
    if (method === value) return true;
  }
  return false;
}

export function isAiRequestId(value: string): boolean {
  return /^ai-request\/[A-Za-z0-9._-]+$/.test(value);
}

export function isAiResponseId(value: string): boolean {
  return /^ai-response\/[A-Za-z0-9._-]+$/.test(value);
}

function parseKnowledgeReference(value: unknown): AiKnowledgeReference | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.id !== "string" || !value.id.trim()) return undefined;
  if (typeof value.kind !== "string" || !isAiKnowledgeKind(value.kind)) return undefined;
  if (typeof value.title !== "string" || !value.title.trim()) return undefined;
  if (value.contentVersion !== undefined) {
    if (typeof value.contentVersion !== "number" || !Number.isInteger(value.contentVersion) || value.contentVersion < 1) {
      return undefined;
    }
  }
  if (value.score !== undefined && (typeof value.score !== "number" || !Number.isFinite(value.score))) {
    return undefined;
  }
  const reference: AiKnowledgeReference = {
    id: value.id,
    kind: value.kind,
    title: value.title,
  };
  if (typeof value.href === "string") reference.href = value.href;
  if (typeof value.score === "number") reference.score = value.score;
  if (typeof value.contentVersion === "number") reference.contentVersion = value.contentVersion;
  if (typeof value.subjectId === "string") reference.subjectId = value.subjectId;
  if (typeof value.categoryId === "string") reference.categoryId = value.categoryId;
  if (typeof value.topicId === "string") reference.topicId = value.topicId;
  if (typeof value.conceptId === "string") reference.conceptId = value.conceptId;
  if (typeof value.assessmentSetId === "string") reference.assessmentSetId = value.assessmentSetId;
  if (typeof value.retrievalMethod === "string" && isAiRetrievalMethod(value.retrievalMethod)) {
    reference.retrievalMethod = value.retrievalMethod;
  }
  return reference;
}

function parseExcerpt(value: unknown): AiApprovedExcerpt | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.sourceId !== "string" || !value.sourceId.trim()) return undefined;
  if (typeof value.sourceKind !== "string" || !isAiKnowledgeKind(value.sourceKind)) return undefined;
  if (typeof value.text !== "string") return undefined;
  if (value.text.length > AI_MAX_EXCERPT_LENGTH) return undefined;
  return { sourceId: value.sourceId, sourceKind: value.sourceKind, text: value.text };
}

function parseAssessmentContext(value: unknown): AiAssessmentContext | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.assessmentSetId !== "string" || !value.assessmentSetId.trim()) return undefined;
  if (typeof value.topicId !== "string" || !value.topicId.trim()) return undefined;
  const parsed = parseAssessmentSetId(value.assessmentSetId);
  if (!parsed || parsed.topicId !== value.topicId) return undefined;
  const assessment: AiAssessmentContext = {
    assessmentSetId: value.assessmentSetId,
    topicId: value.topicId,
  };
  if (typeof value.title === "string") assessment.title = value.title;
  if (value.contentVersion !== undefined) {
    if (typeof value.contentVersion !== "number" || !Number.isInteger(value.contentVersion) || value.contentVersion < 1) {
      return undefined;
    }
    assessment.contentVersion = value.contentVersion;
  }
  if (value.result !== undefined) {
    if (!isRecord(value.result)) return undefined;
    const result = value.result;
    if (typeof result.sessionId !== "string" || !result.sessionId.trim()) return undefined;
    if (result.status !== "completed") return undefined;
    const counts = [result.total, result.answered, result.correct, result.score];
    for (const count of counts) {
      if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return undefined;
    }
    if (typeof result.percentage !== "number" || !Number.isFinite(result.percentage)) return undefined;
    if (typeof result.total !== "number" || typeof result.answered !== "number") return undefined;
    if (typeof result.correct !== "number" || typeof result.score !== "number") return undefined;
    assessment.result = {
      sessionId: result.sessionId,
      status: "completed",
      total: result.total,
      answered: result.answered,
      correct: result.correct,
      score: result.score,
      percentage: result.percentage,
    };
  }
  return assessment;
}

export function validateAiContext(value: unknown): AiIntelligenceResult<AiContext> {
  if (!isRecord(value)) return aiFailure("invalid_request", "context must be an object");
  const forbidden = findForbiddenKeys(value);
  if (forbidden.length > 0) {
    return aiFailure("validation_failure", `context contains forbidden field: ${forbidden[0]}`);
  }
  const pathError = assertAiSafeSurface(value, "context");
  if (pathError) return aiFailure("validation_failure", pathError);
  if (!Array.isArray(value.references)) {
    return aiFailure("validation_failure", "context.references must be an array");
  }
  if (value.references.length > AI_MAX_CONTEXT_ITEMS) {
    return aiFailure("validation_failure", `context.references exceeds ${AI_MAX_CONTEXT_ITEMS}`);
  }
  const references: AiKnowledgeReference[] = [];
  for (const item of value.references) {
    const parsed = parseKnowledgeReference(item);
    if (!parsed) return aiFailure("validation_failure", "context.references contains an invalid reference");
    references.push(parsed);
  }
  const context: AiContext = { references };
  if (value.excerpts !== undefined) {
    if (!Array.isArray(value.excerpts)) return aiFailure("validation_failure", "context.excerpts must be an array");
    if (value.excerpts.length > AI_MAX_CONTEXT_ITEMS) {
      return aiFailure("validation_failure", `context.excerpts exceeds ${AI_MAX_CONTEXT_ITEMS}`);
    }
    const excerpts: AiApprovedExcerpt[] = [];
    for (const item of value.excerpts) {
      const parsed = parseExcerpt(item);
      if (!parsed) return aiFailure("validation_failure", "context.excerpts contains an invalid excerpt");
      excerpts.push(parsed);
    }
    context.excerpts = excerpts;
  }
  if (value.assessment !== undefined) {
    const assessment = parseAssessmentContext(value.assessment);
    if (!assessment) return aiFailure("validation_failure", "context.assessment is invalid");
    context.assessment = assessment;
  }
  return aiSuccess(context);
}

export function validateAiLearnerContext(value: unknown): AiIntelligenceResult<AiLearnerContext> {
  if (!isRecord(value)) return aiFailure("invalid_request", "learnerContext must be an object");
  const forbidden = findForbiddenKeys(value);
  if (forbidden.length > 0) {
    return aiFailure("validation_failure", `learnerContext contains forbidden field: ${forbidden[0]}`);
  }
  const pathError = assertAiSafeSurface(value, "learnerContext");
  if (pathError) return aiFailure("validation_failure", pathError);
  if (typeof value.learnerId !== "string" || value.learnerId !== LOCAL_LEARNER_ID) {
    return aiFailure("validation_failure", "learnerContext.learnerId must be learner/local");
  }
  const learner: AiLearnerContext = { learnerId: value.learnerId };
  if (value.topicProgress !== undefined) {
    if (!isRecord(value.topicProgress)) return aiFailure("validation_failure", "topicProgress is invalid");
    const progress = value.topicProgress;
    if (typeof progress.topicId !== "string" || !progress.topicId.trim()) {
      return aiFailure("validation_failure", "topicProgress.topicId is required");
    }
    if (
      progress.performanceState !== "not-started" &&
      progress.performanceState !== "active" &&
      progress.performanceState !== "developing" &&
      progress.performanceState !== "strong"
    ) {
      return aiFailure("validation_failure", "topicProgress.performanceState is invalid");
    }
    if (typeof progress.percentage !== "number" || !Number.isFinite(progress.percentage)) {
      return aiFailure("validation_failure", "topicProgress.percentage is invalid");
    }
    if (typeof progress.questionsAnswered !== "number" || !Number.isInteger(progress.questionsAnswered) || progress.questionsAnswered < 0) {
      return aiFailure("validation_failure", "topicProgress.questionsAnswered is invalid");
    }
    if (typeof progress.isCompleted !== "boolean") {
      return aiFailure("validation_failure", "topicProgress.isCompleted is invalid");
    }
    learner.topicProgress = {
      topicId: progress.topicId,
      performanceState: progress.performanceState,
      percentage: progress.percentage,
      questionsAnswered: progress.questionsAnswered,
      isCompleted: progress.isCompleted,
    };
  }
  if (value.assessmentPerformance !== undefined) {
    if (!isRecord(value.assessmentPerformance)) {
      return aiFailure("validation_failure", "assessmentPerformance is invalid");
    }
    const performance = value.assessmentPerformance;
    if (typeof performance.assessmentSetId !== "string" || !performance.assessmentSetId.trim()) {
      return aiFailure("validation_failure", "assessmentPerformance.assessmentSetId is required");
    }
    if (typeof performance.sessionId !== "string" || !performance.sessionId.trim()) {
      return aiFailure("validation_failure", "assessmentPerformance.sessionId is required");
    }
    if (typeof performance.contentVersion !== "number" || !Number.isInteger(performance.contentVersion) || performance.contentVersion < 1) {
      return aiFailure("validation_failure", "assessmentPerformance.contentVersion is invalid");
    }
    if (typeof performance.percentage !== "number" || !Number.isFinite(performance.percentage)) {
      return aiFailure("validation_failure", "assessmentPerformance.percentage is invalid");
    }
    learner.assessmentPerformance = {
      assessmentSetId: performance.assessmentSetId,
      sessionId: performance.sessionId,
      contentVersion: performance.contentVersion,
      percentage: performance.percentage,
    };
  }
  return aiSuccess(learner);
}

export function validateAiRequest(value: unknown): AiIntelligenceResult<AiRequest> {
  if (!isRecord(value)) return aiFailure("invalid_request", "request must be an object");
  const forbidden = findForbiddenKeys(value);
  if (forbidden.length > 0) {
    return aiFailure("validation_failure", `request contains forbidden field: ${forbidden[0]}`);
  }
  if (value.schemaVersion !== AI_SCHEMA_VERSION) {
    return aiFailure("validation_failure", "schemaVersion must be 1");
  }
  if (typeof value.requestId !== "string" || !isAiRequestId(value.requestId)) {
    return aiFailure("validation_failure", "requestId must be an opaque ai-request/ identity");
  }
  if (typeof value.intent !== "string" || !isAiIntent(value.intent)) {
    return aiFailure("validation_failure", "intent is not a supported Phase 6A intent");
  }
  if (!isRecord(value.input) || typeof value.input.text !== "string") {
    return aiFailure("invalid_request", "input.text must be a string");
  }
  const text = value.input.text;
  if (!text.trim()) return aiFailure("validation_failure", "input.text must not be empty");
  if (text.length > AI_MAX_INPUT_LENGTH) {
    return aiFailure("validation_failure", `input.text exceeds ${AI_MAX_INPUT_LENGTH} characters`);
  }
  const context = validateAiContext(value.context);
  if (!context.ok) return context;
  const request: AiRequest = {
    schemaVersion: AI_SCHEMA_VERSION,
    requestId: value.requestId,
    intent: value.intent,
    input: { text },
    context: context.data,
  };
  if (value.learnerContext !== undefined) {
    const learner = validateAiLearnerContext(value.learnerContext);
    if (!learner.ok) return learner;
    request.learnerContext = learner.data;
  }
  if (value.constraints !== undefined) {
    if (!isRecord(value.constraints)) return aiFailure("validation_failure", "constraints must be an object");
    const constraints: AiRequest["constraints"] = {};
    if (value.constraints.maxInputLength !== undefined) {
      if (typeof value.constraints.maxInputLength !== "number" || !Number.isInteger(value.constraints.maxInputLength)) {
        return aiFailure("validation_failure", "constraints.maxInputLength must be an integer");
      }
      if (value.constraints.maxInputLength < 1 || value.constraints.maxInputLength > AI_MAX_INPUT_LENGTH) {
        return aiFailure("validation_failure", "constraints.maxInputLength is out of range");
      }
      constraints.maxInputLength = value.constraints.maxInputLength;
    }
    if (value.constraints.maxContextItems !== undefined) {
      if (typeof value.constraints.maxContextItems !== "number" || !Number.isInteger(value.constraints.maxContextItems)) {
        return aiFailure("validation_failure", "constraints.maxContextItems must be an integer");
      }
      if (value.constraints.maxContextItems < 1 || value.constraints.maxContextItems > AI_MAX_CONTEXT_ITEMS) {
        return aiFailure("validation_failure", "constraints.maxContextItems is out of range");
      }
      constraints.maxContextItems = value.constraints.maxContextItems;
    }
    request.constraints = constraints;
  }
  if (value.style !== undefined) {
    if (typeof value.style !== "string" || !isAiAnswerStyle(value.style)) {
      return aiFailure("validation_failure", "style is not a supported answer style");
    }
    request.style = value.style;
  }
  if (request.constraints?.maxInputLength !== undefined && text.length > request.constraints.maxInputLength) {
    return aiFailure("validation_failure", "input.text exceeds request constraint");
  }
  if (
    request.constraints?.maxContextItems !== undefined &&
    request.context.references.length > request.constraints.maxContextItems
  ) {
    return aiFailure("validation_failure", "context.references exceeds request constraint");
  }
  return aiSuccess(request);
}

export function validateAiResponse(value: unknown): AiIntelligenceResult<AiResponse> {
  if (!isRecord(value)) return aiFailure("invalid_request", "response must be an object");
  const forbidden = findForbiddenKeys(value);
  if (forbidden.length > 0) {
    return aiFailure("validation_failure", `response contains forbidden field: ${forbidden[0]}`);
  }
  const pathError = assertAiSafeSurface(
    { grounding: value.grounding, output: value.output },
    "response",
  );
  if (pathError) return aiFailure("validation_failure", pathError);
  if (value.schemaVersion !== AI_SCHEMA_VERSION) {
    return aiFailure("validation_failure", "response schemaVersion must be 1");
  }
  if (typeof value.requestId !== "string" || !isAiRequestId(value.requestId)) {
    return aiFailure("validation_failure", "response requestId is invalid");
  }
  if (typeof value.responseId !== "string" || !isAiResponseId(value.responseId)) {
    return aiFailure("validation_failure", "responseId must be an opaque ai-response/ identity");
  }
  if (
    value.status !== "success" &&
    value.status !== "failed" &&
    value.status !== "blocked" &&
    value.status !== "insufficient_context"
  ) {
    return aiFailure("validation_failure", "response status is invalid");
  }
  if (!isRecord(value.output) || value.output.kind !== "generated" || typeof value.output.text !== "string") {
    return aiFailure("validation_failure", "output must be generated text");
  }
  if (!Array.isArray(value.grounding)) return aiFailure("validation_failure", "grounding must be an array");
  const grounding: AiResponse["grounding"][number][] = [];
  for (const item of value.grounding) {
    if (!isRecord(item)) return aiFailure("validation_failure", "grounding item is invalid");
    if (typeof item.sourceId !== "string" || typeof item.sourceKind !== "string" || typeof item.title !== "string") {
      return aiFailure("validation_failure", "grounding item is invalid");
    }
    if (!isAiKnowledgeKind(item.sourceKind)) return aiFailure("validation_failure", "grounding kind is invalid");
    const ref: AiResponse["grounding"][number] = {
      sourceId: item.sourceId,
      sourceKind: item.sourceKind,
      title: item.title,
    };
    if (item.contentVersion !== undefined) {
      if (typeof item.contentVersion !== "number" || !Number.isInteger(item.contentVersion) || item.contentVersion < 1) {
        return aiFailure("validation_failure", "grounding contentVersion is invalid");
      }
      ref.contentVersion = item.contentVersion;
    }
    if (item.score !== undefined) {
      if (typeof item.score !== "number" || !Number.isFinite(item.score)) {
        return aiFailure("validation_failure", "grounding score is invalid");
      }
      ref.score = item.score;
    }
    if (typeof item.href === "string") ref.href = item.href;
    if (typeof item.retrievalMethod === "string") {
      if (!isAiRetrievalMethod(item.retrievalMethod)) {
        return aiFailure("validation_failure", "grounding retrievalMethod is invalid");
      }
      ref.retrievalMethod = item.retrievalMethod;
    }
    grounding.push(ref);
  }
  if (!isRecord(value.provider) || typeof value.provider.bound !== "boolean") {
    return aiFailure("validation_failure", "provider metadata must declare bound");
  }
  if (typeof value.groundingState !== "string" || !isAiGroundingState(value.groundingState)) {
    return aiFailure("validation_failure", "groundingState is required");
  }
  return aiSuccess({
    schemaVersion: AI_SCHEMA_VERSION,
    requestId: value.requestId,
    responseId: value.responseId,
    status: value.status,
    output: { kind: "generated", text: value.output.text },
    grounding,
    groundingState: value.groundingState,
    provider: { bound: value.provider.bound },
  });
}
