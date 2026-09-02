import { contentManifest, requireCanonicalTopic } from "@/lib/content/manifest";
import { knowledgeCatalog } from "@/lib/knowledge/catalog";
import { isAnswerCorrect, nextScore } from "@/lib/assessment/scoring";
import {
  countCompletedCanonicalTopics,
  hasCompletionEntry,
  isTopicCompleted,
  normalizeCompletedTopicIds,
} from "./completion";
import { suggestNextAction } from "./intelligence";
import { calculateRevisionQueue } from "./revision";
import { parseLearnerState } from "./storage";
import type { LearnerState } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Learner completion verification failed: ${message}`);
}

export function runCompletionVerification(): string[] {
  const passed: string[] = [];
  const topic = requireCanonicalTopic("geography/earths-rotation");
  const empty: LearnerState = { mcqResults: [], completedTopics: [] };

  const ids = contentManifest.map((item) => item.id);
  const hrefs = contentManifest.map((item) => item.href);
  assert(ids.length > 0, "canonical manifest is non-empty");
  assert(new Set(ids).size === ids.length, "canonical IDs are unique");
  assert(new Set(hrefs).size === hrefs.length, "canonical hrefs are unique");
  passed.push("canonical IDs and hrefs are unique");

  const subjectIds = new Set(knowledgeCatalog.subjects.map((item) => item.id));
  const categoryIds = new Set(knowledgeCatalog.categories.map((item) => item.id));
  assert(subjectIds.size === knowledgeCatalog.subjects.length, "subject IDs are unique");
  assert(categoryIds.size === knowledgeCatalog.categories.length, "category IDs are unique");
  for (const topic of contentManifest) {
    assert(subjectIds.has(topic.subjectId), `topic ${topic.id} has a known subject`);
    assert(categoryIds.has(topic.categoryId), `topic ${topic.id} has a known category`);
    assert(topic.disciplineId.length > 0, `topic ${topic.id} has a discipline`);
  }
  const rotation = requireCanonicalTopic("geography/earths-rotation");
  assert(rotation.categoryId === "geography/physical-geography", "Earth's Rotation maps to Physical Geography");
  passed.push("topics reference known subject and category");

  assert(isAnswerCorrect({ answer: "A" }, "A") === true, "correct option matches");
  assert(isAnswerCorrect({ answer: "A" }, "a") === false, "correctness is case-sensitive");
  assert(isAnswerCorrect({ answer: "A" }, null) === false, "null selection is incorrect");
  assert(nextScore(0, true) === 1, "score increments by 1 when correct");
  assert(nextScore(4, false) === 4, "score unchanged when incorrect");
  passed.push("assessment scoring remains deterministic");

  assert(topic.id === "geography/earths-rotation", "canonical id is stable");
  passed.push("canonical topic ID remains stable");

  assert(!isTopicCompleted(empty, topic), "initial topic is incomplete");
  passed.push("initial topic is incomplete");

  const completed: LearnerState = {
    mcqResults: [],
    completedTopics: [topic.id],
  };
  assert(isTopicCompleted(completed, topic), "markTopicComplete marks it complete");
  passed.push("markTopicComplete marks it complete");

  const persisted = JSON.stringify(completed);
  const restored = parseLearnerState(persisted);
  assert(restored.completedTopics.includes(topic.id), "state persists");
  passed.push("state persists");
  assert(isTopicCompleted(restored, topic), "reload preserves completion");
  passed.push("refresh/reload preserves completion");

  const twice = normalizeCompletedTopicIds([topic.id, topic.id, topic.slug]);
  assert(twice.length === 1, "completing the same topic twice does not duplicate it");
  assert(twice[0] === topic.id, "duplicate collapse keeps canonical id");
  assert(hasCompletionEntry(completed, topic.id), "id is recognized as complete");
  assert(hasCompletionEntry(completed, topic.slug), "legacy slug is recognized as complete");
  passed.push("completing the same topic twice does not duplicate it");

  assert(countCompletedCanonicalTopics(completed) === 1, "dashboard count reflects completion");
  const legacy: LearnerState = { mcqResults: [], completedTopics: [topic.slug] };
  const migrated = parseLearnerState(JSON.stringify(legacy));
  assert(migrated.completedTopics.includes(topic.id), "legacy slug migrates to canonical id");
  assert(countCompletedCanonicalTopics(migrated) === 1, "legacy slug still counts as one topic");
  passed.push("dashboard count reflects completion");

  const weakCompleted: LearnerState = {
    completedTopics: [topic.id],
    mcqResults: [
      { topicSlug: topic.slug, correct: false, timestamp: 1 },
      { topicSlug: topic.slug, correct: false, timestamp: 2 },
      { topicSlug: topic.slug, correct: false, timestamp: 3 },
    ],
  };
  const queue = calculateRevisionQueue(weakCompleted);
  assert(
    queue.some((item) => item.topicId === topic.id),
    "revision still includes a completed weak topic",
  );
  assert(queue.every((item) => item.href.startsWith("/")), "revision hrefs are canonical routes");
  passed.push("revision state responds correctly");

  const next = suggestNextAction({ mcqResults: [], completedTopics: [topic.id] });
  assert(next.link !== topic.href, "next-action does not suggest the completed topic");
  passed.push("next-action skips completed topic");

  const corrupt = parseLearnerState("{not json");
  assert(corrupt.completedTopics.length === 0, "corrupt storage does not crash");
  const missing = parseLearnerState(null);
  assert(missing.mcqResults.length === 0, "missing storage is empty state");
  passed.push("storage tolerates missing and corrupt data");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-completion.ts");

if (executedFromCli) {
  const passed = runCompletionVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("LEARNER_COMPLETION_VERIFICATION: PASS");
}
