import { readFileSync } from "node:fs";
import { runAssessmentAdapterVerification } from "./verify-adapter";
import { runAssessmentContractVerification } from "./verify-contracts";
import { runAssessmentDeliveryVerification } from "./verify-delivery";
import { runAssessmentScoringVerification } from "./verify-scoring";
import { runAssessmentSessionVerification } from "./verify-session";
import { scoreMcqAssessment, type ScoringMcqQuestion } from "./scoring";
import {
  completeAssessmentSession,
  recordAssessmentResponse,
  startAssessmentSession,
} from "./session";
import {
  createMcqAssessmentResult,
  validateMcqAssessmentResult,
  type AssessmentResultCreationResult,
} from "./result";
import type {
  AssessmentDelivery,
  AssessmentQuestionKey,
  AssessmentResult,
  McqAssessmentResponse,
  McqQuestionOutcome,
} from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-result verification failed: ${message}`);
}

function expectSuccess(result: AssessmentResultCreationResult, message: string): AssessmentResult {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectFailure(result: AssessmentResultCreationResult, code: string, message: string): void {
  assert(!result.ok, `${message}: expected failure`);
  if (result.ok) return;
  assert(result.error.code === code, `${message}: expected ${code}, got ${result.error.code}`);
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

const SET_ID = "example-subject/example-topic/mcq-practice";
const VERSION = 1;
const SESSION_ID = "opaque-result-session";

function key(ordinal: number): AssessmentQuestionKey {
  return { assessmentSetId: SET_ID, contentVersion: VERSION, ordinal };
}

function scoringQuestion(
  ordinal: number,
  prompt: string,
  options: readonly string[],
  answer: string,
): ScoringMcqQuestion {
  return {
    questionKey: key(ordinal),
    modality: "mcq",
    question: prompt,
    options,
    answer,
  };
}

function response(ordinal: number, selectedOption: string | null): McqAssessmentResponse {
  return {
    questionKey: key(ordinal),
    modality: "mcq",
    selectedOption,
  };
}

const QUESTIONS: ScoringMcqQuestion[] = [
  scoringQuestion(0, "Which option is alpha?", ["alpha", "beta", "gamma"], "alpha"),
  scoringQuestion(1, "Which option is two?", ["one", "two", "three"], "two"),
  scoringQuestion(2, "Which option is red?", ["red", "blue", "green"], "red"),
];
const KEYS = QUESTIONS.map((question) => question.questionKey);
const RESPONSES = [response(0, "alpha"), response(1, "one"), response(2, null)];

export function runAssessmentResultVerification(): string[] {
  const passed: string[] = [];

  const scored = scoreMcqAssessment({
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    questions: QUESTIONS,
    responses: RESPONSES,
  });
  assert(scored.ok, "Phase 3B scores the synthetic fixture");
  const scoreSnapshot = JSON.stringify(scored.data);

  const created = expectSuccess(
    createMcqAssessmentResult({
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
      score: scored.data,
    }),
    "create result",
  );
  assert(JSON.stringify(scored.data) === scoreSnapshot, "result creation does not mutate the score");
  assert(created.assessmentSetId === SET_ID, "assessmentSetId is preserved");
  assert(created.contentVersion === VERSION, "contentVersion is preserved");
  assert(created.sessionId === SESSION_ID, "sessionId is preserved");
  assert(created.status === "completed", "status is completed");
  assert(created.total === 3, "total is 3");
  assert(created.answered === 2, "answered is 2");
  assert(created.correct === 1, "correct is 1");
  assert(created.incorrect === 1, "incorrect is 1");
  assert(created.unanswered === 1, "unanswered is 1");
  assert(created.score === 1, "score equals correct");
  assert(created.percentage === (1 / 3) * 100, "percentage is (correct / total) * 100");
  assert(created.outcomes.length === created.total, "outcome count equals total");
  for (let ordinal = 0; ordinal < KEYS.length; ordinal += 1) {
    const outcome = created.outcomes[ordinal];
    assert(outcome !== undefined, `outcome ${ordinal} exists`);
    assert(outcome.questionKey.assessmentSetId === SET_ID, "outcome set id is preserved");
    assert(outcome.questionKey.contentVersion === VERSION, "outcome version is preserved");
    assert(outcome.questionKey.ordinal === ordinal, "outcome ordinal is preserved");
    assert(outcome.modality === "mcq", "outcome modality is mcq");
  }
  const outcomeKeys = created.outcomes.map((outcome) =>
    `${outcome.questionKey.assessmentSetId}#v${outcome.questionKey.contentVersion}#${outcome.questionKey.ordinal}`,
  );
  assert(new Set(outcomeKeys).size === outcomeKeys.length, "outcomes are unique by question key");
  passed.push("valid completed result succeeds with preserved identity, totals, and outcomes");

  const publicKeys = collectKeys(created);
  assert(!publicKeys.has("answer"), "public result omits answer");
  assert(!publicKeys.has("explanation"), "public result omits explanation");
  assert(!publicKeys.has("shortcutOrTrap"), "public result omits shortcutOrTrap");
  assert(!publicKeys.has("module"), "public result omits module");
  assert(!publicKeys.has("field"), "public result omits field");
  assert(!publicKeys.has("payload"), "public result omits payload");
  assert(!("answer" in created.outcomes[0]!), "outcome object has no answer own-key");
  passed.push("answer, explanation, and payload metadata are absent from the public result");

  const validated = expectSuccess(
    validateMcqAssessmentResult(created, {
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
    }),
    "validate canonical result",
  );
  assert(JSON.stringify(validated) === JSON.stringify(created), "validation copies the canonical result");

  const missingOutcomes = { ...created, outcomes: created.outcomes.slice(0, 2), total: 3 };
  expectFailure(
    validateMcqAssessmentResult(missingOutcomes, {
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
    }),
    "validation_failure",
    "missing outcome",
  );
  const extraOutcome: McqQuestionOutcome = {
    questionKey: key(9),
    modality: "mcq",
    correct: false,
    selectedOption: null,
  };
  expectFailure(
    validateMcqAssessmentResult(
      { ...created, outcomes: [...created.outcomes, extraOutcome] },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "extra outcome",
  );
  expectFailure(
    validateMcqAssessmentResult(
      {
        ...created,
        outcomes: [created.outcomes[0]!, created.outcomes[0]!, created.outcomes[2]!],
      },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "duplicate outcome",
  );
  expectFailure(
    validateMcqAssessmentResult(
      { ...created, assessmentSetId: "other/set/mcq-practice" },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "mismatched assessmentSetId",
  );
  expectFailure(
    validateMcqAssessmentResult(
      { ...created, contentVersion: 2 },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "mismatched contentVersion",
  );
  expectFailure(
    validateMcqAssessmentResult(
      { ...created, sessionId: "other-session" },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "mismatched sessionId",
  );
  expectFailure(
    validateMcqAssessmentResult(
      { ...created, answered: 3 },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "contradictory totals",
  );
  expectFailure(
    validateMcqAssessmentResult(
      { ...created, status: "in-progress" as unknown as AssessmentResult["status"] },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "invalid status",
  );
  expectFailure(
    validateMcqAssessmentResult(
      {
        ...created,
        outcomes: [
          created.outcomes[0]!,
          { ...created.outcomes[1]!, modality: "written" as "mcq" },
          created.outcomes[2]!,
        ],
      },
      {
        sessionId: SESSION_ID,
        assessmentSetId: SET_ID,
        contentVersion: VERSION,
        questionKeys: KEYS,
      },
    ),
    "validation_failure",
    "invalid modality",
  );
  passed.push("missing, extra, duplicate, identity, total, status, and modality failures are deterministic");

  const leaked = {
    ...created,
    outcomes: [
      { ...created.outcomes[0]!, answer: "alpha" } as unknown as McqQuestionOutcome,
      created.outcomes[1]!,
      created.outcomes[2]!,
    ],
  };
  expectFailure(
    validateMcqAssessmentResult(leaked, {
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
    }),
    "validation_failure",
    "answer leakage",
  );

  const emptyScore = scoreMcqAssessment({
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    questions: [],
    responses: [],
  });
  assert(emptyScore.ok, "empty score succeeds");
  const empty = expectSuccess(
    createMcqAssessmentResult({
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: [],
      score: emptyScore.data,
    }),
    "empty result",
  );
  assert(empty.total === 0 && empty.percentage === 0 && empty.outcomes.length === 0, "empty result is all zeros");

  const serialized = JSON.stringify(created);
  assert(JSON.stringify(JSON.parse(serialized)) === serialized, "result JSON round-trip succeeds");
  const first = expectSuccess(
    createMcqAssessmentResult({
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
      score: scored.data,
    }),
    "determinism first",
  );
  const second = expectSuccess(
    createMcqAssessmentResult({
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
      score: scored.data,
    }),
    "determinism second",
  );
  assert(JSON.stringify(first) === JSON.stringify(second), "identical input yields identical result");
  passed.push("JSON round-trip and deterministic construction succeed");

  const delivery: AssessmentDelivery = {
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    mode: "practice",
    questions: QUESTIONS.map((question) => ({
      questionKey: question.questionKey,
      modality: "mcq" as const,
      question: question.question,
      options: question.options,
    })),
  };
  const started = startAssessmentSession(delivery, {
    clock: { now: () => "2026-09-02T16:00:00.000Z" },
    sessionIds: { createSessionId: () => SESSION_ID },
  });
  assert(started.ok, "synthetic session starts");
  const withResponses = recordAssessmentResponse(started.data, RESPONSES[0]!);
  assert(withResponses.ok, "synthetic response records");
  const withSecondResponse = recordAssessmentResponse(withResponses.data, RESPONSES[1]!);
  assert(withSecondResponse.ok, "second synthetic response records");
  const completed = completeAssessmentSession(
    withSecondResponse.data,
    { questions: QUESTIONS },
    { clock: { now: () => "2026-09-02T16:05:00.000Z" } },
  );
  assert(completed.ok, "synthetic session completes through the result boundary");
  assert(completed.data.result !== undefined, "completed session attaches a result");
  expectSuccess(
    validateMcqAssessmentResult(completed.data.result!, {
      sessionId: SESSION_ID,
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questionKeys: KEYS,
    }),
    "session-attached result is canonical",
  );
  passed.push("valid completed session result succeeds");

  const resultSource = readFileSync("src/lib/assessment-engine/result.ts", "utf8");
  const resultImports = importedModules(resultSource);
  for (const specifier of resultImports) {
    assert(!specifier.includes("geography-data"), `result does not import geography-data (${specifier})`);
    assert(specifier !== "react" && specifier !== "react-dom", `result has no React import (${specifier})`);
    assert(!specifier.startsWith("next"), `result has no Next import (${specifier})`);
    assert(!specifier.includes("store/learner"), `result has no learner store import (${specifier})`);
    assert(!specifier.includes("lib/learner"), `result has no learner profile import (${specifier})`);
    assert(!specifier.includes("lib/analytics"), `result has no analytics import (${specifier})`);
    assert(!specifier.includes("lib/entitlement"), `result has no entitlement import (${specifier})`);
    assert(!specifier.includes("lib/commerce"), `result has no commerce import (${specifier})`);
    assert(!specifier.includes("lib/contracts"), `result has no API contract import (${specifier})`);
    assert(!specifier.includes("components/"), `result has no UI component import (${specifier})`);
    assert(specifier !== "./session", "result does not import session lifecycle");
  }
  assert(!resultSource.includes("scoreMcqAssessment"), "result does not invoke the scorer");
  assert(!resultSource.includes("localStorage"), "result does not reference localStorage");
  assert(!resultSource.includes("Date.now"), "result does not use Date.now");
  assert(!resultSource.includes("sajib_atlas_learner_state"), "result does not touch learner storage");
  assert(!resultSource.includes("Which option is alpha?"), "result does not copy fixture question text");
  passed.push("result module has no Geography, scoring invocation, React, learner, analytics, entitlement, commerce, or API dependency");

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
  passed.push("existing Phase 3A–3E verifiers still pass");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-result.ts");

if (executedFromCli) {
  const passed = runAssessmentResultVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_RESULT_VERIFICATION: PASS");
}
