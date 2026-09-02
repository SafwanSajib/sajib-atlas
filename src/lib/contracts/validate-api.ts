/**
 * Unified platform read-contract validation (Phase 1J).
 *
 * Structural checks only. Domain catalogs remain validated by existing
 * knowledge / content / assessment validators.
 */

import {
  PLATFORM_READ_ERROR_CODES,
  type AssessmentSetApiRead,
  type GetCategoriesQuery,
  type GetSubjectsQuery,
  type GetTopicQuery,
  type GetTopicsQuery,
  type PlatformReadError,
  type PlatformReadErrorCode,
  type TopicReadResponse,
} from "./api";
import type { ConceptRead, TopicRead } from "./types";

function fail(message: string): never {
  throw new Error(`Platform read contract: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPlatformReadErrorCode(value: string): value is PlatformReadErrorCode {
  for (const code of PLATFORM_READ_ERROR_CODES) {
    if (code === value) return true;
  }
  return false;
}

export function parseGetTopicQuery(value: unknown): GetTopicQuery {
  if (!isRecord(value)) fail("invalid_request: GetTopicQuery must be an object");
  if (!isNonEmptyString(value.topicId)) fail("invalid_request: topicId is required");
  return { topicId: value.topicId.trim() };
}

export function parseGetTopicsQuery(value: unknown): GetTopicsQuery {
  if (!isRecord(value)) fail("invalid_request: GetTopicsQuery must be an object");
  const query: GetTopicsQuery = {};
  if (value.categoryId !== undefined) {
    if (!isNonEmptyString(value.categoryId)) fail("invalid_request: categoryId is invalid");
    query.categoryId = value.categoryId.trim();
  }
  if (value.subjectId !== undefined) {
    if (!isNonEmptyString(value.subjectId)) fail("invalid_request: subjectId is invalid");
    query.subjectId = value.subjectId.trim();
  }
  return query;
}

export function parseGetSubjectsQuery(value: unknown): GetSubjectsQuery {
  if (!isRecord(value)) fail("invalid_request: GetSubjectsQuery must be an object");
  const query: GetSubjectsQuery = {};
  if (value.disciplineId !== undefined) {
    if (!isNonEmptyString(value.disciplineId)) fail("invalid_request: disciplineId is invalid");
    query.disciplineId = value.disciplineId.trim();
  }
  return query;
}

export function parseGetCategoriesQuery(value: unknown): GetCategoriesQuery {
  if (!isRecord(value)) fail("invalid_request: GetCategoriesQuery must be an object");
  const query: GetCategoriesQuery = {};
  if (value.subjectId !== undefined) {
    if (!isNonEmptyString(value.subjectId)) fail("invalid_request: subjectId is invalid");
    query.subjectId = value.subjectId.trim();
  }
  return query;
}

export function validatePlatformReadError(value: unknown): PlatformReadError {
  if (!isRecord(value)) fail("validation_failure: error must be an object");
  if (typeof value.code !== "string" || !isPlatformReadErrorCode(value.code)) {
    fail("validation_failure: error code is invalid");
  }
  if (!isNonEmptyString(value.message)) fail("validation_failure: error message is required");
  if ("stack" in value) fail("validation_failure: error must not include stack");
  if ("path" in value) fail("validation_failure: error must not include path");
  return { code: value.code, message: value.message.trim() };
}

function validateTopicRead(value: unknown, label: string): TopicRead {
  if (!isRecord(value)) fail(`validation_failure: ${label} must be an object`);
  if (!isNonEmptyString(value.id)) fail(`validation_failure: ${label}.id is required`);
  if (!isNonEmptyString(value.href)) fail(`validation_failure: ${label}.href is required`);
  if (!isNonEmptyString(value.title)) fail(`validation_failure: ${label}.title is required`);
  if (!isNonEmptyString(value.slug)) fail(`validation_failure: ${label}.slug is required`);
  if (!isNonEmptyString(value.disciplineId)) {
    fail(`validation_failure: ${label}.disciplineId is required`);
  }
  if (!isNonEmptyString(value.subjectId)) fail(`validation_failure: ${label}.subjectId is required`);
  if (!isNonEmptyString(value.categoryId)) fail(`validation_failure: ${label}.categoryId is required`);
  if (!isNonEmptyString(value.contentStatus)) {
    fail(`validation_failure: ${label}.contentStatus is required`);
  }
  if (!isRecord(value.contentMetadata)) {
    fail(`validation_failure: ${label}.contentMetadata is required`);
  }
  if (typeof value.contentMetadata.version !== "number") {
    fail(`validation_failure: ${label}.contentMetadata.version is required`);
  }
  if (!isNonEmptyString(value.contentMetadata.lifecycle)) {
    fail(`validation_failure: ${label}.contentMetadata.lifecycle is required`);
  }
  if (!Array.isArray(value.conceptIds)) fail(`validation_failure: ${label}.conceptIds must be an array`);
  if (!Array.isArray(value.assessmentSetIds)) {
    fail(`validation_failure: ${label}.assessmentSetIds must be an array`);
  }
  if ("sections" in value) fail(`validation_failure: ${label} must not include sections`);
  if ("mcqPractice" in value) fail(`validation_failure: ${label} must not include mcqPractice`);
  const conceptIds: string[] = [];
  for (const id of value.conceptIds) {
    if (!isNonEmptyString(id)) fail(`validation_failure: ${label} has an empty concept id`);
    conceptIds.push(id);
  }
  const assessmentSetIds: string[] = [];
  for (const id of value.assessmentSetIds) {
    if (!isNonEmptyString(id)) fail(`validation_failure: ${label} has an empty assessment-set id`);
    assessmentSetIds.push(id);
  }
  const metadata: TopicRead["contentMetadata"] = {
    version: value.contentMetadata.version,
    lifecycle: value.contentMetadata.lifecycle as TopicRead["contentMetadata"]["lifecycle"],
  };
  if (value.contentMetadata.sourceId !== undefined) {
    if (!isNonEmptyString(value.contentMetadata.sourceId)) {
      fail(`validation_failure: ${label}.contentMetadata.sourceId is invalid`);
    }
    metadata.sourceId = value.contentMetadata.sourceId;
  }
  if (value.contentMetadata.updatedAt !== undefined) {
    if (!isNonEmptyString(value.contentMetadata.updatedAt)) {
      fail(`validation_failure: ${label}.contentMetadata.updatedAt is invalid`);
    }
    metadata.updatedAt = value.contentMetadata.updatedAt;
  }
  const topic: TopicRead = {
    id: value.id,
    href: value.href,
    title: value.title,
    slug: value.slug,
    disciplineId: value.disciplineId,
    subjectId: value.subjectId,
    categoryId: value.categoryId,
    contentStatus: value.contentStatus as TopicRead["contentStatus"],
    contentMetadata: metadata,
    conceptIds,
    assessmentSetIds,
  };
  return topic;
}

function validateConceptRead(value: unknown, topicId: string, label: string): ConceptRead {
  if (!isRecord(value)) fail(`validation_failure: ${label} must be an object`);
  if (!isNonEmptyString(value.id)) fail(`validation_failure: ${label}.id is required`);
  if (!isNonEmptyString(value.topicId)) fail(`validation_failure: ${label}.topicId is required`);
  if (!isNonEmptyString(value.slug)) fail(`validation_failure: ${label}.slug is required`);
  if (!isNonEmptyString(value.title)) fail(`validation_failure: ${label}.title is required`);
  if (value.topicId !== topicId) fail(`validation_failure: ${label}.topicId does not match topic`);
  return {
    id: value.id,
    topicId: value.topicId,
    slug: value.slug,
    title: value.title,
  };
}

function validateAssessmentSetApiRead(
  value: unknown,
  topicId: string,
  label: string,
): AssessmentSetApiRead {
  if (!isRecord(value)) fail(`validation_failure: ${label} must be an object`);
  if (!isNonEmptyString(value.id)) fail(`validation_failure: ${label}.id is required`);
  if (!isNonEmptyString(value.topicId)) fail(`validation_failure: ${label}.topicId is required`);
  if (!isNonEmptyString(value.kind)) fail(`validation_failure: ${label}.kind is required`);
  if (!isNonEmptyString(value.title)) fail(`validation_failure: ${label}.title is required`);
  if (value.topicId !== topicId) fail(`validation_failure: ${label}.topicId does not match topic`);
  if ("payload" in value) fail(`validation_failure: ${label} must not include payload`);
  if ("questions" in value) fail(`validation_failure: ${label} must not include questions`);
  if ("mcqPractice" in value) fail(`validation_failure: ${label} must not include mcqPractice`);
  return {
    id: value.id,
    topicId: value.topicId,
    kind: value.kind as AssessmentSetApiRead["kind"],
    title: value.title,
  };
}

export function validateTopicReadResponse(value: unknown): TopicReadResponse {
  if (!isRecord(value)) fail("validation_failure: TopicReadResponse must be an object");
  if ("learner" in value) fail("validation_failure: TopicReadResponse must not include learner");
  if ("analytics" in value) fail("validation_failure: TopicReadResponse must not include analytics");
  if ("entitlement" in value) {
    fail("validation_failure: TopicReadResponse must not include entitlement");
  }
  if ("commerce" in value) fail("validation_failure: TopicReadResponse must not include commerce");
  if ("events" in value) fail("validation_failure: TopicReadResponse must not include events");
  const topic = validateTopicRead(value.topic, "topic");
  if (!Array.isArray(value.concepts)) fail("validation_failure: concepts must be an array");
  if (!Array.isArray(value.assessmentSets)) {
    fail("validation_failure: assessmentSets must be an array");
  }
  const concepts: ConceptRead[] = [];
  for (let i = 0; i < value.concepts.length; i += 1) {
    concepts.push(validateConceptRead(value.concepts[i], topic.id, `concepts[${i}]`));
  }
  const assessmentSets: AssessmentSetApiRead[] = [];
  for (let i = 0; i < value.assessmentSets.length; i += 1) {
    assessmentSets.push(
      validateAssessmentSetApiRead(value.assessmentSets[i], topic.id, `assessmentSets[${i}]`),
    );
  }
  if (concepts.length !== topic.conceptIds.length) {
    fail("validation_failure: concepts length does not match conceptIds");
  }
  for (let i = 0; i < concepts.length; i += 1) {
    if (concepts[i]?.id !== topic.conceptIds[i]) {
      fail("validation_failure: concept identity does not match conceptIds");
    }
  }
  if (assessmentSets.length !== topic.assessmentSetIds.length) {
    fail("validation_failure: assessmentSets length does not match assessmentSetIds");
  }
  for (let i = 0; i < assessmentSets.length; i += 1) {
    if (assessmentSets[i]?.id !== topic.assessmentSetIds[i]) {
      fail("validation_failure: assessment-set identity does not match assessmentSetIds");
    }
  }
  return { topic, concepts, assessmentSets };
}

const FORBIDDEN_KEYS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
  "localStorage",
  "stack",
  "stackTrace",
  "cardNumber",
  "cvv",
  "invoice",
  "checkout",
  "payment",
  "mcqPractice",
  "questions",
] as const;

export function collectObjectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    keys.add(key);
    collectObjectKeys(record[key], keys);
  }
  return keys;
}

export function assertNoForbiddenKeys(value: unknown, label: string): void {
  const keys = collectObjectKeys(value);
  for (const key of FORBIDDEN_KEYS) {
    if (keys.has(key)) fail(`validation_failure: ${label} leaks key ${key}`);
  }
}

export function assertNoImplementationPaths(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  if (serialized.includes("src/lib/geography-data")) {
    fail(`validation_failure: ${label} exposes geography-data.ts as a public path`);
  }
  if (serialized.includes("sajib_atlas_learner_state")) {
    fail(`validation_failure: ${label} exposes learner persistence keys`);
  }
}

export function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  if (typeof serialized !== "string" || serialized.length < 2) {
    fail(`validation_failure: ${label} does not serialize to JSON`);
  }
  const roundTrip = JSON.stringify(JSON.parse(serialized));
  if (serialized !== roundTrip) fail(`validation_failure: ${label} is not JSON-roundtrippable`);
}
