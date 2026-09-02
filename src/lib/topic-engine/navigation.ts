import { contentManifest } from "@/lib/content/manifest";
import { getCategory } from "@/lib/knowledge/catalog";
import type { TopicEngineNavigation, TopicEngineNeighbor } from "./types";

/**
 * Subject-independent topic navigation.
 *
 * Order is canonical-manifest order within a category. Geography payload
 * arrays are not imported. Category grouping hrefs come from the knowledge
 * catalog when a live grouping route exists.
 */

function toNeighbor(topic: {
  id: string;
  href: string;
  title: string;
  slug: string;
}): TopicEngineNeighbor {
  return {
    id: topic.id,
    href: topic.href,
    title: topic.title,
    slug: topic.slug,
  };
}

export function listCategoryTopicIds(categoryId: string): string[] {
  return contentManifest.filter((topic) => topic.categoryId === categoryId).map((topic) => topic.id);
}

export function composeTopicNavigation(topic: {
  id: string;
  categoryId: string;
}): TopicEngineNavigation {
  const categoryTopics = contentManifest.filter((item) => item.categoryId === topic.categoryId);
  const index = categoryTopics.findIndex((item) => item.id === topic.id);
  const previousTopic = index > 0 ? categoryTopics[index - 1] : undefined;
  const nextTopic =
    index >= 0 && index < categoryTopics.length - 1 ? categoryTopics[index + 1] : undefined;
  const siblingIds = categoryTopics
    .filter((item) => item.id !== topic.id)
    .map((item) => item.id);
  const category = getCategory(topic.categoryId);

  const navigation: TopicEngineNavigation = {
    parentCategoryId: topic.categoryId,
    siblingIds,
  };
  if (category?.href !== undefined) navigation.parentCategoryHref = category.href;
  if (previousTopic) navigation.previous = toNeighbor(previousTopic);
  if (nextTopic) navigation.next = toNeighbor(nextTopic);
  return navigation;
}
