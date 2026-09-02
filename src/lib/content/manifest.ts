import { assessmentSetId } from "@/lib/assessment/identity";
import { getRoutableCategoryHrefs, getSubject, knowledgeCatalog } from "@/lib/knowledge/catalog";
import { concepts, getConceptsByTopicId } from "@/lib/knowledge/concepts";
import { assertConceptReferences, validateTopicsAgainstCatalog } from "@/lib/knowledge/validate";
import { canonicalHref } from "./href";
import { defaultContentMetadata } from "./metadata";
import type { CanonicalTopic, ContentSource, ContentStatus } from "./types";
import { validateCanonicalManifest } from "./validate";

export type {
  CanonicalTopic,
  ContentLifecycle,
  ContentMetadata,
  ContentProvenance,
  ContentSource,
  ContentStatus,
} from "./types";
export { canonicalHref } from "./href";

/**
 * Identity strategy:
 *
 * Canonical id is `${subjectId}/${slug}`. Geography study pages remain
 * `/geography/[slug]`. BCS/English nested catalog pages remain `/bcs/[slug]`
 * and `/english/[slug]`. Future `/topics/[slug]` is not emitted here.
 *
 * Array index is not identity. Runtime UUIDs are not used. geography-data.ts
 * is not rewritten to inject ids.
 */

export function canonicalIdentityKey(topic: Pick<CanonicalTopic, "id">): string {
  return topic.id;
}

function entry(
  subject: string,
  slug: string,
  title: string,
  category: string,
  contentStatus: ContentStatus,
  contentSource: ContentSource,
): CanonicalTopic {
  const subjectRecord = getSubject(subject);
  if (!subjectRecord) {
    throw new Error(`Canonical content manifest: unknown subject ${subject}`);
  }
  const id = `${subject}/${slug}`;
  return {
    id,
    disciplineId: subjectRecord.disciplineId,
    subjectId: subject,
    subject,
    slug,
    title,
    category,
    categoryId: `${subject}/${category}`,
    contentStatus,
    contentSource,
    href: canonicalHref(subject, slug),
    conceptIds: getConceptsByTopicId(id).map((item) => item.id),
    contentMetadata: defaultContentMetadata(contentSource),
    assessmentSetIds:
      contentSource === "geography-data" && contentStatus === "available"
        ? [assessmentSetId(id, "mcq-practice")]
        : [],
  };
}

