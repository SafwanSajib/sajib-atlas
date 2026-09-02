import { readFileSync } from "node:fs";
import { getAssessmentSet } from "@/lib/assessment/sets";
import { geographyTopicsBySlug } from "@/lib/geography-data";
import { runAssessmentContractVerification } from "./verify-contracts";
import { runAssessmentScoringVerification } from "./verify-scoring";
import {
  adaptMcqAssessmentPayload,
  toMcqDeliveryQuestion,
  toMcqDeliveryQuestions,
  type AdaptedMcqPayload,
  type AssessmentPayloadAdapterResult,
} from "./payload-adapter";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-adapter verification failed: ${message}`);
}

function expectSuccess(
  result: AssessmentPayloadAdapterResult<AdaptedMcqPayload>,
  message: string,
): AdaptedMcqPayload {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectFailure(
  result: AssessmentPayloadAdapterResult<unknown>,
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

const SET_ID = "geography/earths-rotation/mcq-practice";
const VERSION = 1;

export function runAssessmentAdapterVerification(): string[] {
  const passed: string[] = [];

  const set = getAssessmentSet(SET_ID);
  assert(set !== undefined, "Earth's Rotation assessment set resolves");
  assert(set.id === SET_ID, "AssessmentSet id is geography/earths-rotation/mcq-practice");
  assert(set.payload.module === "geography-data", "payload pointer module is geography-data");
  assert(set.payload.field === "sections.mcqPractice", "payload pointer field is sections.mcqPractice");
  passed.push("current Geography AssessmentSet resolves correctly");

  const canonical = geographyTopicsBySlug["earths-rotation"]?.sections.mcqPractice;
  assert(Array.isArray(canonical) && canonical.length > 0, "Earth's Rotation MCQ payload exists");
  assert(!("id" in (canonical[0] ?? {})), "Geography MCQ items still have no question id");
  passed.push("no question IDs were added to Geography payload");

  const adapted = expectSuccess(
    adaptMcqAssessmentPayload({ assessmentSetId: SET_ID, contentVersion: VERSION }),
    "adapt Earth's Rotation",
  );
  assert(adapted.questions.length === canonical.length, "question count is preserved");
  assert(adapted.questions.length === 5, "Earth's Rotation still has five MCQs");
  passed.push("Earth's Rotation MCQs are adapted and question count is preserved");

  for (let ordinal = 0; ordinal < canonical.length; ordinal += 1) {
    const source = canonical[ordinal];
    const question = adapted.questions[ordinal];
    assert(question !== undefined, `adapted question ${ordinal} exists`);
    assert(question.questionKey.ordinal === ordinal, `ordinal ${ordinal} is sequential`);
    assert(question.questionKey.assessmentSetId === SET_ID, "assessmentSetId is preserved on the key");
    assert(question.questionKey.contentVersion === VERSION, "contentVersion is preserved on the key");
    assert(question.modality === "mcq", "modality is mcq");
    assert(question.question === source?.question, "question text is preserved exactly");
    assert(JSON.stringify(question.options) === JSON.stringify(source?.options), "options are preserved exactly");
    assert(question.answer === source?.answer, "answer is preserved on the internal scoring question");
    assert(!("explanation" in question), "internal scoring question omits explanation");
    assert(!("shortcutOrTrap" in question), "internal scoring question omits shortcutOrTrap");
    assert(!("module" in question), "internal scoring question omits module");
    assert(!("field" in question), "internal scoring question omits field");
    assert(!("id" in question), "adapter does not add a question id");
  }
  assert(adapted.questions[0]?.questionKey.ordinal === 0, "ordinals begin at 0");
  assert(
    adapted.questions[0]?.question === "In which direction does the Earth rotate on its axis?",
    "first canonical question remains first",
  );
  assert(
    JSON.stringify(adapted.questions[0]?.options) ===
      JSON.stringify(["East to West", "West to East", "North to South", "South to North"]),
    "first question option order is canonical, not rewritten",
  );
  assert(adapted.assessmentSetId === SET_ID, "result assessmentSetId is preserved");
  assert(adapted.contentVersion === VERSION, "result contentVersion is the supplied version");
  passed.push("canonical order, ordinals, set id, version, text, options, and modality are preserved");

  const suppliedVersion = expectSuccess(
    adaptMcqAssessmentPayload({ assessmentSetId: SET_ID, contentVersion: 7 }),
    "supplied contentVersion",
  );
  assert(suppliedVersion.contentVersion === 7, "adapter does not derive or mutate contentVersion");
  assert(suppliedVersion.questions[0]?.questionKey.contentVersion === 7, "question keys use the supplied version");
  passed.push("contentVersion is preserved as supplied");

  const internalKeys = collectKeys(adapted);
  assert(internalKeys.has("answer"), "internal scoring representation includes answer");
  const delivery = toMcqDeliveryQuestions(adapted.questions);
  assert(delivery.length === adapted.questions.length, "delivery conversion preserves count");
  const deliveryKeys = collectKeys(delivery);
  assert(!deliveryKeys.has("answer"), "public delivery omits answer");
  assert(!deliveryKeys.has("explanation"), "public delivery omits explanation");
  assert(!deliveryKeys.has("shortcutOrTrap"), "public delivery omits shortcutOrTrap");
  assert(!deliveryKeys.has("module"), "public delivery omits module");
  assert(!deliveryKeys.has("field"), "public delivery omits field");
  assert(!deliveryKeys.has("payload"), "public delivery omits payload");
  const firstDelivery = toMcqDeliveryQuestion(adapted.questions[0]!);
  assert(!("answer" in firstDelivery), "delivery question object has no answer own-key");
  assert(firstDelivery.question === adapted.questions[0]?.question, "delivery preserves question text");
  assert(
    JSON.stringify(firstDelivery.options) === JSON.stringify(adapted.questions[0]?.options),
    "delivery preserves options",
  );
  const resultKeys = collectKeys({
    assessmentSetId: adapted.assessmentSetId,
    contentVersion: adapted.contentVersion,
    questions: delivery,
  });
  assert(!resultKeys.has("answer"), "delivery-shaped result omits answer");
  passed.push("answer is internal-only and public delivery omits answer, explanation, and payload pointers");

  expectFailure(
    adaptMcqAssessmentPayload({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [{ options: ["A", "B"], answer: "A" }],
    }),
    "validation_failure",
    "malformed question missing text",
  );
  expectFailure(
    adaptMcqAssessmentPayload({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [
        {
          question: "Valid first",
          options: ["A", "B"],
          answer: "A",
        },
        "not-an-object",
      ],
    }),
    "validation_failure",
    "malformed later item is not skipped",
  );
  passed.push("malformed question behavior is deterministic");

  expectFailure(
    adaptMcqAssessmentPayload({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [
        {
          question: "Which option?",
          options: ["A", "B", "C"],
          answer: "D",
        },
      ],
    }),
    "validation_failure",
    "answer not in options",
  );
  expectFailure(
    adaptMcqAssessmentPayload({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [
        {
          question: "Which option?",
          options: ["A", "B"],
          answer: "A ",
        },
      ],
    }),
    "validation_failure",
    "answer is not whitespace-normalized into an option",
  );
  passed.push("invalid answer-not-in-options behavior is deterministic");

  const empty = expectSuccess(
    adaptMcqAssessmentPayload({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [],
    }),
    "empty payload",
  );
  assert(empty.questions.length === 0, "empty payload yields no fabricated questions");
  assert(empty.assessmentSetId === SET_ID, "empty payload still preserves assessmentSetId");
  passed.push("empty payload behavior is deterministic");

  const first = expectSuccess(
    adaptMcqAssessmentPayload({ assessmentSetId: SET_ID, contentVersion: VERSION }),
    "determinism first",
  );
  const second = expectSuccess(
    adaptMcqAssessmentPayload({ assessmentSetId: SET_ID, contentVersion: VERSION }),
    "determinism second",
  );
  assert(JSON.stringify(first) === JSON.stringify(second), "identical input yields identical JSON");
  passed.push("adapter output is deterministic");

  const adapterSource = readFileSync("src/lib/assessment-engine/payload-adapter.ts", "utf8");
  const scoringSource = readFileSync("src/lib/assessment-engine/scoring.ts", "utf8");
  const adapterImports = importedModules(adapterSource);
  const scoringImports = importedModules(scoringSource);

  assert(
    adapterImports.some((specifier) => specifier.includes("geography-data")),
    "adapter is the engine module that imports geography-data",
  );
  assert(
    !adapterSource.includes("In which direction does the Earth rotate on its axis?"),
    "adapter does not duplicate Earth's Rotation question text",
  );
  assert(!adapterSource.includes("mcqPractice: ["), "adapter does not embed an MCQ array literal");
  for (const specifier of adapterImports) {
    assert(specifier !== "react" && specifier !== "react-dom", `adapter has no React import (${specifier})`);
    assert(!specifier.startsWith("next"), `adapter has no Next import (${specifier})`);
    assert(!specifier.includes("store/learner"), `adapter has no learner store import (${specifier})`);
    assert(!specifier.includes("lib/analytics"), `adapter has no analytics import (${specifier})`);
    assert(!specifier.includes("lib/entitlement"), `adapter has no entitlement import (${specifier})`);
    assert(!specifier.includes("lib/commerce"), `adapter has no commerce import (${specifier})`);
    assert(!specifier.includes("components/"), `adapter has no UI component import (${specifier})`);
    assert(
      specifier !== "./scoring" || adapterSource.includes("import type"),
      "adapter does not import scoring behavior",
    );
  }
  assert(!adapterSource.includes("localStorage"), "adapter does not reference localStorage");
  assert(!adapterSource.includes("Date.now"), "adapter does not use Date.now");
  assert(!adapterSource.includes("Math.random"), "adapter does not use Math.random");
  assert(!adapterSource.includes("scoreMcqAssessment"), "adapter does not calculate results");
  assert(!adapterSource.includes("AssessmentSession"), "adapter does not create sessions");
  passed.push("adapter does not import React, learner, analytics, entitlement, or commerce");

  for (const specifier of scoringImports) {
    assert(!specifier.includes("geography-data"), `scoring remains Geography-independent (${specifier})`);
  }
  passed.push("scoring module remains Geography-independent");

  const contractPasses = runAssessmentContractVerification();
  assert(contractPasses.length > 0, "Phase 3A contract verifier still returns passes");
  const scoringPasses = runAssessmentScoringVerification();
  assert(scoringPasses.length > 0, "Phase 3B scoring verifier still returns passes");
  passed.push("existing Phase 3A and 3B verifiers still pass");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-adapter.ts");

if (executedFromCli) {
  const passed = runAssessmentAdapterVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_ADAPTER_VERIFICATION: PASS");
}
