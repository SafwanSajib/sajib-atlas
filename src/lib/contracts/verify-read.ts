import { assessmentSets } from "@/lib/assessment/sets";
import { contentManifest, requireCanonicalTopic } from "@/lib/content/manifest";
import { getCategory, getDiscipline, getSubject } from "@/lib/knowledge/catalog";
import { getConcept } from "@/lib/knowledge/concepts";
import { searchTopics } from "@/lib/search-data";
import {
  getAssessmentSetRead,
  getAssessmentSetsByTopicId,
  getCategoriesBySubjectId,
  getConceptRead,
  getConceptsByTopicId,
  getDisciplineRead,
  getDisciplines,
  getSubjectRead,
  getSubjectsByDisciplineId,
  getTopicRead,
  getTopicsByCategoryId,
} from "./read";


function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Read-contract verification failed: ${message}`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes to JSON`);
  const roundTrip = JSON.stringify(JSON.parse(serialized));
  assert(serialized === roundTrip, `${label} is JSON-roundtrippable`);
}

export function runReadContractVerification(): string[] {
  const passed: string[] = [];

  const disciplines = getDisciplines();
  assert(disciplines.some((item) => item.id === "geography"), "Geography discipline is readable");
  assert(getDisciplineRead("geography")?.title === "Geography", "discipline read matches catalog");
  const geoSubjects = getSubjectsByDisciplineId("geography");
  assert(geoSubjects.length === 1 && geoSubjects[0]?.id === "geography", "Geography has one subject");
  const geoCategories = getCategoriesBySubjectId("geography");
  assert(
    geoCategories.some((item) => item.id === "geography/physical-geography"),
    "Physical Geography category is readable",
  );
  passed.push("discipline → subject → category reads project the catalog");

  const rotationId = "geography/earths-rotation";
  const canonical = requireCanonicalTopic(rotationId);
  const rotation = getTopicRead(rotationId);
  assert(rotation !== undefined, "Earth's Rotation topic read exists");
  assert(rotation.id === rotationId, "Earth's Rotation id is unchanged");
  assert(rotation.href === "/geography/earths-rotation", "Earth's Rotation href is unchanged");
  assert(rotation.disciplineId === "geography", "discipline identity is present");
  assert(rotation.subjectId === "geography", "subject identity is present");
  assert(rotation.categoryId === "geography/physical-geography", "category identity is present");
  assert(rotation.contentStatus === "available", "contentStatus remains payload completeness");
  assert(rotation.contentMetadata.version === 1, "content metadata version is 1");
  assert(rotation.contentMetadata.lifecycle === "published", "content metadata lifecycle is published");
  assert(
    rotation.contentMetadata.sourceId === "module/geography-data",
    "provenance sourceId is unchanged",
  );
  assert(rotation.contentMetadata.updatedAt === undefined, "updatedAt remains unknown");
  assert(
    rotation.conceptIds[0] === "geography/earths-rotation/rotation",
    "concept identity refs are unchanged",
  );
  assert(
    rotation.assessmentSetIds[0] === "geography/earths-rotation/mcq-practice",
    "assessment-set identity is unchanged",
  );
  assert(!("sections" in rotation), "topic read does not embed Geography payload");
  assert(!("mcqPractice" in rotation), "topic read does not embed MCQ arrays");
  assert(!("subject" in rotation) || rotation.subjectId === canonical.subjectId, "no Phase 0 alias required");
  passed.push("Earth's Rotation topic read preserves identity, metadata, and refs");

  const concepts = getConceptsByTopicId(rotationId);
  assert(concepts.length === 4, "Earth's Rotation has four concept reads");
  assert(getConceptRead("geography/earths-rotation/axis")?.title === "Axis", "concept read resolves by id");
  const sets = getAssessmentSetsByTopicId(rotationId);
  assert(sets.length === 1, "Earth's Rotation has one assessment-set read");
  assert(sets[0]?.id === "geography/earths-rotation/mcq-practice", "assessment-set id is stable");
  assert(sets[0]?.payload.field === "sections.mcqPractice", "payload is a reference, not questions");
  assert(getAssessmentSetRead(sets[0].id)?.kind === "mcq-practice", "assessment-set kind is mcq-practice");
  passed.push("concept and assessment-set reads stay identity-only");

  const physicalTopics = getTopicsByCategoryId("geography/physical-geography");
  assert(
    physicalTopics.some((item) => item.id === rotationId),
    "category → topics includes Earth's Rotation",
  );
  passed.push("category → topic traversal works");

  const bcs = getTopicRead("bcs/english");
  assert(bcs !== undefined, "BCS English stub is readable");
  assert(bcs.contentStatus === "partial", "BCS stub remains partial");
  assert(bcs.conceptIds.length === 0, "BCS stub has zero concepts");
  assert(bcs.assessmentSetIds.length === 0, "BCS stub has zero assessment sets");
  const english = getTopicRead("english/grammar");
  assert(english !== undefined, "English grammar stub is readable");
  assert(english.conceptIds.length === 0, "English stub has zero concepts");
  assert(english.assessmentSetIds.length === 0, "English stub has zero assessment sets");
  passed.push("BCS and English stubs are representable with empty refs");

  for (const canonicalTopic of contentManifest) {
    const read = getTopicRead(canonicalTopic.id);
    assert(read !== undefined, `read model missing for ${canonicalTopic.id}`);
    assert(getDiscipline(read.disciplineId) !== undefined, `unknown discipline on ${read.id}`);
    assert(getSubject(read.subjectId) !== undefined, `unknown subject on ${read.id}`);
    assert(getCategory(read.categoryId) !== undefined, `unknown category on ${read.id}`);
    for (const conceptId of read.conceptIds) {
      assert(getConcept(conceptId) !== undefined, `missing concept ${conceptId}`);
    }
    for (const setId of read.assessmentSetIds) {
      assert(getAssessmentSetRead(setId) !== undefined, `missing assessment set ${setId}`);
    }
    assertJsonSafe(read, `topic ${read.id}`);
  }
  assertJsonSafe(getDisciplines(), "disciplines");
  assertJsonSafe(getSubjectsByDisciplineId("geography"), "subjects");
  assertJsonSafe(getCategoriesBySubjectId("bcs"), "BCS categories");
  const setReads = [];
  for (const item of assessmentSets) {
    const setRead = getAssessmentSetRead(item.id);
    assert(setRead !== undefined, `missing assessment-set read for ${item.id}`);
    setReads.push(setRead);
  }
  assertJsonSafe(setReads, "assessment-set reads");
  passed.push("all topic reads resolve catalog refs and are JSON-safe");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === rotationId),
    "search still matches Earth's Rotation by title/slug",
  );
  passed.push("search remains unchanged");

  assert(getTopicRead("missing/topic") === undefined, "unknown topic read is undefined");
  assert(getConceptRead("missing") === undefined, "unknown concept read is undefined");
  assert(getSubjectRead("missing") === undefined, "unknown subject read is undefined");
  passed.push("unknown ids return undefined");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-read.ts");

if (executedFromCli) {
  const passed = runReadContractVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("READ_CONTRACT_VERIFICATION: PASS");
}
