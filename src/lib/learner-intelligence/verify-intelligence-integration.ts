import { readFileSync } from "node:fs";
import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { runLearnerProfileVerification } from "@/lib/learner/verify-profile";
import { runCompletionVerification } from "@/store/learner/verify-completion";
import { parseLearnerState } from "@/store/learner/storage";
import { runAssessmentIntegrationVerification } from "@/lib/assessment-engine/verify-integration";
import type { AssessmentResult, McqQuestionOutcome } from "@/lib/assessment-engine/types";
import {
  applyLearnerIntelligenceUpdate,
  deriveLearnerQuestionPerformance,
  derivePerformanceState,
  emptyLearnerIntelligenceState,
  ingestAssessmentResult,
  LEARNER_PERFORMANCE_THRESHOLDS,
} from "./index";
import { runLearnerIntelligenceVerification } from "./verify-intelligence";
import type { LearnerIntelligenceResult, LearnerIntelligenceUpdate } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Learner-intelligence-integration verification failed: ${message}`);
}

function expectSuccess(
  result: LearnerIntelligenceResult<LearnerIntelligenceUpdate>,
  message: string,
): LearnerIntelligenceUpdate {
  assert(result.ok, `${message}: expected success`);
  return result.data;
}

function importedModules(source: string): string[] {
  const imports: string[] = [];
  const re = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    imports.push(match[1]);
    match = re.exec(source);
  }
  return imports;
}

const SET_A = "example-subject/example-topic/mcq-practice";
const SET_B = "example-subject/example-topic/drill";
const TOPIC = "example-subject/example-topic";

function outcome(
  setId: string,
  version: number,
  ordinal: number,
  correct: boolean,
  selected: string | null,
): McqQuestionOutcome {
  return {
    questionKey: { assessmentSetId: setId, contentVersion: version, ordinal },
    modality: "mcq",
    correct,
    selectedOption: selected,
  };
}

function result(input: {
  sessionId: string;
  assessmentSetId: string;
  contentVersion?: number;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  outcomes: McqQuestionOutcome[];
}): AssessmentResult {
  return {
    assessmentSetId: input.assessmentSetId,
    contentVersion: input.contentVersion ?? 1,
    sessionId: input.sessionId,
    total: input.total,
    answered: input.answered,
    correct: input.correct,
    incorrect: input.incorrect,
    unanswered: input.unanswered,
    score: input.correct,
    percentage: input.total > 0 ? (input.correct / input.total) * 100 : 0,
    status: "completed",
    outcomes: input.outcomes,
  };
}

export function runLearnerIntelligenceIntegrationVerification(): string[] {
  const passed: string[] = [];

  assert(LOCAL_LEARNER_ID === "learner/local", "canonical learner identity is learner/local");
  const parsedSet = parseAssessmentSetId(SET_A);
  assert(parsedSet?.topicId === TOPIC, "topic identity comes from parseAssessmentSetId");
  assert(parsedSet?.kind === "mcq-practice", "assessment kind is the trailing set segment");
  passed.push("canonical learner identity and topic identity");

  const mix = result({
    sessionId: "gate-session-a",
    assessmentSetId: SET_A,
    total: 3,
    answered: 2,
    correct: 1,
    incorrect: 1,
    unanswered: 1,
    outcomes: [
      outcome(SET_A, 1, 0, true, "A"),
      outcome(SET_A, 1, 1, false, "B"),
      outcome(SET_A, 1, 2, false, null),
    ],
  });
  const previous = emptyLearnerIntelligenceState();
  const previousSnapshot = JSON.stringify(previous);
  const ingested = expectSuccess(
    ingestAssessmentResult(mix, { completedAt: "2026-09-02T10:00:00.000Z" }, previous),
    "ingest mix",
  );
  assert(JSON.stringify(previous) === previousSnapshot, "ingest does not mutate previous intelligence state");
  assert(ingested.state.learnerId === "learner/local", "ingested learnerId is canonical");
  const topic = ingested.snapshot.topicProgress[0];
  assert(topic !== undefined, "topic progress exists");
  assert(topic.topicId === TOPIC, "topicId is canonical");
  assert(topic.questionsAnswered + topic.questionsUnanswered === 3, "answered + unanswered = total");
  assert(topic.questionsCorrect + topic.questionsIncorrect === topic.questionsAnswered, "correct + incorrect = answered");
  assert(topic.percentage === (1 / 3) * 100, "topic percentage is correct/total, not an assessment average");
  assert(ingested.snapshot.overallProgress.accuracy === (1 / 2) * 100, "overall accuracy is correct/answered");
  passed.push("AssessmentResult-only ingestion and weighted aggregation");

  assert(derivePerformanceState(1, 59.99) === "active", "59.99 is active");
  assert(derivePerformanceState(1, 60) === "developing", "60 is developing");
  assert(derivePerformanceState(1, 79.99) === "developing", "79.99 is developing");
  assert(derivePerformanceState(1, 80) === "strong", "80 is strong");
  assert(LEARNER_PERFORMANCE_THRESHOLDS.developingAt === 60, "developing threshold is 60");
  assert(LEARNER_PERFORMANCE_THRESHOLDS.strongAt === 80, "strong threshold is 80");
  passed.push("performance thresholds including 59.99/60/79.99/80");

  const highScore = expectSuccess(
    ingestAssessmentResult(mix, { completedAt: "2026-09-02T10:00:00.000Z", completedTopicIds: [] }),
    "high score without completion",
  );
  assert(highScore.snapshot.topicProgress[0]?.isCompleted === false, "score does not mark the topic complete");
  const completedFlag = expectSuccess(
    ingestAssessmentResult(mix, {
      completedAt: "2026-09-02T10:00:00.000Z",
      completedTopicIds: [TOPIC],
    }),
    "completion flag",
  );
  assert(completedFlag.snapshot.topicProgress[0]?.isCompleted === true, "isCompleted reads completedTopics");
  passed.push("completion remains separate from performance");

  const record = ingested.state.assessments[0];
  assert(record?.sessionId === "gate-session-a", "sessionId preserved");
  assert(record?.assessmentSetId === SET_A, "assessmentSetId preserved");
  assert(record?.topicId === TOPIC, "topicId preserved");
  assert(record?.contentVersion === 1, "contentVersion preserved");
  assert(record?.completedAt === "2026-09-02T10:00:00.000Z", "completedAt preserved");
  passed.push("assessment performance identity is preserved");

  const v2 = result({
    sessionId: "gate-session-v2",
    assessmentSetId: SET_A,
    contentVersion: 2,
    total: 1,
    answered: 1,
    correct: 1,
    incorrect: 0,
    unanswered: 0,
    outcomes: [outcome(SET_A, 2, 0, true, "A")],
  });
  const versioned = expectSuccess(
    ingestAssessmentResult(v2, { completedAt: "2026-09-02T11:00:00.000Z" }, ingested.state),
    "ingest v2",
  );
  const v1Rows = versioned.state.assessments.filter((item) => item.sessionId === "gate-session-a");
  const v2Rows = versioned.state.assessments.filter((item) => item.sessionId === "gate-session-v2");
  assert(v1Rows[0]?.contentVersion === 1 && v2Rows[0]?.contentVersion === 2, "v1 and v2 remain distinct rows");
  assert(versioned.snapshot.topicProgress.length === 1, "topic aggregate combines versions");
  passed.push("contentVersion rows stay distinct while topic aggregate combines them");

  const setB = result({
    sessionId: "gate-session-b",
    assessmentSetId: SET_B,
    total: 1,
    answered: 1,
    correct: 0,
    incorrect: 1,
    unanswered: 0,
    outcomes: [outcome(SET_B, 1, 0, false, "B")],
  });
  const multi = expectSuccess(
    ingestAssessmentResult(setB, { completedAt: "2026-09-02T12:00:00.000Z" }, ingested.state),
    "second set",
  );
  assert(multi.state.assessments.length === 2, "two assessment performances");
  assert(multi.snapshot.topicProgress.length === 1, "one topic progress row");
  assert(new Set(multi.state.assessments.map((item) => item.sessionId)).size === 2, "retention is unique by sessionId");
  const again = expectSuccess(
    ingestAssessmentResult(mix, { completedAt: "2026-09-02T10:00:00.000Z" }, multi.state),
    "duplicate session",
  );
  assert(again.ingested === false, "second ingest of same sessionId is not counted");
  assert(again.state.assessments.length === 2, "duplicate does not grow retention");
  passed.push("multiple sets per topic and sessionId idempotency/retention");

  assert(multi.snapshot.updatedAt === "2026-09-02T12:00:00.000Z", "last activity is latest completedAt");
  const laterFirst = expectSuccess(
    ingestAssessmentResult(setB, { completedAt: "2026-09-02T12:00:00.000Z" }),
    "order B first",
  );
  const laterSecond = expectSuccess(
    ingestAssessmentResult(mix, { completedAt: "2026-09-02T10:00:00.000Z" }, laterFirst.state),
    "order A second",
  );
  assert(
    laterSecond.snapshot.overallProgress.questionsCorrect === multi.snapshot.overallProgress.questionsCorrect,
    "order-independent correct count",
  );
  assert(laterSecond.snapshot.updatedAt === "2026-09-02T12:00:00.000Z", "latest completedAt wins regardless of ingest order");
  passed.push("lastActivityAt and order independence");

  const questions = deriveLearnerQuestionPerformance(v2, "2026-09-02T11:00:00.000Z");
  assert(questions[0]?.questionKey.contentVersion === 2, "question key remains version-scoped");
  assert(questions[0]?.questionKey.assessmentSetId === SET_A, "question key keeps assessmentSetId");
  assert(questions[0]?.questionKey.ordinal === 0, "question key keeps ordinal");
  assert(!("id" in (questions[0] ?? {})), "no eternal question id");
  passed.push("question-level identity is version-scoped");

  const originalMcq = [{ topicSlug: "example-topic", correct: true, timestamp: 1 }];
  const originalCompleted = [TOPIC, "example-subject/other-topic"];
  const originalState = { mcqResults: originalMcq, completedTopics: originalCompleted };
  const originalJson = JSON.stringify(originalState);
  const merged = applyLearnerIntelligenceUpdate(originalState, ingested);
  assert(JSON.stringify(originalState) === originalJson, "apply does not mutate the original learner state");
  assert(JSON.stringify(merged.mcqResults) === JSON.stringify(originalMcq), "mcqResults preserved exactly");
  assert(JSON.stringify(merged.completedTopics) === JSON.stringify(originalCompleted), "completedTopics preserved exactly");
  passed.push("state merge preserves mcqResults and completedTopics");

  const legacy = parseLearnerState(
    JSON.stringify({
      mcqResults: [{ topicSlug: "earths-rotation", correct: false, timestamp: 2 }],
      completedTopics: ["geography/earths-rotation"],
    }),
  );
  assert(legacy.intelligence === undefined, "legacy state has no intelligence");
  const badIntel = parseLearnerState(
    JSON.stringify({
      mcqResults: [{ topicSlug: "earths-rotation", correct: false, timestamp: 2 }],
      completedTopics: ["geography/earths-rotation"],
      intelligence: { learnerId: "learner/local" },
    }),
  );
  assert(badIntel.mcqResults.length === 1, "malformed intelligence keeps mcqResults");
  assert(badIntel.completedTopics.includes("geography/earths-rotation"), "malformed intelligence keeps completedTopics");
  passed.push("legacy state compatibility and malformed intelligence safety");

  const snapshotJson = JSON.stringify(ingested.snapshot);
  const stateJson = JSON.stringify(ingested.state);
  assert(JSON.stringify(JSON.parse(snapshotJson)) === snapshotJson, "snapshot JSON round-trip");
  assert(JSON.stringify(JSON.parse(stateJson)) === stateJson, "state JSON round-trip");
  const topicJson = JSON.stringify(topic);
  const assessmentJson = JSON.stringify(record);
  assert(JSON.stringify(JSON.parse(topicJson)) === topicJson, "topic progress JSON round-trip");
  assert(JSON.stringify(JSON.parse(assessmentJson)) === assessmentJson, "assessment performance JSON round-trip");
  const twice = expectSuccess(
    ingestAssessmentResult(mix, { completedAt: "2026-09-02T10:00:00.000Z" }),
    "determinism second run",
  );
  assert(JSON.stringify(twice.snapshot) === JSON.stringify(ingested.snapshot), "identical ingest is deterministic");
  passed.push("JSON round-trip and deterministic output");

  const runtime = [
    "src/lib/learner-intelligence/types.ts",
    "src/lib/learner-intelligence/performance.ts",
    "src/lib/learner-intelligence/derive.ts",
    "src/lib/learner-intelligence/ingest.ts",
    "src/lib/learner-intelligence/adapter.ts",
    "src/lib/learner-intelligence/index.ts",
  ];
  for (const path of runtime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} has no Geography payload import`);
      assert(specifier !== "react", `${path} has no React`);
      assert(!specifier.includes("lib/analytics"), `${path} has no analytics`);
      assert(!specifier.includes("lib/entitlement"), `${path} has no entitlement`);
      assert(!specifier.includes("lib/commerce"), `${path} has no commerce`);
      assert(!specifier.includes("lib/contracts"), `${path} has no API contracts`);
      assert(!specifier.includes("components/assessment"), `${path} does not import MCQPractice`);
      assert(!specifier.includes("lib/learner/types") || specifier.includes("identity"), `${path} does not import goal types`);
    }
    assert(!source.includes("window."), `${path} has no window`);
    assert(!source.includes("document."), `${path} has no document`);
    assert(!source.includes("fetch("), `${path} has no fetch`);
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not duplicate scoring`);
    assert(!source.includes("scoreMcqAssessment"), `${path} does not invoke the scorer`);
    assert(!source.includes("LearnerGoal"), `${path} does not mutate or redefine goals`);
    assert(!source.includes("openai") && !source.includes("OpenAI") && !source.includes("embeddings"), `${path} has no AI`);
  }
  passed.push("purity and domain separations (Geography, scoring, analytics, entitlement, commerce, API, AI, UI, goals)");

  const intelligencePasses = runLearnerIntelligenceVerification();
  assert(intelligencePasses.length > 0, "Phase 4 intelligence verifier still returns passes");
  const completionPasses = runCompletionVerification();
  assert(completionPasses.length > 0, "existing learner completion verifier still returns passes");
  const profilePasses = runLearnerProfileVerification();
  assert(profilePasses.length > 0, "existing learner profile verifier still returns passes");
  const assessmentPasses = runAssessmentIntegrationVerification();
  assert(assessmentPasses.length > 0, "Assessment Engine integration verifier still returns passes");
  passed.push("existing learner and assessment verifiers still pass");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-intelligence-integration.ts");

if (executedFromCli) {
  const passed = runLearnerIntelligenceIntegrationVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("LEARNER_INTELLIGENCE_INTEGRATION_VERIFICATION: PASS");
}
