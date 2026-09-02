import { readFileSync } from "node:fs";
import { isAnswerCorrect } from "@/lib/assessment/scoring";
import { serializeAssessmentQuestionKey } from "./identity";
import {
  isMcqAnswerCorrect,
  scoreMcqAssessment,
  type McqAssessmentScore,
  type ScoreMcqAssessmentInput,
  type ScoringMcqQuestion,
  type AssessmentScoringResult,
} from "./scoring";
import type { McqAssessmentResponse } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-scoring verification failed: ${message}`);
}

function expectSuccess(result: AssessmentScoringResult, message: string): McqAssessmentScore {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectFailure(
  result: AssessmentScoringResult,
  code: string,
  message: string,
): void {
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

function key(ordinal: number, assessmentSetId = SET_ID, contentVersion = VERSION) {
  return { assessmentSetId, contentVersion, ordinal };
}

function question(
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

function response(
  ordinal: number,
  selectedOption: string | null,
): McqAssessmentResponse {
  return {
    questionKey: key(ordinal),
    modality: "mcq",
    selectedOption,
  };
}

const Q0 = question(
  0,
  "In which direction does the Earth rotate on its axis?",
  ["West to East", "East to West", "North to South", "South to North"],
  "West to East",
);
const Q1 = question(
  1,
  "What is 2 + 2?",
  ["3", "4", "5", "22"],
  "4",
);
const Q2 = question(
  2,
  "Which option is correct?",
  ["alpha", "beta", "gamma", "delta"],
  "gamma",
);

function score(input: Partial<ScoreMcqAssessmentInput> & Pick<ScoreMcqAssessmentInput, "questions" | "responses">) {
  return scoreMcqAssessment({
    assessmentSetId: SET_ID,
    contentVersion: VERSION,
    ...input,
  });
}

export function runAssessmentScoringVerification(): string[] {
  const passed: string[] = [];

  assert(isMcqAnswerCorrect({ answer: "West to East" }, "West to East") === true, "exact match is correct");
  assert(isMcqAnswerCorrect({ answer: "A" }, "A") === true, "exact letter match is correct");
  assert(isMcqAnswerCorrect({ answer: "A" }, "a") === false, "correctness is case-sensitive");
  assert(isMcqAnswerCorrect({ answer: "West to East" }, "West to East ") === false, "no whitespace normalization");
  assert(
    isMcqAnswerCorrect({ answer: "West to East" }, "West to East") ===
      isAnswerCorrect({ answer: "West to East" }, "West to East"),
    "engine correctness matches legacy isAnswerCorrect for a match",
  );
  assert(
    isMcqAnswerCorrect({ answer: "A" }, "a") === isAnswerCorrect({ answer: "A" }, "a"),
    "engine correctness matches legacy isAnswerCorrect for case mismatch",
  );
  passed.push("exact correct-answer equality is preserved");

  assert(isMcqAnswerCorrect({ answer: "West to East" }, "East to West") === false, "wrong option is not correct");
  passed.push("wrong answer is not correct");

  assert(isMcqAnswerCorrect({ answer: "West to East" }, null) === false, "null is not a correct single-question answer");
  assert(
    isMcqAnswerCorrect({ answer: "A" }, null) === isAnswerCorrect({ answer: "A" }, null),
    "engine null handling matches legacy isAnswerCorrect",
  );
  passed.push("null/unanswered is not correct at the single-question boundary");

  const allCorrect = expectSuccess(
    score({
      questions: [Q0],
      responses: [response(0, "West to East")],
    }),
    "single correct",
  );
  assert(allCorrect.total === 1, "total is 1");
  assert(allCorrect.answered === 1, "answered is 1");
  assert(allCorrect.correct === 1, "correct is 1");
  assert(allCorrect.incorrect === 0, "incorrect is 0");
  assert(allCorrect.unanswered === 0, "unanswered is 0");
  assert(allCorrect.score === 1, "score equals correct");
  assert(allCorrect.percentage === 100, "percentage is 100 for 1/1");
  passed.push("total/answered/correct/incorrect/unanswered/score/percentage for a correct answer");

  const wrong = expectSuccess(
    score({
      questions: [Q0],
      responses: [response(0, "East to West")],
    }),
    "single wrong",
  );
  assert(wrong.total === 1, "wrong total is 1");
  assert(wrong.answered === 1, "wrong is answered");
  assert(wrong.correct === 0, "wrong correct is 0");
  assert(wrong.incorrect === 1, "wrong is incorrect");
  assert(wrong.unanswered === 0, "wrong unanswered is 0");
  assert(wrong.score === 0, "wrong score is 0");
  assert(wrong.percentage === 0, "wrong percentage is 0");
  passed.push("wrong answer counts as answered incorrect with zero score");

  const unanswered = expectSuccess(
    score({
      questions: [Q0],
      responses: [response(0, null)],
    }),
    "explicit null",
  );
  assert(unanswered.answered === 0, "null is not answered");
  assert(unanswered.correct === 0, "null is not correct");
  assert(unanswered.incorrect === 0, "null is not incorrect");
  assert(unanswered.unanswered === 1, "null is unanswered");
  assert(unanswered.score === 0, "unanswered score is 0");
  assert(unanswered.percentage === 0, "unanswered percentage is 0");
  assert(unanswered.outcomes[0]?.selectedOption === null, "outcome preserves null selectedOption");
  assert(unanswered.outcomes[0]?.correct === false, "unanswered outcome is not correct");
  passed.push("null selectedOption is unanswered, not incorrect");

  const missing = expectSuccess(
    score({
      questions: [Q0],
      responses: [],
    }),
    "missing response",
  );
  assert(missing.unanswered === 1, "missing response is unanswered");
  assert(missing.incorrect === 0, "missing response is not incorrect");
  passed.push("missing response is unanswered");

  const empty = expectSuccess(
    score({
      questions: [],
      responses: [],
    }),
    "empty assessment",
  );
  assert(empty.total === 0, "empty total is 0");
  assert(empty.answered === 0, "empty answered is 0");
  assert(empty.correct === 0, "empty correct is 0");
  assert(empty.incorrect === 0, "empty incorrect is 0");
  assert(empty.unanswered === 0, "empty unanswered is 0");
  assert(empty.score === 0, "empty score is 0");
  assert(empty.percentage === 0, "empty percentage is 0");
  assert(empty.outcomes.length === 0, "empty outcomes are empty");
  passed.push("empty assessment scores as all zeros");

  const mixed = expectSuccess(
    score({
      questions: [Q0, Q1, Q2],
      responses: [
        response(0, "West to East"),
        response(1, "3"),
        response(2, null),
      ],
    }),
    "multiple questions",
  );
  assert(mixed.total === 3, "mixed total is 3");
  assert(mixed.answered === 2, "mixed answered is 2");
  assert(mixed.correct === 1, "mixed correct is 1");
  assert(mixed.incorrect === 1, "mixed incorrect is 1");
  assert(mixed.unanswered === 1, "mixed unanswered is 1");
  assert(mixed.score === 1, "mixed score equals correct");
  assert(mixed.percentage === (1 / 3) * 100, "percentage is (correct / total) * 100");
  assert(mixed.outcomes.length === 3, "one outcome per delivered question");
  assert(mixed.outcomes[0]?.questionKey.ordinal === 0, "first outcome is ordinal 0");
  assert(mixed.outcomes[1]?.questionKey.ordinal === 1, "second outcome is ordinal 1");
  assert(mixed.outcomes[2]?.questionKey.ordinal === 2, "third outcome is ordinal 2");
  passed.push("multiple questions produce set totals and one outcome each");

  const scrambledQuestions: ScoringMcqQuestion[] = [Q2, Q0, Q1];
  const scrambled = expectSuccess(
    score({
      questions: scrambledQuestions,
      responses: [response(1, "4"), response(0, "West to East")],
    }),
    "key matching",
  );
  assert(scrambled.outcomes[0]?.questionKey.ordinal === 2, "outcomes follow question collection order");
  assert(scrambled.outcomes[0]?.selectedOption === null, "unmatched ordinal is unanswered, not another response");
  assert(scrambled.outcomes[1]?.questionKey.ordinal === 0, "key match is not array position");
  assert(scrambled.outcomes[1]?.correct === true, "ordinal 0 matched by key");
  assert(scrambled.outcomes[2]?.questionKey.ordinal === 1, "ordinal 1 matched by key");
  assert(scrambled.outcomes[2]?.correct === true, "ordinal 1 matched by key");
  passed.push("responses are matched by structured question key, not array position");

  assert(mixed.assessmentSetId === SET_ID, "score preserves assessmentSetId");
  assert(mixed.contentVersion === VERSION, "score preserves contentVersion");
  for (const outcome of mixed.outcomes) {
    assert(outcome.questionKey.assessmentSetId === SET_ID, "outcome preserves assessmentSetId");
    assert(outcome.questionKey.contentVersion === VERSION, "outcome preserves contentVersion");
    assert(outcome.modality === "mcq", "outcome modality is mcq");
    assert(
      serializeAssessmentQuestionKey(outcome.questionKey) ===
        `${SET_ID}#v${VERSION}#${outcome.questionKey.ordinal}`,
      "serialized key remains set#vversion#ordinal",
    );
  }
  passed.push("question keys and contentVersion are preserved");

  expectFailure(
    score({
      questions: [Q0],
      responses: [response(0, "West to East"), response(0, "East to West")],
    }),
    "invalid_request",
    "duplicate responses",
  );
  expectFailure(
    score({
      questions: [Q0],
      responses: [response(0, "West to East"), response(0, "West to East")],
    }),
    "invalid_request",
    "duplicate identical responses",
  );
  passed.push("duplicate responses are rejected");

  expectFailure(
    score({
      questions: [Q0],
      responses: [response(0, "Not an option")],
    }),
    "validation_failure",
    "invalid option",
  );
  expectFailure(
    score({
      questions: [Q0],
      responses: [response(0, "West to East ")],
    }),
    "validation_failure",
    "whitespace is not normalized into an option",
  );
  expectFailure(
    score({
      questions: [Q0],
      responses: [response(0, "A")],
    }),
    "validation_failure",
    "option letter is not option identity",
  );
  passed.push("invalid selectedOption is rejected without silent conversion");

  expectFailure(
    score({
      questions: [Q0],
      responses: [response(9, "West to East")],
    }),
    "invalid_request",
    "unmatched ordinal",
  );
  expectFailure(
    scoreMcqAssessment({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questions: [Q0],
      responses: [
        {
          questionKey: key(0, SET_ID, 2),
          modality: "mcq",
          selectedOption: "West to East",
        },
      ],
    }),
    "invalid_request",
    "response version mismatch",
  );
  expectFailure(
    scoreMcqAssessment({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      questions: [
        {
          ...Q0,
          questionKey: key(0, SET_ID, 2),
        },
      ],
      responses: [],
    }),
    "invalid_request",
    "question version mismatch",
  );
  expectFailure(
    score({
      questions: [Q0, Q0],
      responses: [],
    }),
    "invalid_request",
    "duplicate question keys",
  );
  passed.push("unmatched, version-mismatched, and duplicate question keys fail deterministically");

  const publicScore = expectSuccess(
    score({
      questions: [Q0],
      responses: [response(0, "West to East")],
    }),
    "leakage sample",
  );
  const publicKeys = collectKeys(publicScore);
  assert(!publicKeys.has("answer"), "public score must not include answer");
  assert(!publicKeys.has("explanation"), "public score must not include explanation");
  assert(!publicKeys.has("shortcutOrTrap"), "public score must not include shortcutOrTrap");
  assert(!publicKeys.has("module"), "public score must not include module");
  assert(!publicKeys.has("field"), "public score must not include field");
  assert(!publicKeys.has("payload"), "public score must not include payload");
  assert(!("answer" in publicScore.outcomes[0]!), "outcome object has no answer own-key");
  assert(!("sessionId" in publicScore), "scoring result does not invent a sessionId");
  passed.push("public outcome/result omit the correct answer and payload pointers");

  const first = expectSuccess(
    score({
      questions: [Q0, Q1],
      responses: [response(0, "West to East"), response(1, "3")],
    }),
    "determinism first",
  );
  const second = expectSuccess(
    score({
      questions: [Q0, Q1],
      responses: [response(0, "West to East"), response(1, "3")],
    }),
    "determinism second",
  );
  assert(JSON.stringify(first) === JSON.stringify(second), "identical input yields identical JSON");
  passed.push("scoring output is deterministic");

  const scoringSource = readFileSync("src/lib/assessment-engine/scoring.ts", "utf8");
  const indexSource = readFileSync("src/lib/assessment-engine/index.ts", "utf8");
  const scoringImports = importedModules(scoringSource);
  const indexImports = importedModules(indexSource);
  for (const specifier of [...scoringImports, ...indexImports]) {
    assert(!specifier.includes("geography-data"), `no geography-data import (${specifier})`);
    assert(specifier !== "react" && specifier !== "react-dom", `no React import (${specifier})`);
    assert(!specifier.startsWith("next"), `no Next import (${specifier})`);
    assert(!specifier.includes("store/learner"), `no learner store import (${specifier})`);
    assert(!specifier.includes("lib/analytics"), `no analytics import (${specifier})`);
    assert(!specifier.includes("lib/entitlement"), `no entitlement import (${specifier})`);
    assert(!specifier.includes("lib/commerce"), `no commerce import (${specifier})`);
    assert(!specifier.includes("components/"), `no UI component import (${specifier})`);
  }
  assert(!scoringSource.includes("localStorage"), "scoring module does not reference localStorage");
  assert(!scoringSource.includes("Date.now"), "scoring module does not use Date.now");
  assert(!scoringSource.includes("Math.random"), "scoring module does not use Math.random");
  assert(!scoringSource.includes("fetch("), "scoring module does not fetch");
  assert(!/from\s+["']@\/lib\/assessment\/scoring["']/.test(scoringSource), "engine scoring does not replace the legacy scoring module");
  passed.push("no Geography payload, React/UI, learner, analytics, or commerce dependency");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-scoring.ts");

if (executedFromCli) {
  const passed = runAssessmentScoringVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_SCORING_VERIFICATION: PASS");
}
