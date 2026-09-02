import { contentManifest, getCanonicalTopic } from "@/lib/content/manifest";
import { searchTopics } from "@/lib/search-data";
import { composeTopicEngineModel, composeTopicEngineModelFromCanonical } from "./composition";
import { topicEngineFailure, topicEngineSuccess, type TopicEngineResult } from "./errors";
import { canonicalTopicId, parseTopicId, topicIdFromHref } from "./identity";
import { inspectTopicIdentityState, inspectTopicLifecycleState } from "./status";
import type {
  TopicEngineListQuery,
  TopicEngineModel,
  TopicIdentityState,
  TopicLifecycleInspect,
  TopicResolutionQuery,
} from "./types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeTopicResolutionQuery(
  query: TopicResolutionQuery,
): TopicEngineResult<string> {
  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    return topicEngineFailure("invalid_request", "resolution query must be an object");
  }

  const topicId = isNonEmptyString(query.topicId) ? query.topicId.trim() : undefined;
  const href = isNonEmptyString(query.href) ? query.href.trim() : undefined;
  const subjectId = isNonEmptyString(query.subjectId) ? query.subjectId.trim() : undefined;
  const slug = isNonEmptyString(query.slug) ? query.slug.trim() : undefined;

  const candidates: string[] = [];

  if (topicId !== undefined) {
    if (!parseTopicId(topicId)) {
      return topicEngineFailure("invalid_request", "topicId is not a canonical topic id");
    }
    candidates.push(topicId);
  }

  if (href !== undefined) {
    const fromHref = topicIdFromHref(href);
    if (!fromHref) {
      return topicEngineFailure("invalid_request", "href is not a canonical topic href");
    }
    candidates.push(fromHref);
  }

  if (subjectId !== undefined || slug !== undefined) {
    if (subjectId === undefined || slug === undefined) {
      return topicEngineFailure("invalid_request", "subjectId and slug must be provided together");
    }
    if (slug.includes("/")) {
      return topicEngineFailure("invalid_request", "slug must not contain a slash");
    }
    candidates.push(canonicalTopicId(subjectId, slug));
  }

  if (candidates.length === 0) {
    return topicEngineFailure("invalid_request", "topicId, href, or subjectId+slug is required");
  }

  const resolvedId = candidates[0];
  if (resolvedId === undefined) {
    return topicEngineFailure("invalid_request", "topicId, href, or subjectId+slug is required");
  }
  for (const candidate of candidates) {
    if (candidate !== resolvedId) {
      return topicEngineFailure("invalid_request", "resolution fields do not agree");
    }
  }

  return topicEngineSuccess(resolvedId);
}

export function resolveTopic(query: TopicResolutionQuery): TopicEngineResult<TopicEngineModel> {
  const normalized = normalizeTopicResolutionQuery(query);
  if (!normalized.ok) return normalized;
  const topic = composeTopicEngineModel(normalized.data);
  if (!topic) return topicEngineFailure("not_found", "topic not found");
  return topicEngineSuccess(topic);
}

/**
 * Identity existence is a state, not a content-status value.
 * Invalid id shape is `invalid_request`. Unknown valid ids are `absent`.
 */
export function inspectTopicIdentity(
  query: TopicResolutionQuery,
): TopicEngineResult<TopicIdentityState> {
  const normalized = normalizeTopicResolutionQuery(query);
  if (!normalized.ok) return normalized;
  return topicEngineSuccess(inspectTopicIdentityState(normalized.data));
}

/**
 * Content availability (`contentStatus`) and publication (`lifecycle`) are
 * independent. Absent identity does not carry either field.
 */
export function inspectTopicLifecycle(
  query: TopicResolutionQuery,
): TopicEngineResult<TopicLifecycleInspect> {
  const normalized = normalizeTopicResolutionQuery(query);
  if (!normalized.ok) return normalized;
  return topicEngineSuccess(inspectTopicLifecycleState(normalized.data));
}

export function resolveTopicById(topicId: string): TopicEngineModel | undefined {
  return composeTopicEngineModel(topicId);
}

export function listTopicEngineModels(query: TopicEngineListQuery = {}): TopicEngineModel[] {
  const disciplineId = isNonEmptyString(query.disciplineId) ? query.disciplineId.trim() : undefined;
  const subjectId = isNonEmptyString(query.subjectId) ? query.subjectId.trim() : undefined;
  const categoryId = isNonEmptyString(query.categoryId) ? query.categoryId.trim() : undefined;

  return contentManifest
    .filter((topic) => {
      if (categoryId !== undefined && topic.categoryId !== categoryId) return false;
      if (subjectId !== undefined && topic.subjectId !== subjectId) return false;
      if (disciplineId !== undefined && topic.disciplineId !== disciplineId) return false;
      return true;
    })
    .map(composeTopicEngineModelFromCanonical);
}

export function listTopicEngineModelsByDiscipline(disciplineId: string): TopicEngineModel[] {
  return listTopicEngineModels({ disciplineId });
}

export function listTopicEngineModelsBySubject(subjectId: string): TopicEngineModel[] {
  return listTopicEngineModels({ subjectId });
}

export function listTopicEngineModelsByCategory(categoryId: string): TopicEngineModel[] {
  return listTopicEngineModels({ categoryId });
}

/**
 * Search hook over the existing canonical-manifest substring index.
 * Does not replace `searchTopics` and does not add embeddings.
 */
export function searchTopicEngine(query: string): TopicEngineModel[] {
  return searchTopics(query)
    .map((hit) => getCanonicalTopic(hit.id))
    .filter((topic): topic is NonNullable<typeof topic> => topic !== undefined)
    .map(composeTopicEngineModelFromCanonical);
}
