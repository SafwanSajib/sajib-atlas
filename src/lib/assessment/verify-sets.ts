import { geographyTopicsBySlug } from "@/lib/geography-data";
import { contentManifest, requireCanonicalTopic } from "@/lib/content/manifest";
import { searchTopics } from "@/lib/search-data";
import { isAnswerCorrect, nextScore } from "./scoring";
import {
  assessmentSets,
  getAssessmentSet,
  getAssessmentSetsByTopicId,
} from "./sets";
import type { AssessmentSet } from "./types";
import { validateAssessmentSetStructure } from "./validate";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assessment set verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Assessment set verification failed: expected throw (${label})`);
}

export function runAssessmentSetVerification(): string[] {
  const passed: string[] = [];
  const rotationId = "geography/earths-rotation";
  const rotationSetId = "geography/earths-rotation/mcq-practice";
  const rotation = requireCanonicalTopic(rotationId);
  const sets = getAssessmentSetsByTopicId(rotationId);
  const set = getAssessmentSet(rotationSetId);

  assert(rotation.id === rotationId, "topic id does not include assessment kind");
  assert(rotation.assessmentSetIds.length === 1, "Earth's Rotation has one assessment set id");
  assert(rotation.assessmentSetIds[0] === rotationSetId, "Earth's Rotation assessmentSetId is stable");
  assert(sets.length === 1 && sets[0]?.id === rotationSetId, "registry resolves Earth's Rotation set");
  assert(set?.kind === "mcq-practice", "assessment kind is mcq-practice");
  assert(set?.title === "MCQ Practice", "assessment set title is stable");
  assert(set?.payload.module === "geography-data", "payload pointer is geography-data");
  assert(set?.payload.field === "sections.mcqPractice", "payload field is sections.mcqPractice");
  assert(!("questions" in (set ?? {})), "assessment set does not embed questions");
  passed.push("Earth's Rotation assessment-set identity is stable");

  const payload = geographyTopicsBySlug["earths-rotation"]?.sections.mcqPractice;
  assert(Array.isArray(payload) && payload.length > 0, "Earth's Rotation MCQ payload still exists");
  assert(
    payload[0]?.question === "In which direction does the Earth rotate on its axis?",
    "first MCQ question wording is unchanged",
  );
  assert(
    payload[0]?.answer === "West to East",
    "first MCQ answer is unchanged",
  );
  assert(!("id" in (payload[0] ?? {})), "question identity remains unimplemented");
  passed.push("Geography MCQ payload remains in geography-data.ts");

  const bcs = requireCanonicalTopic("bcs/english");
  const english = requireCanonicalTopic("english/grammar");
  assert(bcs.assessmentSetIds.length === 0, "BCS stubs may have zero assessment sets");
  assert(english.assessmentSetIds.length === 0, "English stubs may have zero assessment sets");
  assert(getAssessmentSetsByTopicId("bcs/english").length === 0, "BCS registry lookup is empty");
  passed.push("topics may have zero assessment sets");

  const geographyAvailable = contentManifest.filter(
    (topic) => topic.subjectId === "geography" && topic.contentStatus === "available",
  );
  for (const topic of geographyAvailable) {
    assert(
      topic.assessmentSetIds[0] === `${topic.id}/mcq-practice`,
      `${topic.id} has mcq-practice identity`,
    );
  }
  assert(
    assessmentSets.length === geographyAvailable.length,
    "one mcq-practice set per Geography study topic",
  );
  passed.push("available Geography topics have mcq-practice identity");

  assert(isAnswerCorrect({ answer: "A" }, "A") === true, "correct option matches");
  assert(isAnswerCorrect({ answer: "A" }, "a") === false, "correctness is case-sensitive");
  assert(nextScore(0, true) === 1, "score increments by 1 when correct");
  assert(nextScore(4, false) === 4, "score unchanged when incorrect");
  passed.push("assessment scoring remains unchanged");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === rotationId),
    "search still matches Earth's Rotation by title/slug",
  );
  passed.push("search remains unchanged");

  const valid: AssessmentSet = {
    id: rotationSetId,
    topicId: rotationId,
    kind: "mcq-practice",
    title: "MCQ Practice",
    payload: { module: "geography-data", field: "sections.mcqPractice" },
  };
  expectThrow("duplicate id", () => validateAssessmentSetStructure([valid, { ...valid }]));
  expectThrow("id mismatch", () => validateAssessmentSetStructure([{ ...valid, id: "wrong" }]));
  expectThrow("invalid kind", () =>
    validateAssessmentSetStructure([{ ...valid, kind: "quiz", id: `${rotationId}/quiz` }]),
  );
  expectThrow("wrong payload field", () =>
    validateAssessmentSetStructure([
      { ...valid, payload: { module: "geography-data", field: "sections.overview" } },
    ]),
  );
  expectThrow("ownership mismatch", () =>
    validateAssessmentSetStructure([{ ...valid, topicId: "geography/seasons" }]),
  );
  passed.push("assessment-set validation rejects invalid identity");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-sets.ts");

if (executedFromCli) {
  const passed = runAssessmentSetVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_SET_VERIFICATION: PASS");
}
