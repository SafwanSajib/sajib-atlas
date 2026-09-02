import { getAssessmentSetsByTopicId } from "@/lib/assessment/sets";
import type { AssessmentKind } from "@/lib/assessment/types";
import { getCanonicalTopic } from "@/lib/content/manifest";
import type { CanonicalTopic } from "@/lib/content/types";
import { getTopicRead } from "@/lib/contracts/read";
import { getConceptsByTopicId } from "@/lib/knowledge/concepts";
import { composeTopicCapabilityModel } from "./capabilities";
import { composeTopicNavigation } from "./navigation";
import { deriveTopicEngineStatus } from "./status";
import type { TopicEngineConceptRef, TopicEngineModel } from "./types";

/**
 * Compose a Topic Engine model from existing Phase 1 contracts.
 *
 * Canonical catalogs remain the source of truth. This function does not
 * copy Geography payload, MCQ arrays, learner storage, or commerce records.
 */

function toConceptRef(item: {
  id: string;
  topicId: string;
  slug: string;
  title: string;
}): TopicEngineConceptRef {
  return {
    id: item.id,
    topicId: item.topicId,
    slug: item.slug,
    title: item.title,
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

export function composeTopicEngineModelFromCanonical(topic: CanonicalTopic): TopicEngineModel {
  const read = getTopicRead(topic.id);
  const identitySource = read ?? topic;
  const concepts = getConceptsByTopicId(topic.id).map(toConceptRef);
  const assessmentSets = getAssessmentSetsByTopicId(topic.id);
  const metadata = read?.contentMetadata ?? topic.contentMetadata;
  const contentStatus = read?.contentStatus ?? topic.contentStatus;
  const lifecycle = metadata.lifecycle;

  const assessmentSetIds = read?.assessmentSetIds ?? topic.assessmentSetIds;
  const capabilityModel = composeTopicCapabilityModel({
    topicId: topic.id,
    lifecycle,
    contentStatus,
    conceptCount: concepts.length,
    assessmentSetIds,
    kinds: uniqueKinds(assessmentSets.map((item) => item.kind)),
    catalogAccess: "public",
  });

  const status = deriveTopicEngineStatus({
    contentStatus,
    lifecycle,
    conceptCount: concepts.length,
    assessmentSetCount: assessmentSetIds.length,
    version: metadata.version,
    sourceId: metadata.sourceId,
    updatedAt: metadata.updatedAt,
  });

  return {
    identity: {
      id: identitySource.id,
      href: identitySource.href,
      title: identitySource.title,
      slug: identitySource.slug,
      subjectId: identitySource.subjectId,
    },
    hierarchy: {
      disciplineId: identitySource.disciplineId,
      subjectId: identitySource.subjectId,
      categoryId: identitySource.categoryId,
    },
    status,
    concepts,
    capabilities: capabilityModel.discovery,
    navigation: composeTopicNavigation({ id: topic.id, categoryId: topic.categoryId }),
  };
}

export function composeTopicEngineModel(topicId: string): TopicEngineModel | undefined {
  const topic = getCanonicalTopic(topicId);
  if (!topic) return undefined;
  return composeTopicEngineModelFromCanonical(topic);
}
