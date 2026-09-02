import { readFileSync } from "node:fs";
import { adaptMcqAssessmentPayload } from "./payload-adapter";
import { deliverMcqAssessment } from "./delivery";
import { serializeAssessmentQuestionKey } from "./identity";
import {
  abandonAssessmentSession,
  completeAssessmentSession,
  recordAssessmentResponse,
  startAssessmentSession,
  type AssessmentSessionResult,
} from "./session";
import type { AssessmentSession, McqAssessmentResponse } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-session verification failed: ${message}`);
}

function expectSuccess(result: AssessmentSessionResult, message: string): AssessmentSession {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectFailure(result: AssessmentSessionResult, code: string, message: string): void {
  assert(!result.ok, `${message}: expected failure`);
  if (result.ok) return;
  assert(result.error.code === code, `${message}: expected ${code}, got ${result.error.code}`);
}

function isDistinct(left: string, right: string): boolean {
  return left !== right;
}

function collectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    keys.add(key);
    collectKeys(record[key], keys);
  }
  return keys;
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

const SET_ID = "geography/earths-rotation/mcq-practice";
const VERSION = 1;
const SESSION_ID = "opaque-session-3e";
const STARTED_AT = "2026-09-02T15:00:00.000Z";
const ENDED_AT = "2026-09-02T15:05:00.000Z";

function deps(now: string, sessionId = SESSION_ID) {
  return {
    clock: { now: () => now },
    sessionIds: { createSessionId: () => sessionId },
  };
}

function mcqResponse(
  ordinal: number,
  selectedOption: string | null,
  overrides: Partial<{ assessmentSetId: string; contentVersion: number; modality: "mcq" }> = {},
): McqAssessmentResponse {
  return {
    questionKey: {
      assessmentSetId: overrides.assessmentSetId ?? SET_ID,
      contentVersion: overrides.contentVersion ?? VERSION,
      ordinal,
    },
    modality: overrides.modality ?? "mcq",
    selectedOption,
  };
}

export function runAssessmentSessionVerification(): string[] {
  const passed: string[] = [];

  const deliveryResult = deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: VERSION });
  assert(deliveryResult.ok, "Earth's Rotation delivery succeeds");
  const delivery = deliveryResult.data;
  const scoringResult = adaptMcqAssessmentPayload({ assessmentSetId: SET_ID, contentVersion: VERSION });
  assert(scoringResult.ok, "Earth's Rotation scoring payload adapts");
  const scoringQuestions = scoringResult.data.questions;

  const started = expectSuccess(
    startAssessmentSession(delivery, deps(STARTED_AT)),
    "start session",
  );
  assert(started.sessionId === SESSION_ID, "injected sessionId is used");
  assert(isDistinct(started.sessionId, started.assessmentSetId), "sessionId is distinct from assessmentSetId");
  assert(isDistinct(started.sessionId, "geography/earths-rotation"), "sessionId is distinct from topicId");
  assert(
    isDistinct(started.sessionId, serializeAssessmentQuestionKey(delivery.questions[0]!.questionKey)),
    "sessionId is distinct from questionKey",
  );
  assert(isDistinct(started.sessionId, "learner/local"), "sessionId is distinct from learner identity");
  assert(!("learnerId" in started), "session has no learnerId");
  assert(started.assessmentSetId === SET_ID, "assessmentSetId is preserved");
  assert(started.contentVersion === VERSION, "contentVersion is preserved");
  assert(started.mode === "practice", "mode is practice");
  assert(started.status === "in-progress", "initial status is in-progress");
  assert(started.responses.length === 0, "initial responses are empty");
  assert(started.startedAt === STARTED_AT, "startedAt uses the injected clock");
  assert(started.startedAt.includes("T") && started.startedAt.endsWith("Z"), "startedAt is an ISO-8601 string");
  assert(started.completedAt === undefined, "completedAt is absent initially");
  assert(started.result === undefined, "result is absent initially");
  assert(started.questionKeys?.length === delivery.questions.length, "session stores delivered question keys");
  assert(!collectKeys(started).has("answer"), "started session does not store answers");
  passed.push("session starts from valid delivery with opaque identity and empty in-progress state");

  const originalStarted = JSON.stringify(started);
  const recorded = expectSuccess(
    recordAssessmentResponse(started, mcqResponse(0, "West to East")),
    "record valid response",
  );
  assert(JSON.stringify(started) === originalStarted, "record does not mutate the original session");
  assert(recorded.responses.length === 1, "one response is stored");
  assert(recorded.responses[0]?.questionKey.ordinal === 0, "response key ordinal is preserved");
  assert(recorded.responses[0]?.questionKey.assessmentSetId === SET_ID, "response key set id is preserved");
  assert(recorded.responses[0]?.questionKey.contentVersion === VERSION, "response key version is preserved");
  assert(recorded.responses[0]?.selectedOption === "West to East", "selectedOption is preserved exactly");
  passed.push("valid response is accepted with preserved key and selectedOption");

  const replaced = expectSuccess(
    recordAssessmentResponse(recorded, mcqResponse(0, "East to West")),
    "replace same-key response",
  );
  assert(replaced.responses.length === 1, "replacement does not append a duplicate");
  assert(replaced.responses[0]?.selectedOption === "East to West", "replacement uses the latest selectedOption");
  passed.push("replacing the same question response is deterministic");

  const withSecond = expectSuccess(
    recordAssessmentResponse(replaced, mcqResponse(1, "1 hour")),
    "record second question",
  );
  assert(withSecond.responses.length === 2, "a different question key is appended");

  expectFailure(
    recordAssessmentResponse(withSecond, mcqResponse(0, "West to East", { assessmentSetId: "other/set/mcq-practice" })),
    "validation_failure",
    "foreign assessment",
  );
  expectFailure(
    recordAssessmentResponse(withSecond, mcqResponse(0, "West to East", { contentVersion: 2 })),
    "validation_failure",
    "foreign contentVersion",
  );
  expectFailure(
    recordAssessmentResponse(withSecond, mcqResponse(99, "West to East")),
    "validation_failure",
    "invalid ordinal",
  );
  expectFailure(
    recordAssessmentResponse(withSecond, {
      questionKey: { assessmentSetId: SET_ID, contentVersion: VERSION, ordinal: 0 },
      modality: "true-false" as unknown as "mcq",
      selectedOption: "West to East",
    }),
    "validation_failure",
    "invalid modality",
  );
  passed.push("foreign set, foreign version, invalid ordinal, and invalid modality are rejected");

  const beforeComplete = JSON.stringify(withSecond);
  const completed = expectSuccess(
    completeAssessmentSession(withSecond, { questions: scoringQuestions }, deps(ENDED_AT)),
    "complete session",
  );
  assert(JSON.stringify(withSecond) === beforeComplete, "complete does not mutate input");
  assert(completed.status === "completed", "completed status is set");
  assert(completed.completedAt === ENDED_AT, "completion sets completedAt from the clock");
  assert(completed.result !== undefined, "completion attaches a result");
  assert(completed.result?.sessionId === SESSION_ID, "result uses the opaque sessionId");
  assert(completed.result?.status === "completed", "result status is completed");
  assert(completed.result?.assessmentSetId === SET_ID, "result preserves assessmentSetId");
  assert(completed.result?.contentVersion === VERSION, "result preserves contentVersion");
  assert(completed.result?.total === 5, "result total matches delivered questions");
  assert(completed.result?.answered === 2, "result answered counts non-null responses");
  assert(completed.result?.unanswered === 3, "unanswered is not scored as incorrect");
  assert(completed.result?.score === completed.result?.correct, "score equals correct from Phase 3B");
  assert(!collectKeys(completed.result).has("answer"), "result does not leak answers");
  passed.push("completion produces a Phase 3B-compatible result and sets completedAt");

  expectFailure(
    recordAssessmentResponse(completed, mcqResponse(2, "To the right")),
    "invalid_request",
    "response after completion",
  );
  expectFailure(
    completeAssessmentSession(completed, { questions: scoringQuestions }, deps(ENDED_AT)),
    "invalid_request",
    "second completion",
  );
  expectFailure(
    abandonAssessmentSession(completed, deps(ENDED_AT)),
    "invalid_request",
    "abandon after completion",
  );
  passed.push("completed session cannot receive responses, complete twice, or be abandoned");

  const inProgressAgain = expectSuccess(
    startAssessmentSession(delivery, deps(STARTED_AT, "opaque-session-abandon")),
    "start abandon fixture",
  );
  const abandonedSource = expectSuccess(
    recordAssessmentResponse(inProgressAgain, mcqResponse(0, "West to East")),
    "record before abandon",
  );
  const abandoned = expectSuccess(
    abandonAssessmentSession(abandonedSource, deps(ENDED_AT)),
    "abandon session",
  );
  assert(abandoned.status === "abandoned", "abandonment sets abandoned");
  assert(abandoned.completedAt === ENDED_AT, "abandonment sets completedAt");
  assert(abandoned.result === undefined, "abandoned session has no result");
  assert(abandoned.responses.length === 1, "abandoned session preserves responses");
  assert(abandoned.responses[0]?.selectedOption === "West to East", "abandoned responses are unchanged");
  expectFailure(
    recordAssessmentResponse(abandoned, mcqResponse(1, "1 hour")),
    "invalid_request",
    "response after abandonment",
  );
  expectFailure(
    completeAssessmentSession(abandoned, { questions: scoringQuestions }, deps(ENDED_AT)),
    "invalid_request",
    "complete after abandonment",
  );
  expectFailure(
    abandonAssessmentSession(abandoned, deps(ENDED_AT)),
    "invalid_request",
    "second abandonment",
  );
  passed.push("abandonment is terminal, preserves responses, and omits result");

  const serialized = JSON.stringify(completed);
  const roundTrip = JSON.parse(serialized) as AssessmentSession;
  assert(roundTrip.sessionId === completed.sessionId, "JSON preserves sessionId");
  assert(roundTrip.assessmentSetId === completed.assessmentSetId, "JSON preserves assessmentSetId");
  assert(roundTrip.contentVersion === completed.contentVersion, "JSON preserves contentVersion");
  assert(roundTrip.mode === completed.mode, "JSON preserves mode");
  assert(roundTrip.status === completed.status, "JSON preserves status");
  assert(roundTrip.startedAt === completed.startedAt, "JSON preserves startedAt");
  assert(roundTrip.completedAt === completed.completedAt, "JSON preserves completedAt");
  assert(JSON.stringify(roundTrip.responses) === JSON.stringify(completed.responses), "JSON preserves responses");
  assert(JSON.stringify(roundTrip.result) === JSON.stringify(completed.result), "JSON preserves result");
  passed.push("session JSON round-trip works");

  const firstComplete = expectSuccess(
    completeAssessmentSession(withSecond, { questions: scoringQuestions }, deps(ENDED_AT)),
    "determinism first complete",
  );
  const secondComplete = expectSuccess(
    completeAssessmentSession(withSecond, { questions: scoringQuestions }, deps(ENDED_AT)),
    "determinism second complete",
  );
  assert(JSON.stringify(firstComplete) === JSON.stringify(secondComplete), "identical completion is deterministic");
  const firstStart = expectSuccess(startAssessmentSession(delivery, deps(STARTED_AT)), "determinism first start");
  const secondStart = expectSuccess(startAssessmentSession(delivery, deps(STARTED_AT)), "determinism second start");
  assert(JSON.stringify(firstStart) === JSON.stringify(secondStart), "identical start is deterministic");
  passed.push("repeated lifecycle operations are deterministic");

  const sessionSource = readFileSync("src/lib/assessment-engine/session.ts", "utf8");
  const sessionImports = importedModules(sessionSource);
  for (const specifier of sessionImports) {
    assert(!specifier.includes("geography-data"), `session does not import geography-data (${specifier})`);
    assert(specifier !== "react" && specifier !== "react-dom", `session has no React import (${specifier})`);
    assert(!specifier.startsWith("next"), `session has no Next import (${specifier})`);
    assert(!specifier.includes("store/learner"), `session has no learner store import (${specifier})`);
    assert(!specifier.includes("lib/learner"), `session has no learner profile import (${specifier})`);
    assert(!specifier.includes("lib/analytics"), `session has no analytics import (${specifier})`);
    assert(!specifier.includes("lib/entitlement"), `session has no entitlement import (${specifier})`);
    assert(!specifier.includes("lib/commerce"), `session has no commerce import (${specifier})`);
    assert(!specifier.includes("lib/contracts"), `session has no API contract import (${specifier})`);
    assert(!specifier.includes("components/"), `session has no UI component import (${specifier})`);
    assert(!specifier.includes("payload-adapter"), `session does not import the payload adapter (${specifier})`);
  }
  assert(
    sessionImports.some((specifier) => specifier === "./scoring"),
    "session completion reuses Phase 3B scoring",
  );
  assert(!sessionSource.includes("localStorage"), "session does not reference localStorage");
  assert(!sessionSource.includes("Date.now"), "session does not use Date.now");
  assert(!sessionSource.includes("sajib_atlas_learner_state"), "session does not touch learner storage");
  assert(!sessionSource.includes("assessment_started"), "session does not emit analytics");
  assert(!sessionSource.includes("geographyTopicsBySlug"), "session does not read Geography payload");
  passed.push("session has no Geography, React, learner, analytics, entitlement, commerce, or API dependency");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-session.ts");

if (executedFromCli) {
  const passed = runAssessmentSessionVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_SESSION_VERIFICATION: PASS");
}
