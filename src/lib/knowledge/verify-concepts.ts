import { contentManifest, requireCanonicalTopic } from "@/lib/content/manifest";
import { getConceptsByTopicId, getConcept, concepts } from "./concepts";
import type { Concept } from "./types";
import {
  assertConceptReferences,
  assertConceptsBoundToTopics,
  validateConceptStructure,
} from "./validate";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Knowledge concept verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Knowledge concept verification failed: expected throw (${label})`);
}

export function runConceptVerification(): string[] {
  const passed: string[] = [];
  const topicIds = new Set(contentManifest.map((topic) => topic.id));

  assert(concepts.length === 4, "proof-of-concept catalog has four concepts");
  const ids = concepts.map((item) => item.id);
  assert(new Set(ids).size === ids.length, "concept IDs are unique");
  passed.push("concept IDs are unique");

  assertConceptReferences(concepts, contentManifest);
  for (const concept of concepts) {
    assert(topicIds.has(concept.topicId), `concept ${concept.id} binds to a canonical topic`);
    assert(
      concept.id === `${concept.topicId}/${concept.slug}`,
      `concept ${concept.id} uses topicId/slug identity`,
    );
    assert(concept.topicId === "geography/earths-rotation", "proof concepts belong to Earth's Rotation");
  }
  passed.push("concepts are topic-bound with deterministic ids");

  const rotationId = "geography/earths-rotation";
  const rotationConcepts = getConceptsByTopicId(rotationId);
  assert(rotationConcepts.length === 4, "Earth's Rotation has four concepts");
  assert(rotationConcepts[0]?.id === "geography/earths-rotation/rotation", "Rotation id is stable");
  assert(rotationConcepts[0]?.title === "Rotation", "Rotation title is stable");
  assert(rotationConcepts[1]?.id === "geography/earths-rotation/axis", "Axis id is stable");
  assert(rotationConcepts[1]?.title === "Axis", "Axis title is stable");
  assert(
    rotationConcepts[2]?.id === "geography/earths-rotation/day-and-night",
    "Day and Night id is stable",
  );
  assert(rotationConcepts[2]?.title === "Day and Night", "Day and Night title is stable");
  assert(
    rotationConcepts[3]?.id === "geography/earths-rotation/apparent-motion",
    "Apparent Motion id is stable",
  );
  assert(rotationConcepts[3]?.title === "Apparent Motion", "Apparent Motion title is stable");
  passed.push("Earth's Rotation concept identity is stable");

  const rotation = requireCanonicalTopic(rotationId);
  assert(
    rotation.conceptIds.length === 4,
    "manifest exposes four conceptIds for Earth's Rotation",
  );
  assert(
    rotation.conceptIds[0] === "geography/earths-rotation/rotation" &&
      rotation.conceptIds[1] === "geography/earths-rotation/axis" &&
      rotation.conceptIds[2] === "geography/earths-rotation/day-and-night" &&
      rotation.conceptIds[3] === "geography/earths-rotation/apparent-motion",
    "manifest conceptIds are identity references, not Concept objects",
  );
  passed.push("manifest exposes concept identity references");

  assert(getConcept("geography/earths-rotation/axis")?.title === "Axis", "getConcept resolves by id");
  assert(getConcept("missing/concept") === undefined, "unknown concept id returns undefined");
  passed.push("concept lookup is deterministic");

  assert(getConceptsByTopicId("bcs/english").length === 0, "BCS stub topics may have zero concepts");
  assert(
    getConceptsByTopicId("english/grammar").length === 0,
    "English stub topics may have zero concepts",
  );
  assert(
    getConceptsByTopicId("geography/earths-revolution").length === 0,
    "other Geography topics may have zero concepts",
  );
  assert(
    requireCanonicalTopic("geography/earths-revolution").conceptIds.length === 0,
    "topics without a concept seed expose an empty conceptIds list",
  );
  passed.push("topics may have zero concepts");

  const sample = concepts[0];
  assert(sample !== undefined, "sample concept exists");
  assert(!("href" in sample), "concepts have no href");
  assert(!("question" in sample), "concepts are not assessment objects");
  assert(!("sections" in sample), "concepts do not carry study payload");
  passed.push("concepts remain identity-only");

  const valid: Concept = {
    id: "geography/earths-rotation/rotation",
    topicId: "geography/earths-rotation",
    slug: "rotation",
    title: "Rotation",
  };
  expectThrow("empty concept id", () =>
    validateConceptStructure([{ ...valid, id: "   " }]),
  );
  expectThrow("empty topicId", () =>
    validateConceptStructure([{ ...valid, topicId: "", id: "/rotation" }]),
  );
  expectThrow("empty slug", () =>
    validateConceptStructure([{ ...valid, slug: "  " }]),
  );
  expectThrow("empty title", () =>
    validateConceptStructure([{ ...valid, title: "" }]),
  );
  expectThrow("duplicate concept id", () =>
    validateConceptStructure([valid, { ...valid }]),
  );
  expectThrow("id mismatch", () =>
    validateConceptStructure([{ ...valid, id: "wrong" }]),
  );
  expectThrow("slash in slug", () =>
    validateConceptStructure([{ ...valid, slug: "a/b", id: "geography/earths-rotation/a/b" }]),
  );
  expectThrow("unknown topicId", () =>
    assertConceptsBoundToTopics([valid], new Set(["geography/other"])),
  );
  expectThrow("missing concept reference", () =>
    assertConceptReferences(concepts, [
      { id: "geography/earths-rotation", conceptIds: ["geography/earths-rotation/missing"] },
    ]),
  );
  assertConceptsBoundToTopics([], topicIds);
  assertConceptReferences([], contentManifest.map((topic) => ({ id: topic.id, conceptIds: [] })));
  passed.push("concept validation rejects invalid identity");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-concepts.ts");

if (executedFromCli) {
  const passed = runConceptVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("KNOWLEDGE_CONCEPT_VERIFICATION: PASS");
}
