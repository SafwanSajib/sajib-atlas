import type { MetadataRoute } from "next";

import { categoryPages } from "@/lib/knowledge-data";
import {
  contentManifest,
  getGeographyGroupingHrefs,
} from "@/lib/content/manifest";

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
    {
      url: `${BASE_URL}/dashboard`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/revision`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/ai`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const canonicalTopicRoutes: MetadataRoute.Sitemap = contentManifest.map(
    (topic) => ({
      url: `${BASE_URL}${topic.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
  );

  /*
   * Geography category grouping pages are live /geography/[category] routes.
   * They are not canonical study topics; hrefs are derived from unique
   * Geography category keys on the manifest.
   */
  const geographyGroupingRoutes: MetadataRoute.Sitemap =
    getGeographyGroupingHrefs().map((href) => ({
      url: `${BASE_URL}${href}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [...staticRoutes, ...canonicalTopicRoutes, ...geographyGroupingRoutes];
}
