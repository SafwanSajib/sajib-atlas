import { contentRegistry } from "@/content/registry";
import type { NormalizedTopic } from "@/types/topic";
import { normalizeTopic } from "@/lib/content/normalize";

export function getTopic(slug: string): NormalizedTopic | undefined {
  const source = contentRegistry.find((topic) => topic.slug === slug);
  return source ? normalizeTopic(source) : undefined;
}

export function getAllTopics(): NormalizedTopic[] {
  return contentRegistry.map(normalizeTopic);
}
