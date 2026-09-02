import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { CONTENT_LIFECYCLES } from "@/lib/content/metadata";
import type { ContentLifecycle, ContentStatus } from "@/lib/content/types";
import { parseTopicId } from "./identity";
import {
  deriveTopicEngineCapabilityAvailability,
  isTopicEngineCapabilityAvailabilityState,
  isTopicOperationalState,
} from "./status";
import {
  AMBIGUOUS_TOPIC_ENGINE_BOOLEANS,
  type TopicEngineCapabilityAvailability,
  type TopicEngineConceptRef,
  type TopicEngineModel,
} from "./types";

function fail(message: string): never {
  throw new Error(`Topic engine: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const CONTENT_STATUSES = ["available", "partial", "planned"] as const;

function isContentStatus(value: string): value is ContentStatus {
  for (const status of CONTENT_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function isContentLifecycle(value: string): value is ContentLifecycle {
  for (const lifecycle of CONTENT_LIFECYCLES) {
    if (lifecycle === value) return true;
  }
  return false;
}

function parseAvailabilityField(
  value: unknown,
  label: string,
): TopicEngineCapabilityAvailability[keyof TopicEngineCapabilityAvailability] {
  if (typeof value !== "string" || !isTopicEngineCapabilityAvailabilityState(value)) {
    fail(`${label} must be available or unavailable`);
  }
  return value;
}

function parseCapabilityAvailability(
  value: unknown,
  lifecycle: ContentLifecycle,
  contentStatus: ContentStatus,
  conceptCount: number,
  assessmentSetCount: number,
): TopicEngineCapabilityAvailability {
  if (!isRecord(value)) fail("status.capabilityAvailability must be an object");
  const parsed: TopicEngineCapabilityAvailability = {
    study: parseAvailabilityField(value.study, "capabilityAvailability.study"),
    concepts: parseAvailabilityField(value.concepts, "capabilityAvailability.concepts"),
    assessment: parseAvailabilityField(value.assessment, "capabilityAvailability.assessment"),
    completion: parseAvailabilityField(value.completion, "capabilityAvailability.completion"),
    revision: parseAvailabilityField(value.revision, "capabilityAvailability.revision"),
    search: parseAvailabilityField(value.search, "capabilityAvailability.search"),
  };
  const expected = deriveTopicEngineCapabilityAvailability({
    lifecycle,
    contentStatus,
    conceptCount,
    assessmentSetCount,
  });
  if (JSON.stringify(parsed) !== JSON.stringify(expected)) {
    fail("capabilityAvailability is inconsistent with publication, content availability, and assessment identity");
  }
  return parsed;
}

const FORBIDDEN_KEYS = [
  "sections",
  "mcqPractice",
  "questions",
  "localStorage",
  "completedTopics",
  "mcqResults",
  "analytics",
  "events",
  "entitlement",
  "commerce",
  "payment",
  "checkout",
  "invoice",
  "amount",
  "isEnabled",
  "isLive",
  "isAvailable",
  "engineReady",
  "canStudy",
  "canPractice",
  "canInspect",
  "canMarkComplete",
  "canSetCompleteGoal",
  "isPublicCatalog",
  "embeddings",
  "vector",
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

export function assertNoAmbiguousTopicEngineBooleans(value: unknown, label: string): void {
  const keys = collectObjectKeys(value);
  for (const key of AMBIGUOUS_TOPIC_ENGINE_BOOLEANS) {
    if (keys.has(key)) {
      fail(
        `${label} uses ambiguous boolean ${key} without a precise architectural meaning; use named lifecycle and capabilityAvailability states`,
      );
    }
  }
}

export function assertNoForbiddenTopicEngineKeys(value: unknown, label: string): void {
  assertNoAmbiguousTopicEngineBooleans(value, label);
  const keys = collectObjectKeys(value);
  for (const key of FORBIDDEN_KEYS) {
    if (keys.has(key)) fail(`${label} leaks key ${key}`);
  }
}

export function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  if (typeof serialized !== "string" || serialized.length < 2) {
    fail(`${label} does not serialize to JSON`);
  }
  const roundTrip = JSON.stringify(JSON.parse(serialized));
  if (serialized !== roundTrip) fail(`${label} is not JSON-roundtrippable`);
}

export function assertNoImplementationPaths(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  if (serialized.includes("src/lib/geography-data")) {
    fail(`${label} exposes geography-data.ts as a public path`);
  }
  if (serialized.includes("sajib_atlas_learner_state")) {
    fail(`${label} exposes learner persistence keys`);
  }
}

export function validateTopicEngineModel(value: unknown): TopicEngineModel {
  if (!isRecord(value)) fail("model must be an object");
  assertNoForbiddenTopicEngineKeys(value, "model");

  if (!isRecord(value.identity)) fail("identity must be an object");
  if (!isRecord(value.hierarchy)) fail("hierarchy must be an object");
  if (!isRecord(value.status)) fail("status must be an object");
  if (!isRecord(value.capabilities)) fail("capabilities must be an object");
  if (!isRecord(value.navigation)) fail("navigation must be an object");
  if (!Array.isArray(value.concepts)) fail("concepts must be an array");

  const identity = value.identity;
  if (!isNonEmptyString(identity.id)) fail("identity.id is required");
  if (!isNonEmptyString(identity.href)) fail("identity.href is required");
  if (!isNonEmptyString(identity.title)) fail("identity.title is required");
  if (!isNonEmptyString(identity.slug)) fail("identity.slug is required");
  if (!isNonEmptyString(identity.subjectId)) fail("identity.subjectId is required");

  const parsed = parseTopicId(identity.id);
  if (!parsed) fail(`identity.id is not a canonical topic id: ${identity.id}`);
  if (parsed.subjectId !== identity.subjectId) {
    fail(`identity.subjectId does not match id: ${identity.subjectId}`);
  }
  if (parsed.slug !== identity.slug) fail(`identity.slug does not match id: ${identity.slug}`);
  if (identity.href !== `/${identity.id}`) {
    fail(`identity.href must match /id: ${identity.href}`);
  }

  const hierarchy = value.hierarchy;
  if (!isNonEmptyString(hierarchy.disciplineId)) fail("hierarchy.disciplineId is required");
  if (!isNonEmptyString(hierarchy.subjectId)) fail("hierarchy.subjectId is required");
  if (!isNonEmptyString(hierarchy.categoryId)) fail("hierarchy.categoryId is required");
  if (hierarchy.subjectId !== identity.subjectId) {
    fail("hierarchy.subjectId does not match identity.subjectId");
  }

  const status = value.status;
  if (status.identityExistence !== "present") {
    fail("composed topic status.identityExistence must be present");
  }
  if (!isNonEmptyString(status.operationalState) || !isTopicOperationalState(status.operationalState)) {
    fail("status.operationalState is invalid");
  }
  if (!isNonEmptyString(status.contentStatus) || !isContentStatus(status.contentStatus)) {
    fail("status.contentStatus is invalid");
  }
  if (!isNonEmptyString(status.lifecycle) || !isContentLifecycle(status.lifecycle)) {
    fail("status.lifecycle is invalid");
  }
  if (typeof status.version !== "number" || !Number.isInteger(status.version) || status.version < 1) {
    fail("status.version is invalid");
  }
  const version = status.version;
  if (!isRecord(status.capabilityAvailability)) {
    fail("status.capabilityAvailability is required");
  }

  const concepts: TopicEngineConceptRef[] = [];
  for (const item of value.concepts) {
    if (!isRecord(item)) fail("concept ref must be an object");
    if (!isNonEmptyString(item.id) || !isNonEmptyString(item.topicId)) {
      fail("concept ref is missing identity");
    }
    if (!isNonEmptyString(item.slug) || !isNonEmptyString(item.title)) {
      fail("concept ref is missing slug/title");
    }
    if (item.topicId !== identity.id) fail(`concept ${item.id} does not belong to ${identity.id}`);
    concepts.push({
      id: item.id,
      topicId: item.topicId,
      slug: item.slug,
      title: item.title,
    });
  }

  const capabilities = value.capabilities;
  if (!isRecord(capabilities.content) || !isRecord(capabilities.assessment)) {
    fail("capabilities.content and capabilities.assessment are required");
  }
  if (!isRecord(capabilities.learner) || !isRecord(capabilities.search) || !isRecord(capabilities.access)) {
    fail("capabilities.learner, search, and access are required");
  }
  if (!Array.isArray(capabilities.assessment.assessmentSetIds)) {
    fail("assessmentSetIds must be an array");
  }
  const assessmentSetIds: string[] = [];
  for (const setId of capabilities.assessment.assessmentSetIds) {
    if (!isNonEmptyString(setId)) fail("empty assessmentSetId");
    const parsedSet = parseAssessmentSetId(setId);
    if (!parsedSet || parsedSet.topicId !== identity.id) {
      fail(`assessmentSetId ${String(setId)} does not belong to ${identity.id}`);
    }
    assessmentSetIds.push(setId);
  }

  const capabilityAvailability = parseCapabilityAvailability(
    status.capabilityAvailability,
    status.lifecycle,
    status.contentStatus,
    concepts.length,
    assessmentSetIds.length,
  );

  const navigation = value.navigation;
  if (!isNonEmptyString(navigation.parentCategoryId)) fail("navigation.parentCategoryId is required");
  if (navigation.parentCategoryId !== hierarchy.categoryId) {
    fail("navigation.parentCategoryId does not match hierarchy.categoryId");
  }
  if (!Array.isArray(navigation.siblingIds)) fail("siblingIds must be an array");
  const siblingIds: string[] = [];
  for (const siblingId of navigation.siblingIds) {
    if (!isNonEmptyString(siblingId)) fail("empty sibling id");
    if (siblingId === identity.id) fail("siblingIds must not include the current topic");
    siblingIds.push(siblingId);
  }

  const model: TopicEngineModel = {
    identity: {
      id: identity.id,
      href: identity.href,
      title: identity.title,
      slug: identity.slug,
      subjectId: identity.subjectId,
    },
    hierarchy: {
      disciplineId: hierarchy.disciplineId,
      subjectId: hierarchy.subjectId,
      categoryId: hierarchy.categoryId,
    },
    status: {
      identityExistence: "present",
      operationalState: status.operationalState,
      contentStatus: status.contentStatus,
      lifecycle: status.lifecycle,
      capabilityAvailability,
      version,
    },
    concepts,
    capabilities: {
      content: {
        contentStatus: status.contentStatus,
        conceptCount: concepts.length,
      },
      assessment: {
        kinds: Array.isArray(capabilities.assessment.kinds)
          ? (capabilities.assessment.kinds.filter(
              (kind): kind is TopicEngineModel["capabilities"]["assessment"]["kinds"][number] =>
                kind === "mcq-practice",
            ) as TopicEngineModel["capabilities"]["assessment"]["kinds"][number][])
          : [],
        assessmentSetIds,
        assessmentSetCount: assessmentSetIds.length,
      },
      learner: {
        localLearnerId: "learner/local",
        learnerState: "external",
      },
      search: {
        index: "canonical-manifest",
      },
      access: {
        catalogAccess: capabilities.access.catalogAccess === "restricted" ? "restricted" : "public",
      },
    },
    navigation: {
      parentCategoryId: navigation.parentCategoryId,
      siblingIds,
    },
  };

  if (isNonEmptyString(status.sourceId)) model.status.sourceId = status.sourceId;
  if (isNonEmptyString(status.updatedAt)) model.status.updatedAt = status.updatedAt;
  if (isNonEmptyString(navigation.parentCategoryHref)) {
    model.navigation.parentCategoryHref = navigation.parentCategoryHref;
  }
  if (isRecord(navigation.previous) && isNonEmptyString(navigation.previous.id)) {
    model.navigation.previous = {
      id: navigation.previous.id,
      href: isNonEmptyString(navigation.previous.href) ? navigation.previous.href : `/${navigation.previous.id}`,
      title: isNonEmptyString(navigation.previous.title) ? navigation.previous.title : navigation.previous.id,
      slug: isNonEmptyString(navigation.previous.slug) ? navigation.previous.slug : navigation.previous.id,
    };
  }
  if (isRecord(navigation.next) && isNonEmptyString(navigation.next.id)) {
    model.navigation.next = {
      id: navigation.next.id,
      href: isNonEmptyString(navigation.next.href) ? navigation.next.href : `/${navigation.next.id}`,
      title: isNonEmptyString(navigation.next.title) ? navigation.next.title : navigation.next.id,
      slug: isNonEmptyString(navigation.next.slug) ? navigation.next.slug : navigation.next.id,
    };
  }

  assertJsonSafe(model, "validated model");
  return model;
}
