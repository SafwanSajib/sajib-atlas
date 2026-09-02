/**
 * Analytics event identity contract (Phase 1F).
 *
 * Represents an action that could later be collected. This module does not
 * emit, store, queue, or transmit events.
 *
 * eventId is an occurrence id, not a topic/learner/assessment/question id.
 * Learner persistence remains src/store/learner/. Knowledge catalogs remain
 * the source of truth for entity ids.
 *
 * JSON-safe primitives only. No Date, Map, functions, or PII fields.
 */

export const ANALYTICS_EVENT_TYPES = [
  "topic_viewed",
  "topic_completed",
  "assessment_started",
  "assessment_completed",
  "revision_opened",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/**
 * Domain entities that already have canonical identity.
 * `learner` is omitted: there is no backend learner id yet.
 */
export const ANALYTICS_ENTITY_TYPES = ["topic", "assessment_set", "concept"] as const;
export type AnalyticsEntityType = (typeof ANALYTICS_ENTITY_TYPES)[number];

export const ANALYTICS_SURFACES = ["study", "revision", "dashboard", "practice"] as const;
export type AnalyticsEventSurface = (typeof ANALYTICS_SURFACES)[number];

export type AnalyticsEntityRef = {
  type: AnalyticsEntityType;
  id: string;
};

export type AnalyticsEventContext = {
  topicId?: string;
  assessmentSetId?: string;
  conceptId?: string;
  surface?: AnalyticsEventSurface;
};

/** Primitive bag only. Nested objects and arrays are not allowed. */
export type AnalyticsEventMetadata = {
  readonly [key: string]: string | number | boolean;
};

export type AnalyticsEvent = {
  eventId: string;
  type: AnalyticsEventType;
  entity: AnalyticsEntityRef;
  /** ISO-8601 UTC datetime of occurrence, not content publication. */
  occurredAt: string;
  context?: AnalyticsEventContext;
  metadata?: AnalyticsEventMetadata;
};
