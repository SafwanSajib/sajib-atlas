import { geographyConcepts } from "./geography-concepts";
import type { Concept } from "./types";
import { validateConceptStructure } from "./validate";

/**
 * Concept registry (Phase 1B).
 *
 * Subject-independent contract. Geography is the first implementation.
 * BCS/English catalog stubs have zero concepts.
 *
 * Does not import React, learner state, assessment, or geography-data.ts.
 * Topic-id existence is bound in the canonical manifest so this file
 * does not import content/ (avoids a catalog ↔ manifest cycle).
 */

export type { Concept };

export const concepts: readonly Concept[] = validateConceptStructure(geographyConcepts);

export const conceptsById: Readonly<Record<string, Concept>> = Object.fromEntries(
  concepts.map((item) => [item.id, item]),
);

const conceptsGroupedByTopicId: Record<string, Concept[]> = {};
for (const item of concepts) {
  const group = conceptsGroupedByTopicId[item.topicId];
  if (group) group.push(item);
  else conceptsGroupedByTopicId[item.topicId] = [item];
}

export const conceptsByTopicId: Readonly<Record<string, readonly Concept[]>> =
  conceptsGroupedByTopicId;

export function getConcept(id: string): Concept | undefined {
  return conceptsById[id];
}

/**
 * Concepts attached to a canonical topic, in declaration order.
 * Returns an empty array when the topic has none.
 */
export function getConceptsByTopicId(topicId: string): readonly Concept[] {
  return conceptsByTopicId[topicId] ?? [];
}