export const contentManifest: CanonicalTopic[] = validateTopicsAgainstCatalog(
  validateCanonicalManifest([
  // Geography — study payload remains in geography-data.ts.
  entry("geography", "earths-rotation", "Earth's Rotation", "physical-geography", "available", "geography-data"),
  entry("geography", "earths-revolution", "Earth's Revolution", "physical-geography", "available", "geography-data"),
  entry("geography", "latitude-and-longitude", "Latitude and Longitude", "physical-geography", "available", "geography-data"),
  entry("geography", "seasons", "Seasons", "physical-geography", "available", "geography-data"),
  entry("geography", "earths-interior", "Earth's Interior", "physical-geography", "available", "geography-data"),
  entry("geography", "plate-tectonics", "Plate Tectonics", "physical-geography", "available", "geography-data"),
  entry("geography", "earthquakes", "Earthquakes", "physical-geography", "available", "geography-data"),
  entry("geography", "volcanoes", "Volcanoes", "physical-geography", "available", "geography-data"),
  entry("geography", "rocks", "Rocks", "physical-geography", "available", "geography-data"),
  entry("geography", "weathering-and-erosion", "Weathering and Erosion", "physical-geography", "available", "geography-data"),
  entry("geography", "atmosphere", "Atmosphere", "physical-geography", "available", "geography-data"),
  entry("geography", "atmospheric-pressure", "Atmospheric Pressure", "physical-geography", "available", "geography-data"),
  entry("geography", "winds", "Winds", "physical-geography", "available", "geography-data"),
  entry("geography", "ocean-currents", "Ocean Currents", "physical-geography", "available", "geography-data"),
  entry("geography", "tides", "Tides", "physical-geography", "available", "geography-data"),

  entry("geography", "population-geography", "Population Geography", "human-geography", "available", "geography-data"),
  entry("geography", "population-density", "Population Density", "human-geography", "available", "geography-data"),
  entry("geography", "population-distribution", "Population Distribution", "human-geography", "available", "geography-data"),
  entry("geography", "migration", "Migration", "human-geography", "available", "geography-data"),
  entry("geography", "urbanization", "Urbanization", "human-geography", "available", "geography-data"),
  entry("geography", "rural-settlement", "Rural Settlement", "human-geography", "available", "geography-data"),
  entry("geography", "culture-and-geography", "Culture and Geography", "human-geography", "available", "geography-data"),
  entry("geography", "human-development", "Human Development", "human-geography", "available", "geography-data"),

  entry("geography", "agriculture", "Agriculture", "economic-geography", "available", "geography-data"),
  entry("geography", "industry", "Industry", "economic-geography", "available", "geography-data"),
  entry("geography", "resources", "Resources", "economic-geography", "available", "geography-data"),
  entry("geography", "energy-geography", "Energy Geography", "economic-geography", "available", "geography-data"),
  entry("geography", "transport-geography", "Transport Geography", "economic-geography", "available", "geography-data"),
  entry("geography", "trade-geography", "Trade Geography", "economic-geography", "available", "geography-data"),
  entry("geography", "globalization", "Globalization", "economic-geography", "available", "geography-data"),

  entry("geography", "ecosystem", "Ecosystem", "environmental-geography", "available", "geography-data"),
  entry("geography", "biodiversity", "Biodiversity", "environmental-geography", "available", "geography-data"),
  entry("geography", "climate-change", "Climate Change", "environmental-geography", "available", "geography-data"),
  entry("geography", "global-warming", "Global Warming", "environmental-geography", "available", "geography-data"),
  entry("geography", "environmental-pollution", "Environmental Pollution", "environmental-geography", "available", "geography-data"),
  entry("geography", "natural-hazards", "Natural Hazards", "environmental-geography", "available", "geography-data"),
  entry("geography", "disaster-management", "Disaster Management", "environmental-geography", "available", "geography-data"),
  entry("geography", "sustainable-development", "Sustainable Development", "environmental-geography", "available", "geography-data"),

  entry("geography", "location-of-bangladesh", "Location of Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "physiographic-divisions", "Physiographic Divisions", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "rivers-of-bangladesh", "Rivers of Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "ganges-brahmaputra-meghna-basin", "Ganges-Brahmaputra-Meghna Basin", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "climate-of-bangladesh", "Climate of Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "coastal-bangladesh", "Coastal Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "sundarbans", "Sundarbans", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "haor-and-wetland", "Haor and Wetland", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "natural-resources-of-bangladesh", "Natural Resources of Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "population-geography-of-bangladesh", "Population Geography of Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "urbanization-in-bangladesh", "Urbanization in Bangladesh", "geography-of-bangladesh", "available", "geography-data"),
  entry("geography", "climate-vulnerability-of-bangladesh", "Climate Vulnerability of Bangladesh", "geography-of-bangladesh", "available", "geography-data"),

  // BCS nested catalog pages (partial stubs; page copy stays in knowledge-data.ts).
  entry("bcs", "bangladesh-affairs", "Bangladesh Affairs", "core", "partial", "knowledge-data"),
  entry("bcs", "international-affairs", "International Affairs", "core", "partial", "knowledge-data"),
  entry("bcs", "geography-environment", "Geography & Environment", "core", "partial", "knowledge-data"),
  entry("bcs", "english", "English", "core", "partial", "knowledge-data"),
  entry("bcs", "bangla", "Bangla", "core", "partial", "knowledge-data"),
  entry("bcs", "science-ict", "Science & ICT", "core", "partial", "knowledge-data"),
  entry("bcs", "ethics-governance", "Ethics & Governance", "core", "partial", "knowledge-data"),

  // English nested catalog pages (partial stubs; page copy stays in knowledge-data.ts).
  entry("english", "grammar", "Grammar", "core", "partial", "knowledge-data"),
  entry("english", "vocabulary", "Vocabulary", "core", "partial", "knowledge-data"),
  entry("english", "literature", "Literature", "core", "partial", "knowledge-data"),
  entry("english", "ielts", "IELTS", "core", "partial", "knowledge-data"),
]),
  knowledgeCatalog,
);

assertConceptReferences(concepts, contentManifest);

export const contentManifestById: Readonly<Record<string, CanonicalTopic>> =
  Object.fromEntries(contentManifest.map((topic) => [topic.id, topic]));

export function getCanonicalTopic(id: string): CanonicalTopic | undefined {
  return contentManifestById[id];
}

export function requireCanonicalTopic(id: string): CanonicalTopic {
  const topic = contentManifestById[id];
  if (!topic) {
    throw new Error(`Canonical content manifest: unknown topic ${id}`);
  }
  return topic;
}

export function getCanonicalTopicsBySubject(subject: string): CanonicalTopic[] {
  return contentManifest.filter((topic) => topic.subject === subject);
}

export function getAvailableCanonicalTopics(): CanonicalTopic[] {
  return contentManifest.filter((topic) => topic.contentStatus === "available");
}

/** Slug lookup is last-resort; canonical lookup is by id (`subject/slug`). */
export function getCanonicalTopicBySlug(slug: string): CanonicalTopic | undefined {
  return contentManifest.find((topic) => topic.slug === slug);
}

/**
 * Geography category slugs are live `/geography/[category]` grouping routes.
 * BCS/English `core` categories have no href in the knowledge catalog.
 */
export function getGeographyGroupingHrefs(): string[] {
  return getRoutableCategoryHrefs("geography");
}
