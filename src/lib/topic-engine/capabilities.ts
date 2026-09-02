import { getAssessmentSetsByTopicId } from "@/lib/assessment/sets";
import type { AssessmentKind } from "@/lib/assessment/types";
import { getCanonicalTopic } from "@/lib/content/manifest";
import type { ContentLifecycle, ContentStatus } from "@/lib/content/types";
import { getConceptsByTopicId } from "@/lib/knowledge/concepts";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { deriveTopicEngineCapabilityAvailability } from "./status";
import {
  TOPIC_CAPABILITY_KINDS,
  type TopicAccessCapabilities,
  type TopicAssessmentCapabilities,
  type TopicCapabilityKind,
  type TopicCapabilityModel,
  type TopicCatalogAccess,
  type TopicContentCapabilities,
  type TopicEngineCapabilities,
  type TopicEngineCapabilityAvailability,
  type TopicEngineCapabilityAvailabilityState,
  type TopicLearnerCapabilities,
  type TopicSearchCapabilities,
} from "./types";

/**
 * Universal Topic Capability Model (Phase 2 §4).
 *
 * Same discovery + availability contract for Geography, BCS, English, and
 * future subjects. Zero concepts and zero assessment sets are valid.
 * Publication/lifecycle stays on Phase 1C `contentMetadata.lifecycle`.
 */

export function isTopicCapabilityKind(value: string): value is TopicCapabilityKind {
  for (const kind of TOPIC_CAPABILITY_KINDS) {
    if (kind === value) return true;
  }
  return false;
}

export function getCapabilityAvailability(
  availability: TopicEngineCapabilityAvailability,
  kind: TopicCapabilityKind,
): TopicEngineCapabilityAvailabilityState {
  return availability[kind];
}

export function listAvailableCapabilityKinds(
  availability: TopicEngineCapabilityAvailability,
): TopicCapabilityKind[] {
  const available: TopicCapabilityKind[] = [];
  for (const kind of TOPIC_CAPABILITY_KINDS) {
    if (availability[kind] === "available") available.push(kind);
  }
  return available;
}

export function discoverContentCapabilities(input: {
  contentStatus: ContentStatus;
  conceptCount: number;
}): TopicContentCapabilities {
  return {
    contentStatus: input.contentStatus,
    conceptCount: input.conceptCount,
  };
}

export function discoverAssessmentCapabilities(input: {
  assessmentSetIds: readonly string[];
  kinds: readonly AssessmentKind[];
}): TopicAssessmentCapabilities {
  const assessmentSetIds = [...input.assessmentSetIds];
  return {
    kinds: [...input.kinds],
    assessmentSetIds,
    assessmentSetCount: assessmentSetIds.length,
  };
}

export function discoverLearnerCapabilities(): TopicLearnerCapabilities {
  return {
    localLearnerId: LOCAL_LEARNER_ID,
    learnerState: "external",
  };
}

export function discoverSearchCapabilities(): TopicSearchCapabilities {
  return {
    index: "canonical-manifest",
  };
}

export function discoverAccessCapabilities(
  catalogAccess: TopicCatalogAccess = "public",
): TopicAccessCapabilities {
  return { catalogAccess };
}

export function discoverTopicCapabilities(input: {
  contentStatus: ContentStatus;
  conceptCount: number;
  assessmentSetIds: readonly string[];
  kinds: readonly AssessmentKind[];
  catalogAccess?: TopicCatalogAccess;
}): TopicEngineCapabilities {
  return {
    content: discoverContentCapabilities(input),
    assessment: discoverAssessmentCapabilities(input),
    learner: discoverLearnerCapabilities(),
    search: discoverSearchCapabilities(),
    access: discoverAccessCapabilities(input.catalogAccess),
  };
}

export function composeTopicCapabilityModel(input: {
  topicId: string;
  lifecycle: ContentLifecycle;
  contentStatus: ContentStatus;
  conceptCount: number;
  assessmentSetIds: readonly string[];
  kinds: readonly AssessmentKind[];
  catalogAccess?: TopicCatalogAccess;
}): TopicCapabilityModel {
  return {
    topicId: input.topicId,
    discovery: discoverTopicCapabilities(input),
    availability: deriveTopicEngineCapabilityAvailability({
      lifecycle: input.lifecycle,
      contentStatus: input.contentStatus,
      conceptCount: input.conceptCount,
      assessmentSetCount: input.assessmentSetIds.length,
    }),
  };
}

function uniqueKinds(kinds: readonly AssessmentKind[]): AssessmentKind[] {
  const seen = new Set<AssessmentKind>();
  const unique: AssessmentKind[] = [];
  for (const kind of kinds) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    unique.push(kind);
  }
  return unique;
}

/** Resolve the universal capability model from canonical identity. */
export function composeTopicCapabilityModelForTopicId(
  topicId: string,
): TopicCapabilityModel | undefined {
  const topic = getCanonicalTopic(topicId);
  if (!topic) return undefined;
  return composeTopicCapabilityModel({
    topicId: topic.id,
    lifecycle: topic.contentMetadata.lifecycle,
    contentStatus: topic.contentStatus,
    conceptCount: getConceptsByTopicId(topic.id).length,
    assessmentSetIds: topic.assessmentSetIds,
    kinds: uniqueKinds(getAssessmentSetsByTopicId(topic.id).map((item) => item.kind)),
    catalogAccess: "public",
  });
}
