import type { MetadataRoute } from "next";

import {
  categoryPages,
  nestedPages,
} from "@/lib/knowledge-data";

import {
  geographyCategories,
  allGeographyTopics,
} from "@/lib/geography-data";

const BASE_URL = "https://sajibatlas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  /*
   * Main/static pages
   */
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

  /*
   * BCS / English nested pages
   */
  const nestedRoutes: MetadataRoute.Sitemap = Object.keys(nestedPages).map(
    (path) => ({
      url: `${BASE_URL}/${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  /*
   * Geography category pages
   *
   * Example:
   * /geography/physical-geography
   * /geography/human-geography
   * /geography/economic-geography
   */
  const geographyCategoryRoutes: MetadataRoute.Sitemap =
    geographyCategories.map((category) => ({
      url: `${BASE_URL}/geography/${category.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  /*
   * All individual Geography topic pages
   *
   * Example:
   * /geography/earths-rotation
   * /geography/plate-tectonics
   * /geography/rivers-of-bangladesh
   */
  const geographyTopicRoutes: MetadataRoute.Sitemap =
    allGeographyTopics.map((topic) => ({
      url: `${BASE_URL}/geography/${topic.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [
    ...staticRoutes,
    ...nestedRoutes,
    ...geographyCategoryRoutes,
    ...geographyTopicRoutes,
  ];
}