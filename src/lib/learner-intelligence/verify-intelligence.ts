import { readFileSync } from "node:fs";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import type { AssessmentResult, McqQuestionOutcome } from "@/lib/assessment-engine/types";
import { parseLearnerState } from "@/store/learner/storage";
import {
  applyLearnerIntelligenceUpdate,
  deriveLearnerIntelligenceSnapshot,
  derivePerformanceState,
  emptyLearnerIntelligenceState,
  ingestAssessmentResult,
  intelligenceFromLearnerState,
  LEARNER_PERFORMANCE_THRESHOLDS,
} from "./index";
import type { LearnerIntelligenceResult, LearnerIntelligenceUpdate } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Learner-intelligence verification failed: ${message}`);
}

function expectSuccess(
  result: LearnerIntelligenceResult<LearnerIntelligenceUpdate>,
  message: string,
): LearnerIntelligenceUpdate {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectFailure(
  result: LearnerIntelligenceResult<LearnerIntelligenceUpdate>,
  code: string,
  message: string,
): void {
  assert(!result.ok, `${message}: expected failure`);
  if (result.ok) return;
  assert(result.error.code === code, `${message}: expected ${code}, got ${result.error.code}`);
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
const OTHER_SET = "example-subject/other-topic/mcq-practice";
const OTHER_TOPIC = "example-subject/other-topic";

function outcome(setId: string, version: number, ordinal: number, correct: boolean, selected: string | null): McqQuestionOutcome {
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
  status?: AssessmentResult["status"];
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
    status: input.status ?? "completed",
    outcomes: input.outcomes,
  };
}

function twoQuestionMix(sessionId: string, setId = SET_A): AssessmentResult {
  return result({
    sessionId,
    assessmentSetId: setId,
    total: 2,
    answered: 2,
    correct: 1,
    incorrect: 1,
    unanswered: 0,
    outcomes: [
      outcome(setId, 1, 0, true, "A"),
      outcome(setId, 1, 1, false, "B"),
    ],
  });
}

export function runLearnerIntelligenceVerification(): string[] {
  const passed: string[] = [];

  assert(LOCAL_LEARNER_ID === "learner/local", "canonical learner id is learner/local");
  const empty = emptyLearnerIntelligenceState();
  assert(empty.learnerId === "learner/local", "empty intelligence uses learner/local");
  passed.push("learnerId = learner/local");

  const first = expectSuccess(
    ingestAssessmentResult(twoQuestionMix("session-a"), { completedAt: "2026-09-02T12:00:00.000Z" }),
    "ingest first result",
  );
  assert(first.ingested === true, "first ingest is recorded");
  assert(first.state.learnerId === "learner/local", "state learnerId is canonical");
  const assessment = first.state.assessments[0];
  assert(assessment !== undefined, "assessment performance exists");
  assert(assessment.assessmentSetId === SET_A, "assessmentSetId is preserved");
  assert(assessment.sessionId === "session-a", "sessionId is preserved");
  assert(assessment.contentVersion === 1, "contentVersion is preserved");
  assert(assessment.topicId === TOPIC, "topic identity is parsed from the assessment-set id");
  assert(first.snapshot.topicProgress[0]?.assessmentsCompleted === 1, "assessment count increments");
  assert(first.snapshot.topicProgress[0]?.questionsAnswered === 2, "answered count increments");
  assert(first.snapshot.topicProgress[0]?.questionsCorrect === 1, "correct count increments");
  assert(first.snapshot.topicProgress[0]?.questionsIncorrect === 1, "incorrect count increments");
  assert(first.snapshot.topicProgress[0]?.questionsUnanswered === 0, "unanswered count is preserved");
  assert(first.snapshot.topicProgress[0]?.score === 1, "cumulative score increments by correct");
  passed.push("valid result ingestion preserves identities and increments counters");

  const duplicate = expectSuccess(
    ingestAssessmentResult(twoQuestionMix("session-a"), { completedAt: "2026-09-02T12:00:00.000Z" }, first.state),
    "ingest same sessionId",
  );
  assert(duplicate.ingested === false, "duplicate sessionId is not ingested");
  assert(duplicate.state.assessments.length === 1, "duplicate does not append");
  assert(JSON.stringify(duplicate.snapshot) === JSON.stringify(first.snapshot), "duplicate snapshot is unchanged");
  passed.push("repeated same sessionId is idempotent");

  const secondMix = result({
    sessionId: "session-b",
    assessmentSetId: OTHER_SET,
    total: 4,
    answered: 4,
    correct: 1,
    incorrect: 3,
    unanswered: 0,
    outcomes: [
      outcome(OTHER_SET, 1, 0, true, "A"),
      outcome(OTHER_SET, 1, 1, false, "B"),
      outcome(OTHER_SET, 1, 2, false, "C"),
      outcome(OTHER_SET, 1, 3, false, "D"),
    ],
  });
  const combined = expectSuccess(
    ingestAssessmentResult(secondMix, { completedAt: "2026-09-02T13:00:00.000Z" }, first.state),
    "ingest second independent result",
  );
  assert(combined.state.assessments.length === 2, "two independent results are stored");
  assert(combined.snapshot.overallProgress.questionsCorrect === 2, "overall correct is 2");
  assert(combined.snapshot.overallProgress.questionsAnswered === 6, "overall answered is 6");
  assert(combined.snapshot.overallProgress.accuracy === (2 / 6) * 100, "overall accuracy is weighted by answered questions");
  assert(combined.snapshot.overallProgress.accuracy !== 50, "overall accuracy is not the unweighted average of 50% and 25%");
  const firstTopic = combined.snapshot.topicProgress.find((item) => item.topicId === TOPIC);
  assert(firstTopic?.percentage === 50, "topic percentage is correct/total for that topic");
  passed.push("independent results aggregate with question-weighted accuracy");

  const reverseFirst = expectSuccess(
    ingestAssessmentResult(secondMix, { completedAt: "2026-09-02T13:00:00.000Z" }),
    "reverse first",
  );
  const reverseSecond = expectSuccess(
    ingestAssessmentResult(twoQuestionMix("session-a"), { completedAt: "2026-09-02T12:00:00.000Z" }, reverseFirst.state),
    "reverse second",
  );
  assert(
    reverseSecond.snapshot.overallProgress.questionsCorrect === combined.snapshot.overallProgress.questionsCorrect,
    "reversed order keeps correct count",
  );
  assert(
    reverseSecond.snapshot.overallProgress.questionsAnswered === combined.snapshot.overallProgress.questionsAnswered,
    "reversed order keeps answered count",
  );
  assert(
    reverseSecond.snapshot.overallProgress.accuracy === combined.snapshot.overallProgress.accuracy,
    "reversed order keeps accuracy",
  );
  passed.push("reversed result order produces equivalent counters");

  assert(combined.snapshot.topicProgress.find((item) => item.topicId === OTHER_TOPIC)?.lastActivityAt === "2026-09-02T13:00:00.000Z", "lastActivityAt uses completedAt");
  assert(combined.snapshot.updatedAt === "2026-09-02T13:00:00.000Z", "snapshot updatedAt is the latest completedAt");
  passed.push("lastActivityAt uses completedAt, not ingestion time");

  assert(derivePerformanceState(0, 0) === "not-started", "not-started when unanswered");
  assert(derivePerformanceState(2, 50) === "active", "active below developing threshold");
  assert(derivePerformanceState(5, LEARNER_PERFORMANCE_THRESHOLDS.developingAt) === "developing", "developing at 60%");
  assert(derivePerformanceState(5, LEARNER_PERFORMANCE_THRESHOLDS.strongAt) === "strong", "strong at 80%");
  const unansweredOnly = expectSuccess(
    ingestAssessmentResult(
      result({
        sessionId: "session-unanswered",
        assessmentSetId: SET_A,
        total: 2,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 2,
        outcomes: [outcome(SET_A, 1, 0, false, null), outcome(SET_A, 1, 1, false, null)],
      }),
      { completedAt: "2026-09-02T12:00:00.000Z" },
    ),
    "unanswered-only result",
  );
  assert(unansweredOnly.snapshot.topicProgress[0]?.performanceState === "not-started", "no answered questions remains not-started");
  const active = expectSuccess(
    ingestAssessmentResult(twoQuestionMix("session-active"), { completedAt: "2026-09-02T12:00:00.000Z" }),
    "active fixture",
  );
  assert(active.snapshot.topicProgress[0]?.performanceState === "active", "50% is active");
  const developing = expectSuccess(
    ingestAssessmentResult(
      result({
        sessionId: "session-developing",
        assessmentSetId: SET_A,
        total: 5,
        answered: 5,
        correct: 3,
        incorrect: 2,
        unanswered: 0,
        outcomes: [
          outcome(SET_A, 1, 0, true, "A"),
          outcome(SET_A, 1, 1, true, "A"),
          outcome(SET_A, 1, 2, true, "A"),
          outcome(SET_A, 1, 3, false, "B"),
          outcome(SET_A, 1, 4, false, "B"),
        ],
      }),
      { completedAt: "2026-09-02T12:00:00.000Z" },
    ),
    "developing fixture",
  );
  assert(developing.snapshot.topicProgress[0]?.performanceState === "developing", "60% is developing");
  const strong = expectSuccess(
    ingestAssessmentResult(
      result({
        sessionId: "session-strong",
        assessmentSetId: SET_A,
        total: 5,
        answered: 5,
        correct: 4,
        incorrect: 1,
        unanswered: 0,
        outcomes: [
          outcome(SET_A, 1, 0, true, "A"),
          outcome(SET_A, 1, 1, true, "A"),
          outcome(SET_A, 1, 2, true, "A"),
          outcome(SET_A, 1, 3, true, "A"),
          outcome(SET_A, 1, 4, false, "B"),
        ],
      }),
      { completedAt: "2026-09-02T12:00:00.000Z" },
    ),
    "strong fixture",
  );
  assert(strong.snapshot.topicProgress[0]?.performanceState === "strong", "80% is strong");
  passed.push("performance states are deterministic");

  const emptyResult = expectSuccess(
    ingestAssessmentResult(
      result({
        sessionId: "session-empty",
        assessmentSetId: SET_A,
        total: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        outcomes: [],
      }),
      { completedAt: "2026-09-02T12:00:00.000Z" },
    ),
    "empty result",
  );
  assert(emptyResult.snapshot.overallProgress.accuracy === 0, "empty accuracy is 0");
  assert(emptyResult.snapshot.topicProgress[0]?.percentage === 0, "empty topic percentage is 0");
  assert(emptyResult.snapshot.topicProgress[0]?.performanceState === "not-started", "empty result is not-started");
  passed.push("empty result is safe");

  expectFailure(
    ingestAssessmentResult(
      { ...twoQuestionMix("session-bad"), status: "in-progress" as unknown as AssessmentResult["status"] },
      { completedAt: "2026-09-02T12:00:00.000Z" },
    ),
    "validation_failure",
    "invalid status",
  );
  expectFailure(
    ingestAssessmentResult({ ...twoQuestionMix("session-bad-totals"), answered: 9 }, { completedAt: "2026-09-02T12:00:00.000Z" }),
    "validation_failure",
    "contradictory totals",
  );
  expectFailure(
    ingestAssessmentResult(twoQuestionMix("session-missing-time"), { completedAt: "" }),
    "invalid_request",
    "missing completedAt",
  );
  passed.push("malformed result is rejected");

  const versioned = expectSuccess(
    ingestAssessmentResult(
      result({
        sessionId: "session-v2",
        assessmentSetId: SET_A,
        contentVersion: 2,
        total: 1,
        answered: 1,
        correct: 1,
        incorrect: 0,
        unanswered: 0,
        outcomes: [outcome(SET_A, 2, 0, true, "A")],
      }),
      { completedAt: "2026-09-02T14:00:00.000Z" },
      first.state,
    ),
    "second content version",
  );
  assert(versioned.state.assessments.some((item) => item.contentVersion === 1), "version 1 remains");
  assert(versioned.state.assessments.some((item) => item.contentVersion === 2), "version 2 is recorded");
  passed.push("content versions remain represented");

  const multiSet = expectSuccess(
    ingestAssessmentResult(
      result({
        sessionId: "session-drill",
        assessmentSetId: SET_B,
        total: 1,
        answered: 1,
        correct: 1,
        incorrect: 0,
        unanswered: 0,
        outcomes: [outcome(SET_B, 1, 0, true, "A")],
      }),
      { completedAt: "2026-09-02T15:00:00.000Z" },
      first.state,
    ),
    "second assessment set on same topic",
  );
  assert(multiSet.snapshot.topicProgress.length === 1, "one topic progress row");
  assert(multiSet.snapshot.topicProgress[0]?.assessmentsCompleted === 2, "two assessment sets count on one topic");
  assert(multiSet.state.assessments.some((item) => item.assessmentSetId === SET_A), "first set remains");
  assert(multiSet.state.assessments.some((item) => item.assessmentSetId === SET_B), "second set is stored");
  passed.push("multiple assessment sets can belong to one topic");

  const withCompletion = expectSuccess(
    ingestAssessmentResult(twoQuestionMix("session-complete-flag"), {
      completedAt: "2026-09-02T12:00:00.000Z",
      completedTopicIds: [TOPIC],
    }),
    "ingest with completedTopics",
  );
  assert(withCompletion.snapshot.topicProgress[0]?.isCompleted === true, "isCompleted consults completedTopics");
  assert(withCompletion.snapshot.overallProgress.topicsCompleted === 1, "topicsCompleted comes from completedTopics");
  const persisted = applyLearnerIntelligenceUpdate(
    {
      mcqResults: [{ topicSlug: "example-topic", correct: true, timestamp: 1 }],
      completedTopics: [TOPIC],
    },
    withCompletion,
  );
  assert(persisted.mcqResults.length === 1, "mcqResults remain");
  assert(persisted.completedTopics[0] === TOPIC, "completedTopics remain");
  assert(persisted.intelligence?.assessments.length === 1, "intelligence is attached");
  passed.push("completedTopics remain compatible and are not overwritten");

  const oldRaw = JSON.stringify({
    mcqResults: [{ topicSlug: "earths-rotation", correct: true, timestamp: 1 }],
    completedTopics: ["geography/earths-rotation"],
  });
  const oldState = parseLearnerState(oldRaw);
  assert(oldState.mcqResults.length === 1, "pre-Phase-4 mcqResults still parse");
  assert(oldState.completedTopics.includes("geography/earths-rotation"), "pre-Phase-4 completedTopics still parse");
  assert(oldState.intelligence === undefined, "missing intelligence initializes as absent");
  const fromOld = intelligenceFromLearnerState(oldState);
  assert(fromOld.learnerId === "learner/local", "missing intelligence uses empty local state");
  const after = applyLearnerIntelligenceUpdate(oldState, first);
  assert(after.mcqResults.length === 1, "intelligence update does not delete mcqResults");
  assert(after.completedTopics.includes("geography/earths-rotation"), "intelligence update does not delete completedTopics");
  const malformedIntel = parseLearnerState(
    JSON.stringify({
      mcqResults: [{ topicSlug: "earths-rotation", correct: true, timestamp: 1 }],
      completedTopics: ["geography/earths-rotation"],
      intelligence: "nope",
    }),
  );
  assert(malformedIntel.mcqResults.length === 1, "malformed intelligence does not wipe mcqResults");
  assert(malformedIntel.intelligence === undefined, "malformed intelligence is dropped safely");
  passed.push("existing learner state remains readable");

  const serialized = JSON.stringify(combined.snapshot);
  assert(JSON.stringify(JSON.parse(serialized)) === serialized, "snapshot is JSON-roundtrippable");
  const again = deriveLearnerIntelligenceSnapshot(combined.state, []);
  assert(JSON.stringify(again.overallProgress) === JSON.stringify(combined.snapshot.overallProgress), "derivation is deterministic");
  passed.push("JSON serialization works and derivation is deterministic");

  const sources = [
    "src/lib/learner-intelligence/types.ts",
    "src/lib/learner-intelligence/performance.ts",
    "src/lib/learner-intelligence/derive.ts",
    "src/lib/learner-intelligence/ingest.ts",
    "src/lib/learner-intelligence/adapter.ts",
    "src/lib/learner-intelligence/index.ts",
  ];
  for (const path of sources) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import Geography payload`);
      assert(specifier !== "react" && specifier !== "react-dom", `${path} has no React import`);
      assert(!specifier.includes("lib/analytics"), `${path} has no analytics import`);
      assert(!specifier.includes("lib/entitlement"), `${path} has no entitlement import`);
      assert(!specifier.includes("lib/commerce"), `${path} has no commerce import`);
      assert(!specifier.includes("lib/contracts"), `${path} has no API contract import`);
      assert(!specifier.includes("components/"), `${path} has no UI import`);
    }
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not duplicate scoring`);
    assert(!source.includes("selectedOption === question.answer"), `${path} does not reimplement scoring`);
    assert(!source.includes("Date.now"), `${path} does not use Date.now`);
    assert(!source.includes("localStorage"), `${path} does not access localStorage`);
    assert(!source.includes("if (Geography") && !source.includes("if (geography"), `${path} has no Geography branch`);
    assert(!source.includes("openai") && !source.includes("OpenAI"), `${path} has no AI provider`);
  }
  passed.push("intelligence has no Geography, scoring, React, analytics, entitlement, commerce, API, or AI dependency");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-intelligence.ts");

if (executedFromCli) {
  const passed = runLearnerIntelligenceVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("LEARNER_INTELLIGENCE_VERIFICATION: PASS");
}
