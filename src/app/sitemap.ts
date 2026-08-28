import type { MetadataRoute } from "next";
import { getAllTopics } from "@/lib/content/loaders/static-loader";

const BASE_URL = "https://sajibatlas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const topics = getAllTopics();
  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/subjects`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/topics`, changeFrequency: "weekly", priority: 0.9 },
    ...topics.map((topic) => ({ url: `${BASE_URL}/topics/${topic.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
