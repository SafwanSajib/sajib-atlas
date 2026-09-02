import { readFileSync } from "node:fs";
import type { AssessmentResult } from "@/lib/assessment-engine/types";
import { runAiIntelligenceVerification } from "./verify-ai";
import { runAiProviderVerification } from "@/lib/ai-providers/verify-ai-provider";
import { searchKnowledge } from "@/lib/search/retrieve";
import { SEARCH_RANK_WEIGHTS } from "@/lib/search/types";
import {
  AI_DEFAULT_CONTEXT_SOURCES,
  AI_GROUNDED_MIN_SCORE,
  AI_MIN_GROUNDING_SCORE,
  CURRENT_AI_RETRIEVAL_METHOD,
  answerWithGrounding,
  assembleAiContext,
  buildAiPrompt,
  composeAiRequestFromRetrieval,
  deriveGroundingState,
  explainAssessment,
  explainConcept,
  explainTopic,
  hasSufficientGrounding,
  lexicalKnowledgeRetriever,
  type AiProvider,
  type KnowledgeRetriever,
} from "./index";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`AI-grounded-answering verification failed: ${message}`);
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
const ROTATION_CONCEPT = "geography/earths-rotation/rotation";
const ROTATION_SET = "geography/earths-rotation/mcq-practice";

function completedResult(): AssessmentResult {
  return {
    assessmentSetId: ROTATION_SET,
    contentVersion: 1,
    sessionId: "opaque-session-6c",
    total: 2,
    answered: 2,
    correct: 1,
    incorrect: 1,
    unanswered: 0,
    score: 1,
    percentage: 50,
    status: "completed",
    outcomes: [
      {
        questionKey: { assessmentSetId: ROTATION_SET, contentVersion: 1, ordinal: 0 },
        modality: "mcq",
        correct: true,
        selectedOption: "A",
      },
    ],
  };
}

