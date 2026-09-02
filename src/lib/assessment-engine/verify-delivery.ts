import { readFileSync } from "node:fs";
import { getAssessmentSet } from "@/lib/assessment/sets";
import { geographyTopicsBySlug } from "@/lib/geography-data";
import { deliverMcqAssessment, type AssessmentDeliveryResult } from "./delivery";
import type { AssessmentDelivery } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-delivery verification failed: ${message}`);
}

function expectSuccess(result: AssessmentDeliveryResult, message: string): AssessmentDelivery {
  assert(result.ok, `${message}: expected success, got ${result.ok ? "ok" : result.error.code}`);
  return result.data;
}

function expectFailure(result: AssessmentDeliveryResult, code: string, message: string): void {
  assert(!result.ok, `${message}: expected failure`);
  if (result.ok) return;
  assert(result.error.code === code, `${message}: expected ${code}, got ${result.error.code}`);
  assert(typeof result.error.message === "string" && result.error.message.length > 0, `${message}: error message present`);
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
const FORBIDDEN_KEYS = [
  "answer",
  "explanation",
  "shortcutOrTrap",
  "module",
  "field",
  "payload",
  "id",
  "sessionId",
  "learnerId",
  "score",
  "percentage",
  "correct",
  "incorrect",
  "answered",
  "unanswered",
] as const;

export function runAssessmentDeliveryVerification(): string[] {
  const passed: string[] = [];

  const set = getAssessmentSet(SET_ID);
  assert(set !== undefined, "Earth's Rotation assessment set exists");
  assert(set.id === SET_ID, "AssessmentSet id is geography/earths-rotation/mcq-practice");
  passed.push("current Geography AssessmentSet can be delivered");

  const canonical = geographyTopicsBySlug["earths-rotation"]?.sections.mcqPractice;
  assert(Array.isArray(canonical) && canonical.length > 0, "canonical Earth's Rotation MCQs exist");

  const delivery = expectSuccess(
    deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: VERSION }),
    "deliver Earth's Rotation",
  );
  assert(delivery.mode === "practice", "mode is practice");
  assert(delivery.assessmentSetId === SET_ID, "assessmentSetId is preserved");
  assert(delivery.contentVersion === VERSION, "contentVersion is preserved");
  assert(delivery.questions.length === canonical.length, "canonical question count is preserved");
  assert(delivery.questions.length === 5, "Earth's Rotation still has five delivered MCQs");
  passed.push("delivery succeeds with practice mode, preserved set id, version, and count");

  for (let ordinal = 0; ordinal < canonical.length; ordinal += 1) {
    const source = canonical[ordinal];
    const question = delivery.questions[ordinal];
    assert(question !== undefined, `delivered question ${ordinal} exists`);
    assert(question.questionKey.ordinal === ordinal, `ordinal ${ordinal} is preserved`);
    assert(question.questionKey.assessmentSetId === SET_ID, "question key assessmentSetId is preserved");
    assert(question.questionKey.contentVersion === VERSION, "question key contentVersion is preserved");
    assert(question.modality === "mcq", "modality is mcq");
    assert(question.question === source?.question, "question text is preserved");
    assert(JSON.stringify(question.options) === JSON.stringify(source?.options), "options are preserved");
    assert(!("answer" in question), "delivered question has no answer own-key");
    assert(!("explanation" in question), "delivered question has no explanation");
    assert(!("shortcutOrTrap" in question), "delivered question has no shortcutOrTrap");
    assert(!("module" in question), "delivered question has no module");
    assert(!("field" in question), "delivered question has no field");
    assert(!("id" in question), "delivered question has no question id");
  }
  assert(delivery.questions[0]?.questionKey.ordinal === 0, "ordinals begin at 0");
  assert(
    delivery.questions[0]?.question === "In which direction does the Earth rotate on its axis?",
    "canonical first question remains first",
  );
  assert(
    JSON.stringify(delivery.questions[0]?.options) ===
      JSON.stringify(["East to West", "West to East", "North to South", "South to North"]),
    "canonical first-question option order is preserved",
  );
  passed.push("canonical order, ordinals, modality, question text, and options are preserved");

  const versioned = expectSuccess(
    deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: 7 }),
    "supplied contentVersion",
  );
  assert(versioned.contentVersion === 7, "delivery does not derive contentVersion");
  assert(
    versioned.questions.every((question) => question.questionKey.contentVersion === 7),
    "every question key carries the supplied version",
  );
  passed.push("contentVersion is preserved as supplied on delivery and keys");

  const publicKeys = collectKeys(delivery);
  for (const forbidden of FORBIDDEN_KEYS) {
    assert(!publicKeys.has(forbidden), `public delivery must not include ${forbidden}`);
  }
  assert(!("sessionId" in delivery), "delivery has no sessionId");
  assert(!("result" in delivery), "delivery has no result");
  passed.push("public delivery omits answer, explanation, shortcutOrTrap, module, field, payload, and ids");

  const empty = expectSuccess(
    deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: VERSION, payload: [] }),
    "empty assessment",
  );
  assert(empty.questions.length === 0, "empty assessment does not fabricate questions");
  assert(empty.mode === "practice", "empty assessment remains practice");
  assert(empty.assessmentSetId === SET_ID, "empty assessment preserves assessmentSetId");
  passed.push("empty assessment behavior is deterministic");

  expectFailure(
    deliverMcqAssessment({ assessmentSetId: "not-a-real-assessment-set", contentVersion: VERSION }),
    "not_found",
    "unknown assessment",
  );
  passed.push("unknown assessment behavior is deterministic");

  expectFailure(
    deliverMcqAssessment({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [{ options: ["A", "B"], answer: "A" }],
    }),
    "validation_failure",
    "malformed adapter payload",
  );
  expectFailure(
    deliverMcqAssessment({
      assessmentSetId: SET_ID,
      contentVersion: VERSION,
      payload: [{ question: "Which?", options: ["A", "B"], answer: "C" }],
    }),
    "validation_failure",
    "answer not in options",
  );
  passed.push("adapter errors propagate deterministically");

  const serialized = JSON.stringify(delivery);
  assert(typeof serialized === "string" && serialized.length > 2, "delivery serializes to JSON");
  const roundTrip = JSON.parse(serialized) as AssessmentDelivery;
  assert(JSON.stringify(roundTrip) === serialized, "delivery is JSON-roundtrippable");
  assert(!collectKeys(roundTrip).has("answer"), "JSON round-trip still omits answer");
  passed.push("output is JSON serializable");

  const first = expectSuccess(
    deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: VERSION }),
    "determinism first",
  );
  const second = expectSuccess(
    deliverMcqAssessment({ assessmentSetId: SET_ID, contentVersion: VERSION }),
    "determinism second",
  );
  assert(JSON.stringify(first) === JSON.stringify(second), "identical delivery calls produce equivalent output");
  passed.push("repeated identical delivery calls produce equivalent output");

  const deliverySource = readFileSync("src/lib/assessment-engine/delivery.ts", "utf8");
  const deliveryImports = importedModules(deliverySource);
  for (const specifier of deliveryImports) {
    assert(!specifier.includes("geography-data"), `delivery does not import geography-data (${specifier})`);
    assert(specifier !== "react" && specifier !== "react-dom", `delivery has no React import (${specifier})`);
    assert(!specifier.startsWith("next"), `delivery has no Next import (${specifier})`);
    assert(!specifier.includes("store/learner"), `delivery has no learner store import (${specifier})`);
    assert(!specifier.includes("lib/analytics"), `delivery has no analytics import (${specifier})`);
    assert(!specifier.includes("lib/entitlement"), `delivery has no entitlement import (${specifier})`);
    assert(!specifier.includes("lib/commerce"), `delivery has no commerce import (${specifier})`);
    assert(!specifier.includes("lib/contracts"), `delivery has no API contract import (${specifier})`);
    assert(!specifier.includes("components/"), `delivery has no UI component import (${specifier})`);
    assert(specifier !== "./scoring", `delivery does not import scoring (${specifier})`);
  }
  assert(
    deliveryImports.some((specifier) => specifier === "./payload-adapter"),
    "delivery consumes the Phase 3C payload adapter",
  );
  assert(!deliverySource.includes("scoreMcqAssessment"), "delivery does not invoke scoring");
  assert(!deliverySource.includes("AssessmentSession"), "delivery does not create sessions");
  assert(!deliverySource.includes("localStorage"), "delivery does not reference localStorage");
  assert(!deliverySource.includes("Date.now"), "delivery does not use Date.now");
  assert(!deliverySource.includes("Math.random"), "delivery does not use Math.random");
  assert(
    !deliverySource.includes("In which direction does the Earth rotate on its axis?"),
    "delivery does not copy Geography question text",
  );
  assert(!deliverySource.includes("mcqPractice: ["), "delivery does not embed an MCQ array literal");
  passed.push("delivery consumes the adapter and has no Geography, scoring, React, learner, analytics, entitlement, commerce, or API dependency");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-delivery.ts");

if (executedFromCli) {
  const passed = runAssessmentDeliveryVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_DELIVERY_VERIFICATION: PASS");
}
