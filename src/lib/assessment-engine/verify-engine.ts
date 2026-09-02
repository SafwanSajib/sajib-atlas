import { readFileSync } from "node:fs";
import { getAssessmentSet } from "@/lib/assessment/sets";
import { geographyTopicsBySlug } from "@/lib/geography-data";
import { runAssessmentAdapterVerification } from "./verify-adapter";
import { runAssessmentContractVerification } from "./verify-contracts";
import { runAssessmentDeliveryVerification } from "./verify-delivery";
import { runAssessmentResultVerification } from "./verify-result";
import { runAssessmentScoringVerification } from "./verify-scoring";
import { runAssessmentSessionVerification } from "./verify-session";
import { adaptMcqAssessmentPayload } from "./payload-adapter";
import { deliverMcqAssessment } from "./delivery";
import { serializeAssessmentQuestionKey } from "./identity";
import { isMcqAnswerCorrect, scoreMcqAssessment } from "./scoring";
import { validateMcqAssessmentResult } from "./result";
import {
  abandonAssessmentSession,
  completeAssessmentSession,
  recordAssessmentResponse,
  startAssessmentSession,
  type AssessmentSessionResult,
} from "./session";
import type { AssessmentSession, McqAssessmentResponse } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-engine verification failed: ${message}`);
}

function expectSession(result: AssessmentSessionResult, message: string): AssessmentSession {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectSessionFailure(result: AssessmentSessionResult, code: string, message: string): void {
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

function assertNoForbiddenImports(source: string, label: string, extra: readonly string[] = []): void {
  const imports = importedModules(source);
  for (const specifier of imports) {
    assert(specifier !== "react" && specifier !== "react-dom", `${label} has no React import`);
    assert(!specifier.startsWith("next"), `${label} has no Next import`);
    assert(!specifier.includes("store/learner"), `${label} has no learner store import`);
    assert(!specifier.includes("lib/learner"), `${label} has no learner profile import`);
    assert(!specifier.includes("lib/analytics"), `${label} has no analytics import`);
    assert(!specifier.includes("lib/entitlement"), `${label} has no entitlement import`);
    assert(!specifier.includes("lib/commerce"), `${label} has no commerce import`);
    assert(!specifier.includes("lib/contracts"), `${label} has no API contract import`);
    assert(!specifier.includes("components/"), `${label} has no UI import`);
    for (const forbidden of extra) {
      assert(!specifier.includes(forbidden), `${label} must not import ${forbidden}`);
    }
  }
}

const SET_ID = "geography/earths-rotation/mcq-practice";
const TOPIC_ID = "geography/earths-rotation";
const VERSION = 1;
const SESSION_ID = "opaque-engine-session-3g";
const STARTED_AT = "2026-09-02T18:00:00.000Z";
const ENDED_AT = "2026-09-02T18:05:00.000Z";
const FORBIDDEN_PUBLIC = [
  "answer",
  "explanation",
  "shortcutOrTrap",
  "module",
  "field",
  "payload",
] as const;

function deps(now: string, sessionId = SESSION_ID) {
  return {
    clock: { now: () => now },
    sessionIds: { createSessionId: () => sessionId },
  };
}

function mcqResponse(
  ordinal: number,
  selectedOption: string | null,
  overrides: Partial<{ assessmentSetId: string; contentVersion: number }> = {},
): McqAssessmentResponse {
  return {
    questionKey: {
      assessmentSetId: overrides.assessmentSetId ?? SET_ID,
      contentVersion: overrides.contentVersion ?? VERSION,
      ordinal,
    },
    modality: "mcq",
    selectedOption,
  };
}

export function runAssessmentEngineVerification(): string[] {
  const passed: string[] = [];

  const set = getAssessmentSet(SET_ID);
  assert(set !== undefined, "Phase 1D resolves geography/earths-rotation/mcq-practice");
  assert(set.id === SET_ID, "AssessmentSet id is authoritative");
  assert(set.topicId === TOPIC_ID, "AssessmentSet topicId is geography/earths-rotation");
  assert(set.kind === "mcq-practice", "AssessmentSet kind remains mcq-practice");
  assert(set.payload.module === "geography-data", "payload pointer remains geography-data");
  assert(set.payload.field === "sections.mcqPractice", "payload field remains sections.mcqPractice");
  passed.push("Phase 1D AssessmentSet identity is authoritative");

  const canonical = geographyTopicsBySlug["earths-rotation"]?.sections.mcqPractice;
  assert(Array.isArray(canonical) && canonical.length > 0, "canonical Geography MCQ payload exists");
  assert(!("id" in (canonical[0] ?? {})), "canonical MCQs still have no question ids");

  const adapted = adaptMcqAssessmentPayload({ assessmentSetId: SET_ID, contentVersion: VERSION });
  assert(adapted.ok, "Phase 3C adapts the canonical set");
  assert(adapted.data.assessmentSetId === SET_ID, "adapter preserves AssessmentSet id");
  assert(adapted.data.contentVersion === VERSION, "adapter preserves contentVersion");
  assert(adapted.data.questions.length === canonical.length, "adapter does not copy a second question bank");
  for (let ordinal = 0; ordinal < canonical.length; ordinal += 1) {
    const source = canonical[ordinal];
    const question = adapted.data.questions[ordinal];
    assert(question !== undefined, `adapted question ${ordinal} exists`);
    assert(question.question === source?.question, "adapter preserves canonical question text");
    assert(JSON.stringify(question.options) === JSON.stringify(source?.options), "adapter preserves canonical options");
    assert(question.answer === source?.answer, "adapter preserves canonical answer internally");
    assert(question.questionKey.ordinal === ordinal, "ordinals are deterministic from 0");
    assert(question.questionKey.assessmentSetId === SET_ID, "adapted keys preserve assessmentSetId");
    assert(question.questionKey.contentVersion === VERSION, "adapted keys preserve contentVersion");
  }
  passed.push("canonical Geography payload is the single source through the adapter");

  const deliveryResult = deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: VERSION });
  assert(deliveryResult.ok, "Phase 3D delivers the adapted set");
  const delivery = deliveryResult.data;
  const deliverySnapshot = JSON.stringify(delivery);
  assert(delivery.assessmentSetId === SET_ID, "delivery preserves AssessmentSet id");
  assert(delivery.contentVersion === VERSION, "delivery preserves contentVersion");
  assert(delivery.mode === "practice", "delivery mode is practice");
  assert(delivery.questions.length === adapted.data.questions.length, "delivery preserves question count");
  assert(delivery.questions[0]?.questionKey.ordinal === 0, "delivered ordinals start at 0");
  for (let ordinal = 0; ordinal < delivery.questions.length; ordinal += 1) {
    const delivered = delivery.questions[ordinal];
    const internal = adapted.data.questions[ordinal];
    assert(delivered !== undefined && internal !== undefined, `delivered question ${ordinal} exists`);
    assert(delivered.question === internal.question, "delivery preserves question text");
    assert(JSON.stringify(delivered.options) === JSON.stringify(internal.options), "delivery preserves options");
    assert(delivered.questionKey.ordinal === internal.questionKey.ordinal, "delivery preserves ordinal");
    assert(delivered.questionKey.contentVersion === VERSION, "delivery keys carry contentVersion");
    assert(!("answer" in delivered), "delivery question has no answer own-key");
    assert(!("id" in delivered), "delivery does not create question ids");
  }
  for (const forbidden of FORBIDDEN_PUBLIC) {
    assert(!collectKeys(delivery).has(forbidden), `delivery must not include ${forbidden}`);
  }
  passed.push("delivery preserves identity, keys, order, and is answer-safe");

  const first = adapted.data.questions[0];
  assert(first !== undefined, "first scoring question exists");
  const firstAnswer = first.answer;
  const firstWrong = first.options.find((option) => option !== firstAnswer);
  assert(firstWrong !== undefined, "first question has an incorrect option");
  assert(isMcqAnswerCorrect(first, firstAnswer) === true, "exact string match is correct");
  assert(isMcqAnswerCorrect(first, firstWrong) === false, "other option is incorrect");
  assert(isMcqAnswerCorrect(first, firstAnswer.toLowerCase()) === false, "case mismatch is not normalized");
  assert(isMcqAnswerCorrect(first, `${firstAnswer} `) === false, "whitespace mismatch is not normalized");
  assert(isMcqAnswerCorrect(first, null) === false, "null is not a correct single-question answer");
  passed.push("scoring law remains selectedOption === question.answer");

  const started = expectSession(startAssessmentSession(delivery, deps(STARTED_AT)), "start engine session");
  assert(JSON.stringify(delivery) === deliverySnapshot, "start does not mutate delivery");
  assert(isDistinct(started.sessionId, SET_ID), "sessionId is distinct from assessmentSetId");
  assert(isDistinct(started.sessionId, TOPIC_ID), "sessionId is distinct from topicId");
  assert(isDistinct(started.sessionId, "learner/local"), "sessionId is distinct from learner/local");
  assert(
    isDistinct(started.sessionId, serializeAssessmentQuestionKey(first.questionKey)),
    "sessionId is distinct from questionKey",
  );
  assert(started.sessionId === SESSION_ID, "injected sessionId is used");
  assert(started.assessmentSetId === SET_ID, "session preserves AssessmentSet id");
  assert(started.contentVersion === VERSION, "session preserves contentVersion");
  assert(started.mode === "practice", "session mode is practice");
  assert(started.status === "in-progress", "session starts in-progress");
  assert(started.responses.length === 0, "session starts with empty responses");
  assert(!("learnerId" in started), "session has no learnerId");
  passed.push("session identity is opaque and preserves delivery identity");

  const second = adapted.data.questions[1];
  assert(second !== undefined, "second scoring question exists");
  const secondWrong = second.options.find((option) => option !== second.answer);
  assert(secondWrong !== undefined, "second question has an incorrect option");

  const startedSnapshot = JSON.stringify(started);
  const recordedCorrect = expectSession(
    recordAssessmentResponse(started, mcqResponse(0, firstAnswer)),
    "record correct",
  );
  assert(JSON.stringify(started) === startedSnapshot, "record does not mutate the original session");
  const replaced = expectSession(
    recordAssessmentResponse(recordedCorrect, mcqResponse(0, firstWrong)),
    "replace first response",
  );
  assert(replaced.responses.length === 1, "replacement does not append a duplicate response");
  assert(replaced.responses[0]?.selectedOption === firstWrong, "replacement keeps the latest selectedOption");
  const withSecond = expectSession(
    recordAssessmentResponse(replaced, mcqResponse(1, secondWrong)),
    "record second incorrect",
  );
  const withUnanswered = expectSession(
    recordAssessmentResponse(withSecond, mcqResponse(2, null)),
    "record explicit null",
  );
  assert(withUnanswered.responses.length === 3, "three response records exist after replacement");
  passed.push("valid responses are accepted and same-key replacement is deterministic");

  expectSessionFailure(
    recordAssessmentResponse(withUnanswered, mcqResponse(0, firstAnswer, { assessmentSetId: "other/set/mcq-practice" })),
    "validation_failure",
    "wrong assessmentSetId",
  );
  expectSessionFailure(
    recordAssessmentResponse(withUnanswered, mcqResponse(0, firstAnswer, { contentVersion: 2 })),
    "validation_failure",
    "wrong contentVersion",
  );
  expectSessionFailure(
    recordAssessmentResponse(withUnanswered, mcqResponse(99, firstAnswer)),
    "validation_failure",
    "invalid ordinal",
  );
  expectSessionFailure(
    recordAssessmentResponse(withUnanswered, {
      questionKey: { assessmentSetId: SET_ID, contentVersion: VERSION, ordinal: 0 },
      modality: "true-false" as unknown as "mcq",
      selectedOption: firstAnswer,
    }),
    "validation_failure",
    "invalid modality",
  );
  const invalidOptionSession = JSON.stringify(withUnanswered);
  const completedInvalid = completeAssessmentSession(
    withUnanswered,
    { questions: adapted.data.questions },
    deps(ENDED_AT),
  );
  assert(completedInvalid.ok, "session with valid options can complete");
  const invalidRecord = expectSession(
    recordAssessmentResponse(withUnanswered, mcqResponse(3, "NOT-A-CANONICAL-OPTION")),
    "record invalid option text is stored until scoring",
  );
  expectSessionFailure(
    completeAssessmentSession(invalidRecord, { questions: adapted.data.questions }, deps(ENDED_AT)),
    "validation_failure",
    "invalid option text",
  );
  assert(JSON.stringify(withUnanswered) === invalidOptionSession, "failed completion does not mutate the in-progress session");
  passed.push("invalid responses fail deterministically");

  const beforeComplete = JSON.stringify(withUnanswered);
  const completed = expectSession(
    completeAssessmentSession(withUnanswered, { questions: adapted.data.questions }, deps(ENDED_AT)),
    "complete engine session",
  );
  assert(JSON.stringify(withUnanswered) === beforeComplete, "complete does not mutate the in-progress session");
  assert(completed.status === "completed", "completion sets completed");
  assert(completed.result !== undefined, "completion attaches a result");
  const result = completed.result;
  assert(result.assessmentSetId === SET_ID, "result preserves AssessmentSet id");
  assert(result.contentVersion === VERSION, "result preserves contentVersion");
  assert(result.sessionId === SESSION_ID, "result preserves opaque sessionId");
  assert(result.status === "completed", "result status is completed");
  assert(result.total === adapted.data.questions.length, "result total equals delivered count");
  assert(result.answered === 2, "answered counts non-null responses");
  assert(result.unanswered === result.total - result.answered, "unanswered = total - answered");
  assert(result.incorrect === result.answered - result.correct, "incorrect = answered - correct");
  assert(result.correct === 0, "replaced first answer is not counted as correct");
  assert(result.score === result.correct, "score equals correct");
  assert(result.percentage === (result.correct / result.total) * 100, "percentage uses (correct / total) * 100");
  assert(result.outcomes.length === result.total, "one outcome per delivered question");
  const outcomeIds = result.outcomes.map((outcome) => serializeAssessmentQuestionKey(outcome.questionKey));
  assert(new Set(outcomeIds).size === outcomeIds.length, "outcomes are unique by question key");
  for (const outcome of result.outcomes) {
    assert(outcome.questionKey.assessmentSetId === SET_ID, "outcome preserves assessmentSetId");
    assert(outcome.questionKey.contentVersion === VERSION, "outcome preserves contentVersion");
    assert(outcome.modality === "mcq", "outcome modality is mcq");
    assert(!("answer" in outcome), "outcome has no answer own-key");
  }
  for (const forbidden of FORBIDDEN_PUBLIC) {
    assert(!collectKeys(result).has(forbidden), `result must not include ${forbidden}`);
  }
  const validated = validateMcqAssessmentResult(result, {
    sessionId: SESSION_ID,
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    questionKeys: adapted.data.questions.map((question) => question.questionKey),
  });
  assert(validated.ok, "Phase 3F validates the completed result");
  passed.push("completion reuses Phase 3B scoring and Phase 3F result with consistent totals");

  expectSessionFailure(
    recordAssessmentResponse(completed, mcqResponse(4, firstAnswer)),
    "invalid_request",
    "response after completion",
  );
  expectSessionFailure(
    completeAssessmentSession(completed, { questions: adapted.data.questions }, deps(ENDED_AT)),
    "invalid_request",
    "completed → completed",
  );
  expectSessionFailure(
    abandonAssessmentSession(completed, deps(ENDED_AT)),
    "invalid_request",
    "completed → abandoned",
  );
  passed.push("completed sessions are terminal");

  const abandonBase = expectSession(
    startAssessmentSession(delivery, deps(STARTED_AT, "opaque-engine-abandon")),
    "start abandon fixture",
  );
  const abandonRecorded = expectSession(
    recordAssessmentResponse(abandonBase, mcqResponse(0, firstAnswer)),
    "record before abandon",
  );
  const abandoned = expectSession(abandonAssessmentSession(abandonRecorded, deps(ENDED_AT)), "abandon");
  assert(abandoned.status === "abandoned", "abandonment sets abandoned");
  assert(abandoned.result === undefined, "abandoned session has no result");
  assert(abandoned.responses.length === 1, "abandoned session preserves responses");
  expectSessionFailure(
    recordAssessmentResponse(abandoned, mcqResponse(1, secondWrong)),
    "invalid_request",
    "response after abandonment",
  );
  expectSessionFailure(
    completeAssessmentSession(abandoned, { questions: adapted.data.questions }, deps(ENDED_AT)),
    "invalid_request",
    "abandoned → completed",
  );
  expectSessionFailure(
    abandonAssessmentSession(abandoned, deps(ENDED_AT)),
    "invalid_request",
    "abandoned → abandoned",
  );
  passed.push("abandoned sessions are terminal and preserve responses");

  const versioned = deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: 7 });
  assert(versioned.ok, "delivery accepts a supplied contentVersion");
  assert(versioned.data.contentVersion === 7, "delivery does not mutate contentVersion");
  assert(
    versioned.data.questions.every((question) => question.questionKey.contentVersion === 7),
    "question keys carry the supplied contentVersion",
  );
  const versionedSession = expectSession(
    startAssessmentSession(versioned.data, deps(STARTED_AT, "opaque-engine-v7")),
    "start versioned session",
  );
  expectSessionFailure(
    recordAssessmentResponse(versionedSession, mcqResponse(0, firstAnswer, { contentVersion: VERSION })),
    "validation_failure",
    "mismatched response contentVersion",
  );
  passed.push("contentVersion is preserved and mismatched versions are rejected");

  const emptyDelivery = deliverMcqAssessment({
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    payload: [],
  });
  assert(emptyDelivery.ok, "empty delivery succeeds");
  const emptySession = expectSession(
    startAssessmentSession(emptyDelivery.data, deps(STARTED_AT, "opaque-engine-empty")),
    "start empty",
  );
  const emptyCompleted = expectSession(
    completeAssessmentSession(emptySession, { questions: [] }, deps(ENDED_AT)),
    "complete empty",
  );
  assert(emptyCompleted.result?.total === 0, "empty total is 0");
  assert(emptyCompleted.result?.score === 0, "empty score is 0");
  assert(emptyCompleted.result?.percentage === 0, "empty percentage is 0");
  passed.push("empty assessment scores as all zeros without NaN");

  const scoredDirect = scoreMcqAssessment({
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    questions: adapted.data.questions,
    responses: withUnanswered.responses,
  });
  assert(scoredDirect.ok, "direct Phase 3B scoring succeeds");
  assert(scoredDirect.data.correct === result.correct, "session result matches Phase 3B correct count");
  assert(scoredDirect.data.score === result.score, "session result matches Phase 3B score");
  passed.push("session completion does not duplicate scoring logic");

  for (const [label, value] of [
    ["delivery", delivery],
    ["session", completed],
    ["result", result],
  ] as const) {
    const serialized = JSON.stringify(value);
    assert(JSON.stringify(JSON.parse(serialized)) === serialized, `${label} is JSON-roundtrippable`);
  }
  passed.push("delivery, session, and result are JSON-safe");

  const firstComplete = expectSession(
    completeAssessmentSession(withUnanswered, { questions: adapted.data.questions }, deps(ENDED_AT)),
    "determinism first",
  );
  const secondComplete = expectSession(
    completeAssessmentSession(withUnanswered, { questions: adapted.data.questions }, deps(ENDED_AT)),
    "determinism second",
  );
  assert(JSON.stringify(firstComplete) === JSON.stringify(secondComplete), "identical completion is deterministic");
  passed.push("fixed clock, sessionId, payload, and responses produce deterministic output");

  const scoringSource = readFileSync("src/lib/assessment-engine/scoring.ts", "utf8");
  const adapterSource = readFileSync("src/lib/assessment-engine/payload-adapter.ts", "utf8");
  const deliverySource = readFileSync("src/lib/assessment-engine/delivery.ts", "utf8");
  const sessionSource = readFileSync("src/lib/assessment-engine/session.ts", "utf8");
  const resultSource = readFileSync("src/lib/assessment-engine/result.ts", "utf8");
  const indexSource = readFileSync("src/lib/assessment-engine/index.ts", "utf8");
  const typesSource = readFileSync("src/lib/assessment-engine/types.ts", "utf8");

  assert(
    importedModules(adapterSource).some((specifier) => specifier.includes("geography-data")),
    "adapter is the Geography payload import boundary",
  );
  assertNoForbiddenImports(scoringSource, "scoring", ["geography-data"]);
  assertNoForbiddenImports(adapterSource, "adapter");
  assertNoForbiddenImports(deliverySource, "delivery", ["geography-data", "./scoring", "./session"]);
  assertNoForbiddenImports(sessionSource, "session", ["geography-data"]);
  assertNoForbiddenImports(resultSource, "result", ["geography-data", "./session"]);
  assert(sessionSource.includes("scoreMcqAssessment"), "session completion calls Phase 3B scoring");
  assert(sessionSource.includes("createMcqAssessmentResult"), "session completion uses Phase 3F result");
  assert(!resultSource.includes("scoreMcqAssessment"), "result does not duplicate scoring");
  assert(!deliverySource.includes("scoreMcqAssessment"), "delivery does not score");
  assert(!adapterSource.includes(first.question), "adapter does not embed canonical question text");
  assert(!scoringSource.includes(first.question), "scoring does not copy Geography question text");
  assert(!deliverySource.includes(first.question), "delivery does not copy Geography question text");
  assert(!sessionSource.includes(first.question), "session does not copy Geography question text");
  assert(!resultSource.includes(first.question), "result does not copy Geography question text");
  assert(!typesSource.includes("mcqPractice: ["), "contracts do not embed MCQ arrays");
  assert(!indexSource.includes("geography-data.ts") || importedModules(indexSource).every((specifier) => !specifier.includes("geography-data")), "index does not import geography-data");
  for (const source of [scoringSource, adapterSource, deliverySource, sessionSource, resultSource]) {
    assert(!source.includes("localStorage"), "engine modules do not reference localStorage");
    assert(!source.includes("sajib_atlas_learner_state"), "engine modules do not touch learner storage");
  }
  passed.push("domain boundaries and single-source payload invariants hold");

  assert(indexSource.includes("ScoringMcqQuestion"), "scoring-only question type is an intentional domain export");
  assert(indexSource.includes("McqDeliveryQuestion"), "public delivery question type is exported");
  assert(indexSource.includes("createMcqAssessmentResult"), "result constructor is exported");
  assert(!indexSource.includes("geographyTopicsBySlug"), "index does not export Geography payload");
  passed.push("public exports remain intentional");

  const contractPasses = runAssessmentContractVerification();
  assert(contractPasses.length > 0, "Phase 3A verifier still returns passes");
  const scoringPasses = runAssessmentScoringVerification();
  assert(scoringPasses.length > 0, "Phase 3B verifier still returns passes");
  const adapterPasses = runAssessmentAdapterVerification();
  assert(adapterPasses.length > 0, "Phase 3C verifier still returns passes");
  const deliveryPasses = runAssessmentDeliveryVerification();
  assert(deliveryPasses.length > 0, "Phase 3D verifier still returns passes");
  const sessionPasses = runAssessmentSessionVerification();
  assert(sessionPasses.length > 0, "Phase 3E verifier still returns passes");
  const resultPasses = runAssessmentResultVerification();
  assert(resultPasses.length > 0, "Phase 3F verifier still returns passes");
  passed.push("existing Phase 3A–3F verifiers still pass");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-engine.ts");

if (executedFromCli) {
  const passed = runAssessmentEngineVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_ENGINE_VERIFICATION: PASS");
}
