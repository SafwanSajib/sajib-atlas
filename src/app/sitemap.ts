import type { MetadataRoute } from "next";
import { categoryPages, nestedPages } from "@/lib/knowledge-data";

const BASE_URL = "https://sajibatlas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...Object.values(categoryPages)
      .filter((page) => page.slug !== "explore")
      .map((page) => ({
        url: `${BASE_URL}/${page.slug}`,
        changeFrequency: "weekly" as const,
        priority: page.slug === "about" ? 0.5 : 0.9,
      })),
    {
      url: `${BASE_URL}/explore`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const nestedRoutes: MetadataRoute.Sitemap = Object.keys(nestedPages).map(
    (path) => ({
      url: `${BASE_URL}/${path}`,
      changeFrequency: "monthly",
      priority: 0.8,
    })
  );

  return [...staticRoutes, ...nestedRoutes];
}