import { readFileSync } from "node:fs";
import type { AssessmentResult, McqQuestionOutcome } from "@/lib/assessment-engine/types";
import type { LearnerTopicProgress } from "@/lib/learner-intelligence/types";
import { searchTopics } from "@/lib/search-data";
import { searchKnowledge } from "@/lib/search/retrieve";
import {
  AI_INTENTS,
  AI_SCHEMA_VERSION,
  composeAiRequestFromRetrieval,
  createAiRequest,
  invokeAiIntelligence,
  isAiRequestId,
  projectAssessmentResultToAiContext,
  projectSearchResultsToAiContext,
  retrieveAiKnowledgeReferences,
  validateAiRequest,
  type AiIntelligenceResult,
  type AiProvider,
  type AiRequest,
} from "./index";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`AI-intelligence verification failed: ${message}`);
}

function expectSuccess<T>(result: AiIntelligenceResult<T>, message: string): T {
  assert(result.ok, `${message}: expected success`);
  return result.data;
}

function isDistinct(left: string, right: string): boolean {
  return left !== right;
}

function expectFailure(result: AiIntelligenceResult<unknown>, code: string, message: string): void {
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

const ROTATION_TOPIC = "geography/earths-rotation";
const ROTATION_SET = "geography/earths-rotation/mcq-practice";

function outcome(
  ordinal: number,
  correct: boolean,
  selected: string | null,
): McqQuestionOutcome {
  return {
    questionKey: { assessmentSetId: ROTATION_SET, contentVersion: 1, ordinal },
    modality: "mcq",
    correct,
    selectedOption: selected,
  };
}

function completedResult(): AssessmentResult {
  return {
    assessmentSetId: ROTATION_SET,
    contentVersion: 1,
    sessionId: "opaque-session-6a",
    total: 2,
    answered: 2,
    correct: 1,
    incorrect: 1,
    unanswered: 0,
    score: 1,
    percentage: 50,
    status: "completed",
    outcomes: [outcome(0, true, "A"), outcome(1, false, "B")],
  };
}

function topicProgress(): LearnerTopicProgress {
  return {
    learnerId: "learner/local",
    topicId: ROTATION_TOPIC,
    assessmentsCompleted: 1,
    questionsAnswered: 2,
    questionsCorrect: 1,
    questionsIncorrect: 1,
    questionsUnanswered: 0,
    score: 1,
    percentage: 50,
    lastActivityAt: "2026-09-02T10:00:00.000Z",
    performanceState: "active",
    isCompleted: false,
  };
}

const contractVerifierProvider: AiProvider = {
  async complete(input) {
    return {
      status: "success",
      text: `Generated explanation for ${input.request.intent}`,
    };
  },
};

export async function runAiIntelligenceVerification(): Promise<string[]> {
  const passed: string[] = [];

  assert(AI_SCHEMA_VERSION === 1, "AI schema version is 1");
  assert(AI_INTENTS.length === 4, "Phase 6A intents are limited");
  assert(AI_INTENTS.includes("knowledge-answer"), "knowledge-answer intent exists");
  assert(AI_INTENTS.includes("explain-topic"), "explain-topic intent exists");
  assert(AI_INTENTS.includes("explain-concept"), "explain-concept intent exists");
  assert(AI_INTENTS.includes("explain-assessment"), "explain-assessment intent exists");
  passed.push("AI contracts exist with explicit intents");

  const created = expectSuccess(
    createAiRequest({
      requestId: "ai-request/demo-1",
      intent: "explain-topic",
      text: "Explain Earth's Rotation",
      context: { references: [] },
    }),
    "create request",
  );
  assert(created.requestId === "ai-request/demo-1", "requestId is preserved");
  assert(isAiRequestId(created.requestId), "requestId is an AI request identity");
  assert(isDistinct(created.requestId, ROTATION_TOPIC), "requestId is not a topic id");
  assert(isDistinct(created.requestId, "learner/local"), "requestId is not a learner id");
  assert(isDistinct(created.requestId, ROTATION_SET), "requestId is not an assessment-set id");
  const encodedRequest = JSON.stringify(created);
  assert(JSON.stringify(JSON.parse(encodedRequest)) === encodedRequest, "request is JSON-safe");
  passed.push("request identity is independent and JSON-safe");

  expectFailure(
    createAiRequest({
      requestId: ROTATION_TOPIC,
      intent: "explain-topic",
      text: "Explain Earth's Rotation",
    }),
    "validation_failure",
    "canonical topic id is not a request id",
  );
  expectFailure(
    createAiRequest({
      requestId: "ai-request/demo-bad",
      intent: "chat" as AiRequest["intent"],
      text: "Hello",
    }),
    "validation_failure",
    "unknown intent",
  );
  expectFailure(
    createAiRequest({
      requestId: "ai-request/demo-empty",
      intent: "knowledge-answer",
      text: "   ",
    }),
    "validation_failure",
    "empty input",
  );
  expectFailure(
    validateAiRequest({
      schemaVersion: 1,
      requestId: "ai-request/demo-payload",
      intent: "explain-topic",
      input: { text: "Explain" },
      context: {
        references: [],
        payload: { module: "geography-data", field: "sections.mcqPractice" },
      },
    }),
    "validation_failure",
    "payload in context",
  );
  passed.push("malformed requests are rejected");

  const search = expectSuccess(searchKnowledge("rotation", { limit: 25 }), "phase 5 search");
  const projected = projectSearchResultsToAiContext(search.results);
  assert(projected.length === search.results.length, "projection preserves result count");
  const topicRef = projected.find((item) => item.id === ROTATION_TOPIC && item.kind === "topic");
  const searchTopic = search.results.find((item) => item.id === ROTATION_TOPIC);
  assert(topicRef !== undefined, "Earth's Rotation is projected from search");
  assert(topicRef?.score === searchTopic?.score, "search score is copied, not recalculated");
  assert(topicRef?.title === "Earth's Rotation", "canonical title is preserved");
  assert(topicRef?.href === "/geography/earths-rotation", "safe href is preserved");
  const retrieved = expectSuccess(retrieveAiKnowledgeReferences("rotation", { limit: 25 }), "retrieve adapter");
  assert(JSON.stringify(retrieved) === JSON.stringify(projected), "retrieve adapter matches search projection");
  passed.push("Search results project into AI-safe context with canonical IDs");

  const assessment = expectSuccess(projectAssessmentResultToAiContext(completedResult()), "assessment projection");
  assert(assessment.assessmentSetId === ROTATION_SET, "assessment-set id is preserved");
  assert(assessment.topicId === ROTATION_TOPIC, "assessment topic id is canonical");
  assert(assessment.contentVersion === 1, "content version is recorded from the result");
  assert(assessment.result?.score === 1, "AI copies canonical score and does not rescore");
  assert(!("outcomes" in assessment), "question outcomes are not copied into AI context");
  assert(!("answer" in assessment) && !("payload" in assessment), "assessment context is answer-free");
  passed.push("assessment metadata/results enter AI context without payload");

  const composed = expectSuccess(
    composeAiRequestFromRetrieval({
      requestId: "ai-request/rotation-1",
      intent: "explain-topic",
      text: "Explain Earth's Rotation",
      query: "rotation",
      limit: 25,
      assessmentResult: completedResult(),
      topicProgress: topicProgress(),
    }),
    "compose from retrieval",
  );
  assert(composed.context.references.some((item) => item.id === ROTATION_TOPIC), "composed context includes the topic");
  assert(composed.context.assessment?.contentVersion === 1, "composed assessment keeps content version");
  assert(composed.learnerContext?.learnerId === "learner/local", "learner projection uses learner/local");
  assert(composed.learnerContext?.topicProgress?.isCompleted === false, "completion is read-only");
  assert(composed.learnerContext?.topicProgress?.performanceState === "active", "performance state is projected");
  passed.push("context is structured from search, assessment, and learner intelligence");

  const unbound = expectSuccess(await invokeAiIntelligence(composed), "unbound invoke");
  assert(unbound.status === "blocked", "unbound provider is blocked, not success");
  assert(unbound.provider.bound === false, "unbound metadata is explicit");
  assert(unbound.output.kind === "generated", "output is marked generated, not canonical");
  const invoked = expectSuccess(await invokeAiIntelligence(composed, contractVerifierProvider), "mock invoke");
  assert(invoked.status === "success", "verifier mock can complete");
  assert(invoked.responseId === "ai-response/rotation-1", "response identity is distinct from request identity");
  assert(invoked.grounding.some((item) => item.sourceId === ROTATION_TOPIC), "grounding references search sources");
  assert(invoked.output.kind === "generated", "model output remains generated prose");
  const encodedResponse = JSON.stringify(invoked);
  assert(JSON.stringify(JSON.parse(encodedResponse)) === encodedResponse, "response is JSON-safe");
  passed.push("provider interface is provider-independent and grounding is recorded");

  const leaky: AiProvider = {
    async complete() {
      return { status: "success", text: "See src/lib/geography-data.ts" };
    },
  };
  expectFailure(await invokeAiIntelligence(composed, leaky), "blocked", "internal path in provider output");
  passed.push("forbidden internal fields and paths are rejected");

  const again = expectSuccess(
    composeAiRequestFromRetrieval({
      requestId: "ai-request/rotation-1",
      intent: "explain-topic",
      text: "Explain Earth's Rotation",
      query: "rotation",
      limit: 25,
      assessmentResult: completedResult(),
      topicProgress: topicProgress(),
    }),
    "repeat compose",
  );
  assert(JSON.stringify(again) === JSON.stringify(composed), "composition is deterministic");
  const invokedAgain = expectSuccess(await invokeAiIntelligence(composed, contractVerifierProvider), "repeat invoke");
  assert(JSON.stringify(invokedAgain) === JSON.stringify(invoked), "invocation is deterministic");
  passed.push("identical inputs produce deterministic non-provider-SDK outputs");

  const legacy = searchTopics("rotation");
  assert(legacy.some((item) => item.id === ROTATION_TOPIC), "existing searchTopics still matches Earth's Rotation");
  passed.push("Phase 5 search remains compatible");

  const runtime = [
    "src/lib/ai-intelligence/types.ts",
    "src/lib/ai-intelligence/errors.ts",
    "src/lib/ai-intelligence/request.ts",
    "src/lib/ai-intelligence/context.ts",
    "src/lib/ai-intelligence/provider.ts",
    "src/lib/ai-intelligence/response.ts",
    "src/lib/ai-intelligence/safety.ts",
    "src/lib/ai-intelligence/compose.ts",
    "src/lib/ai-intelligence/validate.ts",
    "src/lib/ai-intelligence/prompt.ts",
    "src/lib/ai-intelligence/grounding.ts",
    "src/lib/ai-intelligence/index.ts",
  ];
  for (const path of runtime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import Geography payload`);
      assert(specifier !== "react" && specifier !== "react-dom", `${path} has no React`);
      assert(!specifier.includes("next/"), `${path} has no Next.js UI`);
      assert(!specifier.includes("lib/analytics"), `${path} has no analytics`);
      assert(!specifier.includes("lib/entitlement"), `${path} has no entitlement`);
      assert(!specifier.includes("lib/commerce"), `${path} has no commerce`);
      assert(!specifier.includes("store/learner"), `${path} does not access learner storage`);
      assert(!specifier.includes("openai") && !specifier.includes("langchain"), `${path} has no provider SDK`);
    }
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not score assessments`);
    assert(!source.includes("scoreMcqAssessment"), `${path} does not invoke the scorer`);
    assert(!source.includes("applyLearnerIntelligenceUpdate"), `${path} does not mutate learner intelligence`);
    assert(!source.includes("markTopicComplete"), `${path} does not mutate completion`);
    assert(!source.includes("Date.now"), `${path} does not use Date.now`);
    assert(!source.includes("Math.random"), `${path} does not use Math.random`);
    assert(!source.includes("localStorage.getItem") && !source.includes("localStorage.setItem"), `${path} does not access browser storage`);
    assert(!source.includes("process.env"), `${path} does not read secrets`);
    assert(!source.includes("fetch("), `${path} has no fetch`);
    assert(!source.includes("from \"openai\"") && !source.includes("from \"@anthropic"), `${path} has no provider SDK import`);
  }
  passed.push("AI remains independent of Geography payload, scoring, learner mutation, analytics, commerce, API, React, and RAG");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-ai.ts");

if (executedFromCli) {
  const passed = await runAiIntelligenceVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("AI_INTELLIGENCE_VERIFICATION: PASS");
}
