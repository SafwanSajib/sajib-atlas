import type { Domain } from "@/types/content";
import { motionsOfEarth } from "@/content/geography/motions-of-earth";

export const domains: Domain[] = [
  { slug: "geography", title: "Geography", description: "Earth systems, places, regions, and spatial thinking.", topicCount: 1 },
  { slug: "bcs", title: "BCS", description: "Exam intelligence, concepts, practice, and written preparation.", topicCount: 0 },
  { slug: "english-ielts", title: "English & IELTS", description: "Language, literature, communication, and test preparation.", topicCount: 0 },
  { slug: "international-affairs", title: "International Affairs", description: "Global systems, geopolitics, institutions, and current affairs.", topicCount: 0 },
];

export const contentRegistry = [motionsOfEarth];
