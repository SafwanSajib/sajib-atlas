import {
  contentManifest,
  getCanonicalTopic,
  getCanonicalTopicBySlug,
  type CanonicalTopic,
} from "@/lib/content/manifest";
import type { LearnerState } from "./types";

type TopicIdentity = Pick<CanonicalTopic, "id" | "slug">;

/**
 * Completion is stored as canonical topic id (`subject/slug`).
 * Legacy entries may be a bare slug; both forms count as complete.
 */
export function isTopicCompleted(
  state: LearnerState,
  topic: TopicIdentity,
): boolean {
  return (
    state.completedTopics.includes(topic.id) ||
    state.completedTopics.includes(topic.slug)
  );
}

export function hasCompletionEntry(
  state: LearnerState,
  topicId: string,
): boolean {
  if (state.completedTopics.includes(topicId)) return true;
  const separator = topicId.indexOf("/");
  if (separator >= 0) {
    return state.completedTopics.includes(topicId.slice(separator + 1));
  }
  return contentManifest.some(
    (topic) => topic.slug === topicId && isTopicCompleted(state, topic),
  );
}

/**
 * Deterministic compatibility pass:
 * known slugs become canonical ids; duplicates collapse; unknown strings are kept.
 */
export function normalizeCompletedTopicIds(entries: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const topic = getCanonicalTopic(trimmed) ?? getCanonicalTopicBySlug(trimmed);
    const id = topic?.id ?? trimmed;
    if (seen.has(id)) continue;
    seen.add(id);
    if (topic) seen.add(topic.slug);
    normalized.push(id);
  }

  return normalized;
}

/** Count only topics that exist in the canonical manifest. */
export function countCompletedCanonicalTopics(state: LearnerState): number {
  return contentManifest.filter((topic) => isTopicCompleted(state, topic)).length;
}
