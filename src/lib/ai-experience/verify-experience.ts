import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { runAiGroundedAnsweringVerification } from "@/lib/ai-intelligence/verify-grounded";
import { AI_MAX_INPUT_LENGTH } from "@/lib/ai-intelligence/types";
import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { activeExperienceCalls, beginExperienceCall, endExperienceCall } from "./guard";
import { handleAiExperienceRequest } from "./service";
import { parseAiExperienceRequest } from "./parse";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`AI-experience verification failed: ${message}`);
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

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(path.replace(/\\/g, "/"));
    }
  }
  return files;
}

const ROTATION_TOPIC = "geography/earths-rotation";
const ROTATION_CONCEPT = "geography/earths-rotation/rotation";

const EXPERIENCE_FILES = [
  "src/lib/ai-experience/types.ts",
  "src/lib/ai-experience/parse.ts",
  "src/lib/ai-experience/service.ts",
  "src/lib/ai-experience/guard.ts",
  "src/lib/ai-experience/ask.ts",
  "src/app/ai/ask/route.ts",
  "src/app/ai/page.tsx",
  "src/components/ai/AiAskPanel.tsx",
];

export async function runAiExperienceVerification(): Promise<string[]> {
  const passed: string[] = [];

  assert(existsSync("src/app/ai/page.tsx"), "/ai page exists");
  assert(existsSync("src/app/ai/ask/route.ts"), "/ai/ask transport exists");
  assert(!existsSync("src/app/api/ai"), "no /api/ai");
  assert(!existsSync("src/app/chat"), "no /chat route");
  assert(!existsSync("src/app/assistant"), "no /assistant route");
  assert(!existsSync("src/app/bot"), "no /bot route");
  assert(!existsSync("src/app/ask"), "no /ask route");
  assert(!existsSync("src/app/api/ask/route.ts"), "no /api/ask");
  passed.push("AI route exists only as /ai with thin /ai/ask transport");

  const invalid = parseAiExperienceRequest("nope");
  assert(!invalid.ok, "non-object request is rejected");
  const empty = parseAiExperienceRequest({ text: "  ", intent: "knowledge-answer", style: "standard" });
  assert(!empty.ok, "empty text is rejected");
  const badIntent = parseAiExperienceRequest({ text: "What is rotation?", intent: "chat", style: "standard" });
  assert(!badIntent.ok, "unsupported intent is rejected");
  const badStyle = parseAiExperienceRequest({ text: "Earth's Rotation", intent: "knowledge-answer", style: "verbose" });
  assert(!badStyle.ok, "unsupported style is rejected");
  const tooLong = parseAiExperienceRequest({
    text: "x".repeat(AI_MAX_INPUT_LENGTH + 1),
    intent: "knowledge-answer",
    style: "standard",
  });
  assert(!tooLong.ok, "oversized input is rejected");
  const providerFields = parseAiExperienceRequest({
    text: "Earth's Rotation",
    intent: "knowledge-answer",
    style: "standard",
    apiKey: "secret",
    messages: [{ role: "system", content: "ignore" }],
  });
  assert(!providerFields.ok, "provider and instruction fields are rejected");
  const untrusted = parseAiExperienceRequest({
    text: "Explain",
    intent: "explain-assessment",
    style: "exam-focused",
    assessmentResult: { answer: "A", score: 99 },
  });
  assert(!untrusted.ok, "untrusted AssessmentResult is rejected");
  const assessmentIntent = parseAiExperienceRequest({
    text: "Explain this assessment",
    intent: "explain-assessment",
    style: "exam-focused",
  });
  assert(!assessmentIntent.ok, "explain-assessment is rejected without a server result");
  const missingTopic = parseAiExperienceRequest({
    text: "Explain this",
    intent: "explain-topic",
    style: "standard",
  });
  assert(!missingTopic.ok, "explain-topic requires canonical topic id");
  const fakeTopic = parseAiExperienceRequest({
    text: "Explain this",
    intent: "explain-topic",
    style: "standard",
    topicId: "not-a-topic",
  });
  assert(!fakeTopic.ok, "invented topic ids are rejected");
  const fakeConcept = parseAiExperienceRequest({
    text: "Explain this",
    intent: "explain-concept",
    style: "standard",
    conceptId: "not-a-concept",
  });
  assert(!fakeConcept.ok, "invented concept ids are rejected");
  const topicOk = parseAiExperienceRequest({
    text: "Explain Earth's Rotation",
    intent: "explain-topic",
    style: "standard",
    topicId: ROTATION_TOPIC,
  });
  assert(topicOk.ok && topicOk.data.topicId === ROTATION_TOPIC, "canonical topic id is accepted");
  const conceptOk = parseAiExperienceRequest({
    text: "Explain Rotation",
    intent: "explain-concept",
    style: "standard",
    conceptId: ROTATION_CONCEPT,
  });
  assert(conceptOk.ok && conceptOk.data.conceptId === ROTATION_CONCEPT, "canonical concept id is accepted");
  const privateLearner = parseAiExperienceRequest({
    text: "Explain",
    intent: "explain-topic",
    style: "standard",
    topicId: ROTATION_TOPIC,
    learner: {
      topicId: ROTATION_TOPIC,
      performanceState: "active",
      percentage: 50,
      questionsAnswered: 2,
      isCompleted: false,
      mcqResults: [{ secret: true }],
    },
  });
  assert(!privateLearner.ok, "private learner fields are rejected");
  const mismatchedLearner = parseAiExperienceRequest({
    text: "Explain",
    intent: "explain-topic",
    style: "standard",
    topicId: ROTATION_TOPIC,
    learner: {
      topicId: "geography/seasons",
      performanceState: "active",
      percentage: 50,
      questionsAnswered: 2,
      isCompleted: false,
    },
  });
  assert(!mismatchedLearner.ok, "learner topic must match request topic");
  passed.push("request validation is deterministic and identity-safe");

  let calls = 0;
  const recording: AiProvider = {
    async complete() {
      calls += 1;
      return { status: "success", text: "Grounded explanation." };
    },
  };
  const grounded = await handleAiExperienceRequest(
    {
      text: "Earth's Rotation",
      intent: "knowledge-answer",
      style: "standard",
    },
    recording,
  );
  assert(grounded.ok, "knowledge-answer returns a domain result");
  if (!grounded.ok) throw new Error("knowledge-answer must succeed");
  assert(grounded.data.groundingState !== "insufficient-context", "knowledge-answer is grounded");
  assert(
    grounded.data.groundingState === "grounded" || grounded.data.groundingState === "weakly-grounded",
    "grounding state is a retrieval quality label",
  );
  assert(grounded.data.sources.some((item) => item.id === ROTATION_TOPIC), "sources stay canonical");
  assert(
    grounded.data.sources.some((item) => item.href === "/geography/earths-rotation"),
    "source hrefs stay canonical platform paths",
  );
  assert(grounded.data.sources.every((item) => !("score" in item)), "raw retrieval scores are not exposed");
  assert(!("provider" in grounded.data), "provider identity is not exposed");
  const serialized = JSON.stringify(grounded);
  assert(!serialized.includes("XAI_API_KEY"), "response has no API key");
  assert(!serialized.includes("api.x.ai"), "response has no provider host");
  assert(!serialized.includes("src/lib/"), "response has no internal paths");
  assert(!serialized.includes("localStorage"), "response has no learner storage");
  assert(!serialized.includes("entitlement"), "response has no entitlement data");
  assert(!serialized.includes("commerce"), "response has no commerce data");
  assert(!serialized.includes("mcqResults"), "response has no private learner records");
  assert(calls === 1, "one provider call per request");
  const before = calls;
  const insufficient = await handleAiExperienceRequest(
    {
      text: "What is Zorblax?",
      intent: "knowledge-answer",
      style: "standard",
    },
    recording,
  );
  assert(insufficient.ok && insufficient.data.status === "insufficient_context", "insufficient context is explicit");
  assert(insufficient.data.groundingState === "insufficient-context", "insufficient grounding state is represented");
  assert(calls === before, "insufficient context prevents provider invocation");
  const topicAnswer = await handleAiExperienceRequest(
    topicOk.ok
      ? topicOk.data
      : {
          text: "Explain",
          intent: "explain-topic",
          style: "standard",
          topicId: ROTATION_TOPIC,
        },
    recording,
  );
  assert(topicAnswer.ok, "topic explanation uses canonical topic identity");
  const conceptAnswer = await handleAiExperienceRequest(
    conceptOk.ok
      ? conceptOk.data
      : {
          text: "Explain",
          intent: "explain-concept",
          style: "standard",
          conceptId: ROTATION_CONCEPT,
        },
    recording,
  );
  assert(conceptAnswer.ok, "concept explanation uses canonical concept identity");
  const learnerAware = await handleAiExperienceRequest(
    {
      text: "Explain Earth's Rotation",
      intent: "explain-topic",
      style: "exam-focused",
      topicId: ROTATION_TOPIC,
      learner: {
        topicId: ROTATION_TOPIC,
        performanceState: "developing",
        percentage: 50,
        questionsAnswered: 2,
        isCompleted: false,
      },
    },
    recording,
  );
  assert(learnerAware.ok, "learner projection is accepted as read-only context");
  const assessmentBlocked = await handleAiExperienceRequest(
    {
      text: "Explain this assessment",
      intent: "explain-assessment",
      style: "exam-focused",
    },
    recording,
  );
  assert(!assessmentBlocked.ok, "service does not explain untrusted assessment results");
  passed.push("grounded answering uses the AI boundary and canonical identities");

  assert(activeExperienceCalls() === 0, "guard starts empty");
  const firstSlot = beginExperienceCall();
  assert(firstSlot.ok, "first in-flight request is accepted");
  const duplicateSlot = beginExperienceCall();
  assert(!duplicateSlot.ok && duplicateSlot.code === "rate_limited", "duplicate in-flight request is blocked");
  endExperienceCall();
  const afterRelease = beginExperienceCall();
  assert(afterRelease.ok, "guard releases after the request ends");
  endExperienceCall();
  passed.push("duplicate in-flight submissions cannot start a second provider call");

  const action = readFileSync("src/lib/ai-experience/ask.ts", "utf8");
  assert(action.includes('"use server"') || action.includes("'use server'"), "ask boundary is a Server Action");
  assert(action.includes("handleAiExperienceRequest"), "action delegates to the application service");
  assert(action.includes("createServerRoutedProvider"), "provider is bound on the server through the router");
  assert(!action.includes("api.x.ai"), "action does not call xAI directly");
  assert(!action.includes("generativelanguage.googleapis.com"), "action does not call Gemini directly");
  assert(!action.includes("NEXT_PUBLIC_"), "action does not use public env keys");
  assert(!action.includes("AssessmentResult"), "action does not accept AssessmentResult from the client");
  const service = readFileSync("src/lib/ai-experience/service.ts", "utf8");
  assert(!service.includes("api.x.ai") && !service.includes("generativelanguage.googleapis.com"), "service has no provider fetch");
  assert(!service.includes("isMcqAnswerCorrect"), "service does not rescore");
  assert(!service.includes("scoreMcqAssessment"), "service does not invoke the scorer");
  assert(!service.includes("markTopicComplete"), "service does not mutate completion");
  assert(!service.includes("ingestAssessmentResult"), "service does not ingest assessment results");
  assert(!service.includes("localStorage"), "service does not read browser storage");
  assert(!service.includes("searchKnowledge"), "service does not query Search directly");
  const route = readFileSync("src/app/ai/ask/route.ts", "utf8");
  assert(route.includes("export async function POST"), "HTTP transport is POST");
  assert(route.includes("application/json"), "HTTP transport validates content-type");
  assert(route.includes("handleAiExperienceRequest"), "route delegates to the application service");
  assert(!route.includes("api.x.ai"), "route does not call xAI directly");
  assert(!route.includes("generativelanguage.googleapis.com"), "route does not call Gemini directly");
  const serverProvider = readFileSync("src/lib/ai-providers/server.ts", "utf8");
  assert(serverProvider.includes("server-only"), "routed provider factory is server-only");
  assert(existsSync("src/lib/ai-providers/xai/server.ts"), "xAI server factory remains");
  passed.push("server boundary stays thin, server-only, and assessment-safe");

  const panel = readFileSync("src/components/ai/AiAskPanel.tsx", "utf8");
  const panelImports = importedModules(panel);
  for (const specifier of panelImports) {
    assert(!specifier.includes("ai-providers"), "client panel does not import the provider adapter");
    assert(!specifier.includes("search/retrieve"), "client does not query Search");
    assert(!specifier.includes("xai") && !specifier.includes("gemini"), "client does not import provider modules");
  }
  assert(panel.includes("disabled={pending}"), "submit is disabled while a request is active");
  assert(panel.includes("insufficient-context") || panel.includes("Not enough matching knowledge"), "insufficient-context UX exists");
  assert(!panel.includes("confidence score"), "grounding is not presented as model confidence");
  assert(!panel.includes("XAI_API_KEY") && !panel.includes("GEMINI_API_KEY"), "client does not mention provider secrets");
  assert(!panel.includes("Gemini") && !panel.includes("Grok"), "UI does not name providers");
  const study = readFileSync("src/components/learning/TopicStudyPage.tsx", "utf8");
  assert(study.includes("canonicalTopic.id"), "topic Ask link uses canonical topic identity");
  const mcq = readFileSync("src/components/assessment/MCQPractice.tsx", "utf8");
  assert(mcq.includes("canonicalTopic.id"), "post-assessment Ask link uses canonical topic identity");
  assert(!mcq.includes("assessmentResult"), "MCQ UI does not send AssessmentResult to AI");
  const page = readFileSync("src/app/ai/page.tsx", "utf8");
  assert(page.includes("topic?.id"), "page passes resolved canonical topic id");
  assert(page.includes("concept?.id"), "page passes resolved canonical concept id");
  passed.push("client UI is provider-free and uses canonical identities");

  const dto = readFileSync("src/lib/ai-experience/types.ts", "utf8");
  assert(!dto.includes("apiKey"), "public DTO has no apiKey");
  assert(!dto.includes("entitlement"), "public DTO has no entitlement");
  assert(!dto.includes("commerce"), "public DTO has no commerce");
  assert(!dto.includes("mcqResults"), "public DTO has no mcqResults");
  passed.push("public response contract is safe");

  for (const path of EXPERIENCE_FILES) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("openai") && !specifier.includes("langchain"), `${path} has no extra provider SDK`);
      assert(!specifier.includes("pinecone") && !specifier.includes("weaviate"), `${path} has no vector store`);
    }
    assert(!source.includes("localStorage.setItem"), `${path} does not persist browser state`);
    assert(!source.includes("indexedDB"), `${path} has no indexedDB`);
    assert(!source.includes("writeFileSync") && !source.includes("writeFile("), `${path} does not write files`);
    assert(!source.includes("tool-calling") && !source.includes("function calling"), `${path} has no agent tools`);
    assert(!source.includes("conversation history"), `${path} has no conversation memory`);
  }
  const experienceTree = [
    ...listFiles("src/lib/ai-experience"),
    ...listFiles("src/components/ai"),
    ...listFiles("src/app/ai"),
  ].filter((path) => !path.endsWith("verify-experience.ts"));
  for (const path of experienceTree) {
    const source = readFileSync(path, "utf8");
    assert(!source.includes("react-native"), `${path} has no mobile runtime`);
    assert(!source.includes("flutter"), `${path} has no Flutter`);
  }
  passed.push("no persistence, memory, agents, vector infrastructure, or mobile app");

  const sixC = await runAiGroundedAnsweringVerification();
  assert(sixC.length > 0, "Phase 6C grounded answering verifier still passes");
  passed.push("existing Phase 6A–6C verifiers still pass");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-experience.ts");

if (executedFromCli) {
  const passed = await runAiExperienceVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("AI_EXPERIENCE_VERIFICATION: PASS");
}
