import { curriculumRegistry } from "@/lib/curriculum-registry";

export function searchTopics(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return curriculumRegistry.filter((item) => 
    item.title.toLowerCase().includes(normalizedQuery) || 
    item.slug.toLowerCase().includes(normalizedQuery)
  );
}
