import { getAssessmentSet } from "@/lib/assessment/sets";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { getConcept } from "@/lib/knowledge/concepts";
import {
  ANALYTICS_ENTITY_TYPES,
  ANALYTICS_EVENT_TYPES,
  ANALYTICS_SURFACES,
  type AnalyticsEntityType,
  type AnalyticsEvent,
  type AnalyticsEventSurface,
  type AnalyticsEventType,
} from "./types";

function fail(message: string): never {
  throw new Error(`Analytics event: ${message}`);
}

const ISO_DATE_TIME_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

const BANNED_METADATA_KEY_PARTS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "email",
  "phone",
  "fingerprint",
  "deviceid",
  "advertisingid",
  "ssn",
  "card",
  "latitude",
  "longitude",
  "useragent",
];

const EVENT_ENTITY_TYPE: Record<AnalyticsEventType, AnalyticsEntityType> = {
  topic_viewed: "topic",
  topic_completed: "topic",
  assessment_started: "assessment_set",
  assessment_completed: "assessment_set",
  revision_opened: "topic",
};

function isEventType(value: string): value is AnalyticsEventType {
  for (const type of ANALYTICS_EVENT_TYPES) {
    if (type === value) return true;
  }
  return false;
}

function isEntityType(value: string): value is AnalyticsEntityType {
  for (const type of ANALYTICS_ENTITY_TYPES) {
    if (type === value) return true;
  }
  return false;
}

function isSurface(value: string): value is AnalyticsEventSurface {
  for (const surface of ANALYTICS_SURFACES) {
    if (surface === value) return true;
  }
  return false;
}

function isIsoDateTimeUtc(value: string): boolean {
  if (!ISO_DATE_TIME_UTC.test(value)) return false;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  const iso = new Date(ms).toISOString();
  if (iso === value) return true;
  if (value.endsWith("Z") && !value.includes(".")) {
    return iso === `${value.slice(0, -1)}.000Z`;
  }
  return false;
}

function assertCanonicalId(kind: string, id: string): void {
  if (!id.trim()) fail(`empty ${kind} id`);
  if (id !== id.trim()) fail(`${kind} id has surrounding whitespace`);
}

function assertTopicExists(id: string, label: string): void {
  if (!getCanonicalTopic(id)) fail(`${label} references unknown topic ${id}`);
}

function assertAssessmentSetExists(id: string, label: string): void {
  if (!getAssessmentSet(id)) fail(`${label} references unknown assessment set ${id}`);
}

function assertConceptExists(id: string, label: string): void {
  if (!getConcept(id)) fail(`${label} references unknown concept ${id}`);
}

function assertEntityResolves(type: AnalyticsEntityType, id: string): void {
  if (type === "topic") assertTopicExists(id, "entity");
  else if (type === "assessment_set") assertAssessmentSetExists(id, "entity");
  else assertConceptExists(id, "entity");
}

function metadataKeyIsBanned(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized === "ip" || normalized.startsWith("ipaddress")) return true;
  for (const part of BANNED_METADATA_KEY_PARTS) {
    if (normalized.includes(part)) return true;
  }
  return false;
}

export function validateAnalyticsEvent(input: {
  eventId: string;
  type: string;
  entity: { type: string; id: string };
  occurredAt: string;
  context?: {
    topicId?: string;
    assessmentSetId?: string;
    conceptId?: string;
    surface?: string;
  };
  metadata?: { readonly [key: string]: string | number | boolean };
}): AnalyticsEvent {
  if (!input.eventId?.trim()) fail("empty eventId");
  if (input.eventId !== input.eventId.trim()) fail("eventId has surrounding whitespace");
  if (!isEventType(input.type)) fail(`invalid event type ${input.type}`);
  if (!input.entity) fail("missing entity");
  if (!isEntityType(input.entity.type)) fail(`invalid entity type ${input.entity.type}`);
  assertCanonicalId("entity", input.entity.id);

  if (input.eventId === input.entity.id) {
    fail("eventId must not equal a domain entity id");
  }

  const expectedEntity = EVENT_ENTITY_TYPE[input.type];
  if (input.entity.type !== expectedEntity) {
    fail(`event ${input.type} must reference a ${expectedEntity}`);
  }

  assertEntityResolves(input.entity.type, input.entity.id);

  if (!input.occurredAt?.trim()) fail("empty occurredAt");
  if (!isIsoDateTimeUtc(input.occurredAt)) {
    fail(`invalid occurredAt ${input.occurredAt}; use ISO-8601 UTC datetime`);
  }

  const event: AnalyticsEvent = {
    eventId: input.eventId,
    type: input.type,
    entity: { type: input.entity.type, id: input.entity.id },
    occurredAt: input.occurredAt,
  };

  if (input.context !== undefined) {
    const context: NonNullable<AnalyticsEvent["context"]> = {};
    if (input.context.topicId !== undefined) {
      assertCanonicalId("context.topicId", input.context.topicId);
      assertTopicExists(input.context.topicId, "context.topicId");
      context.topicId = input.context.topicId;
    }
    if (input.context.assessmentSetId !== undefined) {
      assertCanonicalId("context.assessmentSetId", input.context.assessmentSetId);
      assertAssessmentSetExists(input.context.assessmentSetId, "context.assessmentSetId");
      context.assessmentSetId = input.context.assessmentSetId;
    }
    if (input.context.conceptId !== undefined) {
      assertCanonicalId("context.conceptId", input.context.conceptId);
      assertConceptExists(input.context.conceptId, "context.conceptId");
      context.conceptId = input.context.conceptId;
    }
    if (input.context.surface !== undefined) {
      if (!isSurface(input.context.surface)) {
        fail(`invalid surface ${input.context.surface}`);
      }
      context.surface = input.context.surface;
    }
    if (context.topicId && context.assessmentSetId) {
      const set = getAssessmentSet(context.assessmentSetId);
      if (set && set.topicId !== context.topicId) {
        fail("context.assessmentSetId does not belong to context.topicId");
      }
    }
    if (
      event.entity.type === "assessment_set" &&
      context.assessmentSetId &&
      context.assessmentSetId !== event.entity.id
    ) {
      fail("context.assessmentSetId must match entity id");
    }
    if (event.entity.type === "topic" && context.topicId && context.topicId !== event.entity.id) {
      fail("context.topicId must match entity id");
    }
    event.context = context;
  }

  if (input.metadata !== undefined) {
    const metadata: { [key: string]: string | number | boolean } = {};
    for (const key of Object.keys(input.metadata)) {
      if (!key.trim()) fail("empty metadata key");
      if (metadataKeyIsBanned(key)) fail(`metadata key ${key} is not allowed`);
      const value = input.metadata[key];
      const valueType = typeof value;
      if (valueType !== "string" && valueType !== "number" && valueType !== "boolean") {
        fail(`metadata.${key} must be a string, number, or boolean`);
      }
      if (valueType === "number" && !Number.isFinite(value)) {
        fail(`metadata.${key} must be a finite number`);
      }
      metadata[key] = value;
    }
    event.metadata = metadata;
  }

  return event;
}
