import { parseAssessmentSetId } from "@/lib/assessment/identity";
import { parseAssessmentQuestionKey, serializeAssessmentQuestionKey } from "./identity";
import {
  ASSESSMENT_MODALITIES,
  CURRENT_ASSESSMENT_MODALITY,
  CURRENT_ASSESSMENT_SESSION_MODE,
  type AssessmentDelivery,
  type AssessmentResult,
  type AssessmentSession,
  type McqAssessmentResponse,
  type McqDeliveryQuestion,
  type McqQuestionOutcome,
} from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-contract verification failed: ${message}`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes to JSON`);
  assert(JSON.stringify(JSON.parse(serialized)) === serialized, `${label} is JSON-roundtrippable`);
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

const FORBIDDEN_KEYS = [
  "answer",
  "correctAnswer",
  "explanation",
  "shortcutOrTrap",
  "module",
  "field",
  "payload",
  "mcqPractice",
  "password",
  "token",
  "payment",
  "card",
  "invoice",
  "checkout",
  "localStorage",
  "analytics",
  "entitlement",
  "commerce",
  "path",
] as const;

export function runAssessmentContractVerification(): string[] {
  const passed: string[] = [];
  const setId = "geography/earths-rotation/mcq-practice";
  const parsedSet = parseAssessmentSetId(setId);
  assert(parsedSet?.topicId === "geography/earths-rotation", "fixture set id still parses as Phase 1D identity");
  assert(parsedSet?.kind === "mcq-practice", "fixture kind remains mcq-practice");

  const questionKey = { assessmentSetId: setId, contentVersion: 1, ordinal: 0 };
  assert(questionKey.contentVersion === 1, "question key is version-scoped");
  assert(questionKey.ordinal === 0, "ordinal is snapshot position, not an eternal id");
  const serialized = serializeAssessmentQuestionKey(questionKey);
  assert(serialized === "geography/earths-rotation/mcq-practice#v1#0", "serialized key uses set#vversion#ordinal");
  const parsedKey = parseAssessmentQuestionKey(serialized);
  assert(parsedKey?.assessmentSetId === setId, "parsed key preserves assessmentSetId");
  assert(parsedKey?.contentVersion === 1 && parsedKey.ordinal === 0, "parsed key preserves version and ordinal");
  assert(parseAssessmentQuestionKey("not-a-key") === undefined, "malformed serialized key is undefined");
  passed.push("question key is version-scoped and not a Geography payload id");

  const deliveryQuestion: McqDeliveryQuestion = {
    questionKey,
    modality: "mcq",
    question: "In which direction does the Earth rotate on its axis?",
    options: ["West to East", "East to West", "North to South", "South to North"],
  };
  assert(deliveryQuestion.modality === CURRENT_ASSESSMENT_MODALITY, "MCQ delivery uses modality mcq");
  assert(!("answer" in deliveryQuestion), "MCQ delivery does not expose answer");
  assert(!("explanation" in deliveryQuestion), "MCQ delivery does not expose explanation");
  assert(!("module" in deliveryQuestion), "MCQ delivery does not expose payload module");
  assert(!("field" in deliveryQuestion), "MCQ delivery does not expose payload field");
  passed.push("MCQ delivery shape is representable without answer or payload pointers");

  const delivery: AssessmentDelivery = {
    assessmentSetId: setId,
    contentVersion: 1,
    mode: CURRENT_ASSESSMENT_SESSION_MODE,
    questions: [deliveryQuestion],
  };
  assert(delivery.mode === "practice", "delivery mode is session practice, not AssessmentSet.kind");
  assert(!("payload" in delivery), "delivery has no payload pointer");
  passed.push("assessment delivery container is representable");

  const response: McqAssessmentResponse = {
    questionKey,
    modality: "mcq",
    selectedOption: "West to East",
  };
  const unanswered: McqAssessmentResponse = {
    questionKey,
    modality: "mcq",
    selectedOption: null,
  };
  assert(response.selectedOption === "West to East", "MCQ response uses option text");
  assert(unanswered.selectedOption === null, "null selectedOption is unanswered");
  passed.push("MCQ response shape uses option text or null");

  const outcome: McqQuestionOutcome = {
    questionKey,
    modality: "mcq",
    correct: true,
    selectedOption: "West to East",
  };
  assert(!("answer" in outcome), "outcome does not leak the correct answer");
  const result: AssessmentResult = {
    assessmentSetId: setId,
    contentVersion: 1,
    sessionId: "opaque-session-example",
    total: 1,
    answered: 1,
    correct: 1,
    incorrect: 0,
    unanswered: 0,
    score: 1,
    percentage: 1,
    status: "completed",
    outcomes: [outcome],
  };
  assert(result.sessionId !== setId, "sessionId is not the assessment-set id");
  assert(result.sessionId !== "geography/earths-rotation", "sessionId is not a topic id");
  assert(result.status === "completed", "result status is completed");
  passed.push("session-independent result shape is representable");

  const session: AssessmentSession = {
    sessionId: "opaque-session-example",
    assessmentSetId: setId,
    contentVersion: 1,
    mode: "practice",
    status: "in-progress",
    startedAt: "2026-09-02T12:00:00.000Z",
    responses: [unanswered],
  };
  assert(session.status === "in-progress", "session status is distinct from result status");
  assert(session.result === undefined, "result is optional on an in-progress session");
  assert(session.sessionId !== session.assessmentSetId, "session identity is opaque");
  passed.push("session shape is representable without persistence");

  assert(ASSESSMENT_MODALITIES.includes("mcq"), "mcq is a declared modality");
  assert(ASSESSMENT_MODALITIES.includes("true-false"), "future true-false is reserved");
  assert(ASSESSMENT_MODALITIES.includes("written"), "future written is reserved");
  passed.push("modality union is structurally extensible without fake MCQ fields");

  assertJsonSafe(deliveryQuestion, "MCQ delivery question");
  assertJsonSafe(delivery, "assessment delivery");
  assertJsonSafe(response, "MCQ response");
  assertJsonSafe(session, "assessment session");
  assertJsonSafe(result, "assessment result");
  passed.push("contracts serialize to JSON");

  const publicSamples = [deliveryQuestion, delivery, response, unanswered, outcome, result, session];
  for (const sample of publicSamples) {
    const keys = collectKeys(sample);
    for (const forbidden of FORBIDDEN_KEYS) {
      assert(!keys.has(forbidden), `public contract must not include ${forbidden}`);
    }
  }
  passed.push("public contracts omit answer, payload pointers, and foreign domain fields");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-contracts.ts");

if (executedFromCli) {
  const passed = runAssessmentContractVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_CONTRACT_VERIFICATION: PASS");
}
