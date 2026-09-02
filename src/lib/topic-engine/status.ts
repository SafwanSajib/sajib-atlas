import { getCanonicalTopic } from "@/lib/content/manifest";
import { CONTENT_LIFECYCLES } from "@/lib/content/metadata";
import type { ContentLifecycle, ContentStatus } from "@/lib/content/types";
import { parseTopicId } from "./identity";
import {
  TOPIC_CONTENT_AVAILABILITY_STATES,
  TOPIC_ENGINE_CAPABILITY_AVAILABILITY_STATES,
  TOPIC_IDENTITY_EXISTENCE_STATES,
  TOPIC_OPERATIONAL_STATES,
  type TopicContentAvailability,
  type TopicEngineCapabilityAvailability,
  type TopicEngineCapabilityAvailabilityState,
  type TopicEngineStatus,
  type TopicIdentityExistence,
  type TopicIdentityState,
  type TopicLifecycleInspect,
  type TopicOperationalState,
  type TopicPublicationState,
} from "./types";

/**
 * Topic lifecycle/state derivation.
 *
 * Distinguishes:
 * - identity existence (canonical catalog membership)
 * - content availability (payload completeness)
 * - publication/lifecycle state (Phase 1C contentMetadata.lifecycle)
 * - engine capability availability (per-capability engine operations)
 * - operational state (derived rollup)
 *
 * Does not invent publication dates or migrate payload.
 */

export function isTopicIdentityExistence(value: string): value is TopicIdentityExistence {
  for (const state of TOPIC_IDENTITY_EXISTENCE_STATES) {
    if (state === value) return true;
  }
  return false;
}

export function isTopicContentAvailability(value: string): value is TopicContentAvailability {
  for (const state of TOPIC_CONTENT_AVAILABILITY_STATES) {
    if (state === value) return true;
  }
  return false;
}

export function isTopicPublicationState(value: string): value is TopicPublicationState {
  for (const state of CONTENT_LIFECYCLES) {
    if (state === value) return true;
  }
  return false;
}

export function isTopicOperationalState(value: string): value is TopicOperationalState {
  for (const state of TOPIC_OPERATIONAL_STATES) {
    if (state === value) return true;
  }
  return false;
}

export function isTopicEngineCapabilityAvailabilityState(
  value: string,
): value is TopicEngineCapabilityAvailabilityState {
  for (const state of TOPIC_ENGINE_CAPABILITY_AVAILABILITY_STATES) {
    if (state === value) return true;
  }
  return false;
}

function availability(ready: boolean): TopicEngineCapabilityAvailabilityState {
  return ready ? "available" : "unavailable";
}

/**
 * Per-capability engine availability. Independent of `contentStatus`.
 * `contentStatus === "available"` is payload completeness, not study readiness.
 */
export function deriveTopicEngineCapabilityAvailability(input: {
  lifecycle: ContentLifecycle;
  contentStatus: ContentStatus;
  conceptCount: number;
  assessmentSetCount: number;
}): TopicEngineCapabilityAvailability {
  const published = input.lifecycle === "published";
  const payloadComplete = input.contentStatus === "available";
  const study = published && payloadComplete;
  const hasAssessment = input.assessmentSetCount > 0;
  return {
    study: availability(study),
    concepts: availability(input.conceptCount > 0),
    assessment: availability(hasAssessment),
    completion: availability(study),
    revision: availability(hasAssessment),
    search: "available",
  };
}

/**
 * Catalog membership only. Invalid id shape is not a topic, so it is absent.
 * Partial/planned content is still present identity.
 */
export function deriveTopicIdentityExistence(topicId: string): TopicIdentityExistence {
  if (!parseTopicId(topicId)) return "absent";
  return getCanonicalTopic(topicId) === undefined ? "absent" : "present";
}

export function topicIdentityExists(topicId: string): boolean {
  return deriveTopicIdentityExistence(topicId) === "present";
}

export function inspectTopicIdentityState(topicId: string): TopicIdentityState {
  return {
    topicId,
    identityExistence: deriveTopicIdentityExistence(topicId),
  };
}

/**
 * Content availability and publication are independent Phase 1 fields.
 * They are omitted when identity is absent — absence is not `planned` or `draft`.
 */
export function inspectTopicLifecycleState(topicId: string): TopicLifecycleInspect {
  if (!parseTopicId(topicId)) {
    return { topicId, identityExistence: "absent" };
  }
  const topic = getCanonicalTopic(topicId);
  if (!topic) {
    return { topicId, identityExistence: "absent" };
  }
  return {
    topicId: topic.id,
    identityExistence: "present",
    contentAvailability: topic.contentStatus,
    publicationState: topic.contentMetadata.lifecycle,
    capabilityAvailability: deriveTopicEngineCapabilityAvailability({
      lifecycle: topic.contentMetadata.lifecycle,
      contentStatus: topic.contentStatus,
      conceptCount: topic.conceptIds.length,
      assessmentSetCount: topic.assessmentSetIds.length,
    }),
    operationalState: deriveTopicOperationalState(
      topic.contentMetadata.lifecycle,
      topic.contentStatus,
    ),
  };
}

export function deriveTopicOperationalState(
  lifecycle: ContentLifecycle,
  contentStatus: ContentStatus,
): TopicOperationalState {
  if (lifecycle === "archived") return "retired";
  if (lifecycle === "draft") return "unpublished";
  if (contentStatus === "available") return "study-ready";
  return "catalog-only";
}

export function deriveTopicEngineStatus(input: {
  contentStatus: ContentStatus;
  lifecycle: ContentLifecycle;
  conceptCount: number;
  assessmentSetCount: number;
  version: number;
  sourceId?: string;
  updatedAt?: string;
}): TopicEngineStatus {
  const status: TopicEngineStatus = {
    identityExistence: "present",
    operationalState: deriveTopicOperationalState(input.lifecycle, input.contentStatus),
    contentStatus: input.contentStatus,
    lifecycle: input.lifecycle,
    capabilityAvailability: deriveTopicEngineCapabilityAvailability({
      lifecycle: input.lifecycle,
      contentStatus: input.contentStatus,
      conceptCount: input.conceptCount,
      assessmentSetCount: input.assessmentSetCount,
    }),
    version: input.version,
  };
  if (input.sourceId !== undefined) status.sourceId = input.sourceId;
  if (input.updatedAt !== undefined) status.updatedAt = input.updatedAt;
  return status;
}
