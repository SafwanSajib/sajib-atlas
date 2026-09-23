import type { TopicRead } from "@/lib/contracts/types";
import { getTopicRead } from "@/lib/contracts/read";
import { getCanonicalTopic } from "./manifest";
import type { CanonicalTopic } from "./types";

export type PublishedTopicDelivery = {
  topic: TopicRead;
  contentVersion: number;
  conceptIds: readonly string[];
  assessmentSetIds: readonly string[];
};

export function projectPublishedTopicDelivery(topic: CanonicalTopic): PublishedTopicDelivery | undefined {
  if (!topic || topic.contentStatus !== "available" || topic.contentMetadata.lifecycle !== "published") {
    return undefined;
  }
  const read = getTopicRead(topic.id);
  if (!read || read.contentMetadata.lifecycle !== "published") return undefined;
  return {
    topic: read,
    contentVersion: read.contentMetadata.version,
    conceptIds: read.conceptIds,
    assessmentSetIds: read.assessmentSetIds,
  };
}

export function getPublishedTopicDelivery(topicId: string): PublishedTopicDelivery | undefined {
  const topic = getCanonicalTopic(topicId);
  return topic ? projectPublishedTopicDelivery(topic) : undefined;
}
