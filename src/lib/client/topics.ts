/**
 * Topic reads. Delegates to 1J compose and Entitlement decideAccess.
 * Does not copy Topic Engine or geography-data.
 */

import { readTopic, readTopics } from "@/lib/contracts/compose";
import type { GetTopicsQuery, TopicReadResponse } from "@/lib/contracts/api";
import type { TopicRead } from "@/lib/contracts/types";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import { createPlatformPage } from "@/lib/platform/page";
import type { PlatformPage, PlatformReadResult } from "@/lib/platform/types";
import { SEARCH_DEFAULT_LIMIT } from "@/lib/search/types";

function topicAllowed(topicId: string): boolean {
  return decideAccess(
    { scope: "topic", targetId: topicId, learnerId: LOCAL_LEARNER_ID },
    [],
  ).allowed;
}

export function clientReadTopic(topicId: string): PlatformReadResult<TopicReadResponse> {
  const result = readTopic({ topicId });
  if (!result.success) return result;
  if (!topicAllowed(topicId.trim())) {
    return platformFailure("invalid_request", "entitlement required");
  }
  return result;
}

export function clientReadTopics(
  query: GetTopicsQuery & { limit?: number } = {},
): PlatformReadResult<PlatformPage<TopicRead>> {
  const collected = readTopics({
    ...(query.subjectId !== undefined ? { subjectId: query.subjectId } : {}),
    ...(query.categoryId !== undefined ? { categoryId: query.categoryId } : {}),
  });
  if (!collected.success) return collected;
  const allowed = collected.data.items.filter((item) => topicAllowed(item.id));
  try {
    return platformSuccess(createPlatformPage(allowed, query.limit ?? SEARCH_DEFAULT_LIMIT));
  } catch {
    return platformFailure("validation_failure", "invalid limit");
  }
}
