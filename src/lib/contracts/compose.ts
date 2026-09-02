/**
 * Unified platform read composition (Phase 1J).
 *
 * Projects existing 1E getters into API-ready response shapes.
 * Does not replace those getters and does not import payload modules.
 */

import { decideAccess } from "@/lib/entitlement/access";
import { defaultIdentityRead } from "@/lib/identity/read";
import { defaultLocalProfile } from "@/lib/learner/identity";
import type { LearnerGoal, LearnerProfile } from "@/lib/learner/types";
import {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  type AssessmentSetApiRead,
  type CategoryCollectionRead,
  type EntitlementAccessRead,
  type GetCategoriesQuery,
  type GetSubjectsQuery,
  type GetTopicQuery,
  type GetTopicsQuery,
  type IdentityReadResponse,
  type KnowledgeCollectionRead,
  type LearnerReadResponse,
  type PlatformReadErrorCode,
  type PlatformReadFailure,
  type PlatformReadResult,
  type PlatformReadSuccess,
  type SubjectCollectionRead,
  type TopicCollectionRead,
  type TopicReadResponse,
} from "./api";
import {
  getAssessmentSetRead,
  getAssessmentSetsByTopicId,
  getCategoriesBySubjectId,
  getConceptRead,
  getConceptsByTopicId,
  getDisciplines,
  getSubjectsByDisciplineId,
  getTopicRead,
  getTopicsByCategoryId,
} from "./read";
import type { AssessmentSetRead, ConceptRead, TopicRead } from "./types";

export {
  getAssessmentSetRead,
  getAssessmentSetsByTopicId,
  getCategoriesBySubjectId,
  getConceptRead,
  getConceptsByTopicId,
  getDisciplines,
  getSubjectsByDisciplineId,
  getTopicRead,
  getTopicsByCategoryId,
};

/** Spec name; live implementation is getTopicRead. */
export function getTopicReadModel(id: string): TopicRead | undefined {
  return getTopicRead(id);
}

/** Spec name; live implementation is getConceptRead. */
export function getConceptReadModel(id: string): ConceptRead | undefined {
  return getConceptRead(id);
}

export function toAssessmentSetApiRead(set: AssessmentSetRead): AssessmentSetApiRead {
  return {
    id: set.id,
    topicId: set.topicId,
    kind: set.kind,
    title: set.title,
  };
}

export function composeTopicReadResponse(topicId: string): TopicReadResponse | undefined {
  const topic = getTopicRead(topicId);
  if (!topic) return undefined;
  return {
    topic,
    concepts: getConceptsByTopicId(topicId),
    assessmentSets: getAssessmentSetsByTopicId(topicId).map(toAssessmentSetApiRead),
  };
}

export function composeKnowledgeCollection(): KnowledgeCollectionRead {
  const disciplines = getDisciplines();
  const subjects = disciplines.flatMap((item) => getSubjectsByDisciplineId(item.id));
  const categories = subjects.flatMap((item) => getCategoriesBySubjectId(item.id));
  return { disciplines, subjects, categories };
}

export function composeLearnerReadResponse(
  profile: LearnerProfile,
  goals: readonly LearnerGoal[],
): LearnerReadResponse {
  return { profile, goals };
}

export function composeDefaultLearnerReadResponse(): LearnerReadResponse {
  return composeLearnerReadResponse(defaultLocalProfile(), []);
}

export function composeDefaultIdentityReadResponse(): IdentityReadResponse {
  return { identity: defaultIdentityRead() };
}

export function composePublicTopicAccess(topicId: string): EntitlementAccessRead {
  return decideAccess({ scope: "topic", targetId: topicId }, []);
}

export function platformReadSuccess<T>(data: T): PlatformReadSuccess<T> {
  return {
    success: true,
    contractVersion: CURRENT_PLATFORM_API_CONTRACT_VERSION,
    data,
  };
}

export function platformReadFailure(
  code: PlatformReadErrorCode,
  message: string,
): PlatformReadFailure {
  return {
    success: false,
    error: { code, message },
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function readTopic(query: GetTopicQuery): PlatformReadResult<TopicReadResponse> {
  if (!isNonEmptyString(query?.topicId)) {
    return platformReadFailure("invalid_request", "topicId is required");
  }
  const composed = composeTopicReadResponse(query.topicId.trim());
  if (!composed) {
    return platformReadFailure("not_found", "topic not found");
  }
  return platformReadSuccess(composed);
}

export function readTopics(query: GetTopicsQuery): PlatformReadResult<TopicCollectionRead> {
  if (query.categoryId !== undefined && !isNonEmptyString(query.categoryId)) {
    return platformReadFailure("invalid_request", "categoryId is invalid");
  }
  if (query.subjectId !== undefined && !isNonEmptyString(query.subjectId)) {
    return platformReadFailure("invalid_request", "subjectId is invalid");
  }
  if (query.categoryId !== undefined) {
    return platformReadSuccess({ items: getTopicsByCategoryId(query.categoryId.trim()) });
  }
  if (query.subjectId !== undefined) {
    const items = getCategoriesBySubjectId(query.subjectId.trim()).flatMap((category) =>
      getTopicsByCategoryId(category.id),
    );
    return platformReadSuccess({ items });
  }
  const items = composeKnowledgeCollection().categories.flatMap((category) =>
    getTopicsByCategoryId(category.id),
  );
  return platformReadSuccess({ items });
}

export function readSubjects(query: GetSubjectsQuery): PlatformReadResult<SubjectCollectionRead> {
  if (query.disciplineId !== undefined && !isNonEmptyString(query.disciplineId)) {
    return platformReadFailure("invalid_request", "disciplineId is invalid");
  }
  if (query.disciplineId !== undefined) {
    return platformReadSuccess({
      items: getSubjectsByDisciplineId(query.disciplineId.trim()),
    });
  }
  const items = getDisciplines().flatMap((item) => getSubjectsByDisciplineId(item.id));
  return platformReadSuccess({ items });
}

export function readCategories(
  query: GetCategoriesQuery,
): PlatformReadResult<CategoryCollectionRead> {
  if (query.subjectId !== undefined && !isNonEmptyString(query.subjectId)) {
    return platformReadFailure("invalid_request", "subjectId is invalid");
  }
  if (query.subjectId !== undefined) {
    return platformReadSuccess({ items: getCategoriesBySubjectId(query.subjectId.trim()) });
  }
  const items = composeKnowledgeCollection().subjects.flatMap((item) =>
    getCategoriesBySubjectId(item.id),
  );
  return platformReadSuccess({ items });
}