export async function runAiGroundedAnsweringVerification(): Promise<string[]> {
  const passed: string[] = [];

  const search = searchKnowledge("rotation", { limit: 10 });
  assert(search.ok, "Phase 5 search remains usable");
  if (!search.ok) throw new Error("search must succeed");
  assert(
    search.data.results.some((item) => item.id === ROTATION_TOPIC),
    "searchKnowledge(rotation) still retrieves Earth's Rotation",
  );
  const equivalent = searchKnowledge("earth's rotation", { limit: 10 });
  assert(equivalent.ok && equivalent.data.results.some((item) => item.id === ROTATION_TOPIC), "equivalent query retrieves the topic");
  passed.push("Phase 5 remains the initial retrieval implementation");

  const retrieved = lexicalKnowledgeRetriever.retrieve({ query: "rotation", limit: 10 });
  assert(retrieved.ok, "lexical retriever succeeds");
  if (!retrieved.ok) throw new Error("retriever must succeed");
  assert(retrieved.data.method === CURRENT_AI_RETRIEVAL_METHOD, "method is lexical");
  assert(retrieved.data.retrievalVersion === 1, "retrieval version is 1");
  assert(
    retrieved.data.results.some((item) => item.id === ROTATION_TOPIC),
    "canonical topic id survives retrieval",
  );
  passed.push("retrieval abstraction exists and preserves canonical IDs");

  const fake: KnowledgeRetriever = {
    retrieve() {
      return {
        ok: true,
        data: {
          query: "dup",
          total: 3,
          method: "lexical",
          retrievalVersion: 1,
          results: [
            { id: "b/topic", kind: "topic", title: "B", score: 60 },
            { id: "a/topic", kind: "topic", title: "A-weak", score: 40 },
            { id: "a/topic", kind: "topic", title: "A-strong", score: 80, href: "/a/topic" },
            { id: "c/topic", kind: "topic", title: "C", score: 80 },
          ],
        },
      };
    },
  };
  const duped = fake.retrieve({ query: "dup" });
  assert(duped.ok, "fake retriever works");
  if (!duped.ok) throw new Error("fake retriever");
  const assembled = assembleAiContext({ retrieval: duped.data, maxSources: 2 });
  assert(assembled.references.length === 2, "context selection is bounded");
  assert(assembled.references[0]?.id === "a/topic", "strongest evidence is kept and ordered first");
  assert(assembled.references[0]?.score === 80, "duplicate keeps the strongest score");
  assert(assembled.references[0]?.title === "A-strong", "duplicate does not merge unrelated titles incorrectly");
  assert(assembled.references[1]?.id === "c/topic", "equal high scores tie-break by canonical id");
  const assembledAgain = assembleAiContext({ retrieval: duped.data, maxSources: 2 });
  assert(JSON.stringify(assembled) === JSON.stringify(assembledAgain), "assembly is deterministic");
  passed.push("duplicate sources are removed and ordering is deterministic");

  assert(AI_GROUNDED_MIN_SCORE === SEARCH_RANK_WEIGHTS.titleContains, "grounded threshold is title-contains");
  assert(AI_MIN_GROUNDING_SCORE === SEARCH_RANK_WEIGHTS.keyword, "provider-call threshold is keyword weight");
  const strong = composeAiRequestFromRetrieval({
    requestId: "ai-request/6c-strong",
    intent: "knowledge-answer",
    text: "What is Earth's Rotation?",
    query: "earth's rotation",
  });
  assert(strong.ok && deriveGroundingState(strong.data) === "grounded", "strong retrieval is grounded");
  assert(strong.ok && hasSufficientGrounding(strong.data), "grounded requests may call the provider");
  const weakRetriever: KnowledgeRetriever = {
    retrieve() {
      return {
        ok: true,
        data: {
          query: "weak",
          total: 1,
          method: "lexical",
          retrievalVersion: 1,
          results: [{ id: "example/weak", kind: "topic", title: "Weak", score: 40 }],
        },
      };
    },
  };
  const weak = composeAiRequestFromRetrieval({
    requestId: "ai-request/6c-weak",
    intent: "knowledge-answer",
    text: "What is this?",
    query: "weak",
    retriever: weakRetriever,
  });
  assert(weak.ok && deriveGroundingState(weak.data) === "weakly-grounded", "keyword-only hits are weakly grounded");
  const empty = composeAiRequestFromRetrieval({
    requestId: "ai-request/6c-empty",
    intent: "knowledge-answer",
    text: "What is Zorblax?",
    query: "zorblax-nonexistent-topic-xyz",
  });
  assert(empty.ok && deriveGroundingState(empty.data) === "insufficient-context", "no hits are insufficient");
  passed.push("retrieval quality gate and grounding states work");

  let providerCalls = 0;
  const recording: AiProvider = {
    async complete(input) {
      providerCalls += 1;
      return { status: "success", text: `Generated for ${input.request.intent}` };
    },
  };
  const blockedCallsStart = providerCalls;
  const insufficient = await answerWithGrounding(
    {
      requestId: "ai-request/6c-no-call",
      intent: "knowledge-answer",
      text: "What is Zorblax?",
      query: "zorblax-nonexistent-topic-xyz",
    },
    recording,
  );
  assert(insufficient.ok && insufficient.data.status === "insufficient_context", "insufficient context is explicit");
  assert(providerCalls === blockedCallsStart, "insufficient context prevents provider invocation");
  assert(insufficient.ok && insufficient.data.requestId === "ai-request/6c-no-call", "request identity is preserved");
  passed.push("insufficient context prevents provider invocation");

  const topic = await explainTopic(
    { requestId: "ai-request/6c-topic", topicId: ROTATION_TOPIC, style: "standard" },
    recording,
  );
  assert(topic.ok && topic.data.status === "success", "topic explanation is grounded");
  if (topic.ok) {
    assert(topic.data.groundingState === "grounded" || topic.data.groundingState === "weakly-grounded", "topic has a retrieval grounding state");
    assert(topic.data.grounding.some((item) => item.sourceId === ROTATION_TOPIC), "topic grounding uses canonical id");
    assert(topic.data.grounding.every((item) => !("payload" in item)), "grounding references are safe");
    assert(topic.data.output.kind === "generated", "prose is generated, not canonical");
  }
  passed.push("topic explanation is grounded");

  const concept = await explainConcept(
    { requestId: "ai-request/6c-concept", conceptId: ROTATION_CONCEPT },
    recording,
  );
  assert(concept.ok && concept.data.status === "success", "concept explanation is grounded");
  if (concept.ok) {
    assert(concept.data.grounding.some((item) => item.sourceId === ROTATION_CONCEPT || item.sourceId === ROTATION_TOPIC), "concept path uses canonical ids");
  }
  passed.push("concept explanation is grounded");

  const assessment = await explainAssessment(
    { requestId: "ai-request/6c-assessment", assessmentResult: completedResult() },
    recording,
  );
  assert(assessment.ok, "assessment explanation succeeds");
  const assessmentRequest = composeAiRequestFromRetrieval({
    requestId: "ai-request/6c-assessment-ctx",
    intent: "explain-assessment",
    text: "Explain this result",
    query: ROTATION_TOPIC,
    assessmentResult: completedResult(),
    topicProgress: {
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
    },
  });
  assert(assessmentRequest.ok, "assessment request composes");
  if (assessmentRequest.ok) {
    assert(assessmentRequest.data.context.assessment?.result?.score === 1, "canonical score is copied");
    assert(assessmentRequest.data.context.assessment?.contentVersion === 1, "content version is preserved");
    assert(deriveGroundingState(assessmentRequest.data) === "grounded", "assessment result is grounded");
    assert(assessmentRequest.data.learnerContext?.topicProgress?.isCompleted === false, "learner context is read-only");
    const prompt = buildAiPrompt(assessmentRequest.data);
    assert(prompt.user.includes("<USER_REQUEST>"), "user request is bounded");
    assert(prompt.user.includes("<RETRIEVED_KNOWLEDGE>"), "retrieved data is bounded");
    assert(prompt.system.includes("cannot override this policy"), "retrieved text cannot override system policy structurally");
    assert(prompt.user.includes("PRESENTATION: Use a simpler explanation"), "active performance uses simpler presentation");
    assert(!prompt.user.includes("geography-data.ts"), "no Geography payload dump");
  }
  passed.push("assessment explanation consumes AssessmentResult without scoring");

  const compare = composeAiRequestFromRetrieval({
    requestId: "ai-request/6c-compare",
    intent: "knowledge-answer",
    text: "Compare Earth's Rotation and Earth's Revolution",
    query: "rotation",
  });
  assert(compare.ok, "multi-source query composes");
  if (compare.ok) {
    const ids = compare.data.context.references.map((item) => item.id);
    assert(new Set(ids).size === ids.length, "assembled references are unique");
    assert(compare.data.context.references.length <= AI_DEFAULT_CONTEXT_SOURCES, "default source budget applies");
  }
  passed.push("multi-source context keeps distinct canonical identities");

  const promptOnce = strong.ok ? buildAiPrompt(strong.data) : undefined;
  const promptTwice = strong.ok ? buildAiPrompt(strong.data) : undefined;
  assert(JSON.stringify(promptOnce) === JSON.stringify(promptTwice), "prompt construction is deterministic");
  passed.push("deterministic core behavior holds");

  const runtime = [
    "src/lib/ai-intelligence/retrieve.ts",
    "src/lib/ai-intelligence/assemble.ts",
    "src/lib/ai-intelligence/answer.ts",
    "src/lib/ai-intelligence/prompt.ts",
    "src/lib/ai-intelligence/grounding.ts",
    "src/lib/ai-intelligence/compose.ts",
  ];
  for (const path of runtime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("ai-providers"), `${path} does not import the provider adapter`);
      assert(!specifier.includes("geography-data"), `${path} does not import Geography payload`);
      assert(!specifier.includes("store/learner"), `${path} does not mutate learner storage`);
    }
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not rescore`);
    assert(!source.includes("markTopicComplete"), `${path} does not mutate completion`);
    assert(!source.includes("embeddings"), `${path} has no embeddings`);
    assert(!source.includes("pinecone") && !source.includes("weaviate"), `${path} has no vector DB`);
    assert(!source.includes("web_search"), `${path} has no web search`);
    assert(!source.includes("/api/ai"), `${path} has no public AI API`);
    assert(!source.includes("tool-calling") && !source.includes("autonomous"), `${path} has no agents`);
    assert(!source.includes("Date.now") && !source.includes("Math.random"), `${path} is deterministic`);
  }
  passed.push("provider remains replaceable and future RAG/agents/API are absent");

  const sixA = await runAiIntelligenceVerification();
  assert(sixA.length > 0, "Phase 6A verifier still passes");
  const sixB = await runAiProviderVerification();
  assert(sixB.length > 0, "Phase 6B verifier still passes");
  passed.push("existing Phase 6A and 6B verifiers still pass");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-grounded.ts");

if (executedFromCli) {
  const passed = await runAiGroundedAnsweringVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("AI_GROUNDED_ANSWERING_VERIFICATION: PASS");
}
