import { allGeographyTopics, type GeographyTopic } from "@/lib/geography-data";

export function searchTopics(query: string): GeographyTopic[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return allGeographyTopics.filter((topic) => [topic.title, topic.shortDescription, topic.category, ...topic.tags].join(" ").toLowerCase().includes(normalizedQuery));
}
