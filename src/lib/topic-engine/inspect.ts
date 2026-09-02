import { getCategory, getDiscipline, getSubject } from "@/lib/knowledge/catalog";
import { composeTopicEngineModel } from "./composition";
import type { TopicEngineInspect } from "./types";

/**
 * Inspection view for a resolved topic. Diagnostic counts only.
 * Does not embed payload, learner state, or analytics.
 */

export function inspectTopic(topicId: string): TopicEngineInspect | undefined {
  const topic = composeTopicEngineModel(topicId);
  if (!topic) return undefined;

  const catalogBound =
    getDiscipline(topic.hierarchy.disciplineId) !== undefined &&
    getSubject(topic.hierarchy.subjectId) !== undefined &&
    getCategory(topic.hierarchy.categoryId) !== undefined;

  return {
    topic,
    diagnostics: {
      identityExistence: "present",
      contentAvailability: topic.status.contentStatus,
      publicationState: topic.status.lifecycle,
      capabilityAvailability: topic.status.capabilityAvailability,
      conceptCount: topic.concepts.length,
      assessmentSetCount: topic.capabilities.assessment.assessmentSetCount,
      siblingCount: topic.navigation.siblingIds.length,
      catalogBound,
    },
  };
}
