import { ANALYTICS_ENTITY_TYPES } from "@/lib/analytics/types";
import { searchTopics } from "@/lib/search-data";
import { parseLearnerState } from "@/store/learner/storage";
import { defaultLocalProfile, learnerGoalId, LOCAL_LEARNER_ID } from "./identity";
import { validateLearnerGoal, validateLearnerProfile } from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Learner profile verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Learner profile verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
}

export function runLearnerProfileVerification(): string[] {
  const passed: string[] = [];

  const profile = validateLearnerProfile(defaultLocalProfile());
  assert(profile.learnerId === LOCAL_LEARNER_ID, "local learner id is learner/local");
  const learnerId: string = profile.learnerId;
  const topicIdSample = "geography/earths-rotation";
  assert(learnerId !== topicIdSample, "learner id is not a topic id");
  assert(!learnerId.startsWith("evt_"), "learner id is not an analytics event id");
  assert(profile.displayName === undefined, "displayName is optional");
  assertJsonSafe(profile, "default profile");
  passed.push("local learner profile identity is stable and distinct");

  const named = validateLearnerProfile({
    learnerId: LOCAL_LEARNER_ID,
    displayName: "Atlas Learner",
    locale: "en",
    createdAt: "2026-09-02T12:00:00.000Z",
  });
  assert(named.displayName === "Atlas Learner", "optional displayName is kept");
  assert(named.locale === "en", "optional locale is kept");
  passed.push("optional profile fields remain optional");

  const study = validateLearnerGoal({
    id: learnerGoalId("study", "geography"),
    type: "study",
    status: "active",
    target: { subjectId: "geography" },
  });
  assert(study.id === "goal/study/geography", "study goal id is deterministic");
  assert(study.target.subjectId === "geography", "study goal references subject id");
  assert(!("topics" in study.target), "goal target does not embed subjects");

  const complete = validateLearnerGoal({
    id: learnerGoalId("complete", "geography/earths-rotation"),
    type: "complete",
    status: "active",
    target: { topicId: "geography/earths-rotation" },
  });
  assert(complete.status === "active", "goal status is independent of topic completion");
  assert(complete.target.topicId === "geography/earths-rotation", "complete goal uses topic id");

  const practice = validateLearnerGoal({
    id: learnerGoalId("practice", "geography/earths-rotation/mcq-practice"),
    type: "practice",
    status: "archived",
    target: {
      assessmentSetId: "geography/earths-rotation/mcq-practice",
      topicId: "geography/earths-rotation",
    },
  });
  assert(practice.target.assessmentSetId?.endsWith("/mcq-practice") === true, "practice goal uses set id");
  assertJsonSafe(study, "study goal");
  assertJsonSafe(complete, "complete goal");
  assertJsonSafe(practice, "practice goal");
  passed.push("goals reference canonical subject, topic, and assessment-set ids");

  expectThrow("empty learnerId", () => validateLearnerProfile({ learnerId: "  " }));
  expectThrow("topic id as learnerId", () =>
    validateLearnerProfile({ learnerId: "geography/earths-rotation" }),
  );
  expectThrow("email displayName", () =>
    validateLearnerProfile({ learnerId: LOCAL_LEARNER_ID, displayName: "user@example.com" }),
  );
  expectThrow("invalid locale", () =>
    validateLearnerProfile({ learnerId: LOCAL_LEARNER_ID, locale: "English" }),
  );
  expectThrow("unknown subject", () =>
    validateLearnerGoal({
      id: learnerGoalId("study", "history"),
      type: "study",
      status: "active",
      target: { subjectId: "history" },
    }),
  );
  expectThrow("unknown topic", () =>
    validateLearnerGoal({
      id: learnerGoalId("complete", "geography/missing"),
      type: "complete",
      status: "active",
      target: { topicId: "geography/missing" },
    }),
  );
  expectThrow("id mismatch", () =>
    validateLearnerGoal({
      id: "wrong",
      type: "complete",
      status: "active",
      target: { topicId: "geography/earths-rotation" },
    }),
  );
  expectThrow("date-only timestamp", () =>
    validateLearnerProfile({ learnerId: LOCAL_LEARNER_ID, createdAt: "2026-09-02" }),
  );
  passed.push("validation rejects invalid identity, PII-like names, and unknown targets");

  const keys = Object.keys(profile);
  assert(!keys.includes("email"), "profile has no email field");
  assert(!keys.includes("password"), "profile has no password field");
  assert(!keys.includes("phone"), "profile has no phone field");
  const analyticsEntityTypes: readonly string[] = ANALYTICS_ENTITY_TYPES;
  assert(!analyticsEntityTypes.includes("learner"), "analytics still has no learner entity type");
  passed.push("profile remains separate from analytics and contains no PII fields");

  const persisted = parseLearnerState(
    JSON.stringify({
      mcqResults: [{ topicSlug: "earths-rotation", correct: true, timestamp: 1 }],
      completedTopics: ["geography/earths-rotation"],
    }),
  );
  assert(persisted.completedTopics[0] === "geography/earths-rotation", "completion storage still parses");
  assert(persisted.mcqResults.length === 1, "MCQ results still parse");
  assert(!("learnerId" in persisted), "completion state does not include profile");
  assert(!("goals" in persisted), "completion state does not include goals");
  passed.push("existing learner completion storage remains compatible");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === "geography/earths-rotation"),
    "search still matches Earth's Rotation",
  );
  passed.push("search remains unchanged");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-profile.ts");

if (executedFromCli) {
  const passed = runLearnerProfileVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("LEARNER_PROFILE_VERIFICATION: PASS");
}
