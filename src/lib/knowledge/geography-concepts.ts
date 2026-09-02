import { GEOGRAPHY_SUBJECT_ID } from "./geography";
import type { Concept } from "./types";

/**
 * Geography concept identity (Phase 1B proof-of-concept).
 *
 * One topic only: Earth's Rotation. Concepts are identity objects whose
 * titles/slugs are already represented in geography-data.ts for that topic.
 * This file does not import or copy the educational payload.
 */
function concept(topicSlug: string, slug: string, title: string): Concept {
  const topicId = `${GEOGRAPHY_SUBJECT_ID}/${topicSlug}`;
  return {
    id: `${topicId}/${slug}`,
    topicId,
    slug,
    title,
  };
}

export const geographyConcepts: Concept[] = [
  concept("earths-rotation", "rotation", "Rotation"),
  concept("earths-rotation", "axis", "Axis"),
  concept("earths-rotation", "day-and-night", "Day and Night"),
  concept("earths-rotation", "apparent-motion", "Apparent Motion"),
];
