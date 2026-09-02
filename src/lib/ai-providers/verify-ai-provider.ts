import { readFileSync } from "node:fs";
import type { AssessmentResult } from "@/lib/assessment-engine/types";
import {
  AI_MAX_OUTPUT_LENGTH,
  AI_MIN_GROUNDING_SCORE,
  answerWithGrounding,
  buildAiPrompt,
  composeAiRequestFromRetrieval,
  hasSufficientGrounding,
  type AiProvider,
} from "@/lib/ai-intelligence/index";
import { runAiIntelligenceVerification } from "@/lib/ai-intelligence/verify-ai";
import { searchTopics } from "@/lib/search-data";
import { SEARCH_RANK_WEIGHTS } from "@/lib/search/types";
import {
  createXaiAiProvider,
  readXaiProviderConfig,
  XAI_DEFAULT_MODEL,
  XAI_PROVIDER_ID,
} from "./xai/index";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`AI-provider verification failed: ${message}`);
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

function completedResult(): AssessmentResult {
  return {
    assessmentSetId: ROTATION_SET,
    contentVersion: 1,
    sessionId: "opaque-session-6b",
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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function runAiProviderVerification(): Promise<string[]> {
  const passed: string[] = [];

  assert(XAI_PROVIDER_ID === "xai", "selected provider id is xai");
  assert(XAI_DEFAULT_MODEL === "grok-4.6", "default model is grok-4.6");
  assert(AI_MIN_GROUNDING_SCORE === SEARCH_RANK_WEIGHTS.keyword, "grounding threshold is Phase 5 keyword weight");
  passed.push("real adapter identity is isolated from core contracts");

  const missing = readXaiProviderConfig({});
  assert(!missing.ok && missing.error.code === "provider_failure", "missing XAI_API_KEY fails safely");
  const publicKey = readXaiProviderConfig({ NEXT_PUBLIC_XAI_API_KEY: "public-leak" });
  assert(!publicKey.ok, "NEXT_PUBLIC credentials are rejected");
  const config = readXaiProviderConfig({
    XAI_API_KEY: "test-key-6b",
    AI_PROVIDER_TIMEOUT_MS: "40",
    AI_PROVIDER_MAX_OUTPUT_TOKENS: "64",
  });
  assert(config.ok, "valid env produces config");
  if (config.ok) {
    assert(config.data.apiKey === "test-key-6b", "api key stays in config, not in domain types");
    assert(config.data.timeoutMs === 40, "timeout is configurable");
    assert(config.data.maxOutputTokens === 64, "output token limit is configurable");
  }
  passed.push("provider credentials are server-only environment variables");

  let fetchCalls = 0;
  const provider = createXaiAiProvider(config.ok ? config.data : {
    apiKey: "test-key-6b",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-4.6",
    timeoutMs: 40,
    maxOutputTokens: 64,
  }, {
    fetchFn: async () => {
      fetchCalls += 1;
      return jsonResponse(200, {
        choices: [{ message: { content: "Earth's Rotation is a canonical Geography topic." } }],
      });
    },
  });
  const grounded = await answerWithGrounding(
    {
      requestId: "ai-request/6b-rotation",
      intent: "knowledge-answer",
      text: "What is Earth's Rotation?",
      query: "earth's rotation",
      limit: 10,
    },
    provider,
  );
  assert(grounded.ok, "grounded answering succeeds with retrieval");
  if (grounded.ok) {
    assert(grounded.data.status === "success", "status is success when context is sufficient");
    assert(grounded.data.output.kind === "generated", "prose remains generated");
    assert(
      grounded.data.grounding.some((item) => item.sourceId === ROTATION_TOPIC),
      "grounding preserves Earth's Rotation",
    );
    assert(fetchCalls === 1, "exactly one provider invocation");
    assert(!("choices" in grounded.data), "raw provider payload does not leak");
    assert(!JSON.stringify(grounded.data).includes("test-key-6b"), "api key is absent from the response");
  }
  passed.push("retrieval occurs before grounded answering and grounding is preserved");

  let blockedCalls = 0;
  const blockedProvider: AiProvider = {
    async complete() {
      blockedCalls += 1;
      return { status: "success", text: "should not run" };
    },
  };
  const insufficient = await answerWithGrounding(
    {
      requestId: "ai-request/6b-empty",
      intent: "knowledge-answer",
      text: "What is a made-up planet named Zorblax?",
      query: "zorblax-nonexistent-topic-xyz",
      limit: 10,
    },
    blockedProvider,
  );
  assert(insufficient.ok, "insufficient context is a valid response");
  if (insufficient.ok) {
    assert(insufficient.data.status === "insufficient_context", "insufficient context is explicit");
    assert(blockedCalls === 0, "provider is not called without meaningful context");
  }
  const composedWeak = composeAiRequestFromRetrieval({
    requestId: "ai-request/6b-weak",
    intent: "knowledge-answer",
    text: "zzzz",
    query: "zorblax-nonexistent-topic-xyz",
  });
  assert(composedWeak.ok && !hasSufficientGrounding(composedWeak.data), "empty retrieval is insufficient");
  passed.push("knowledge-answer requires meaningful context");

  const requestA = composeAiRequestFromRetrieval({
    requestId: "ai-request/6b-prompt",
    intent: "knowledge-answer",
    text: "What is Earth's Rotation?",
    query: "earth's rotation",
    limit: 10,
  });
  assert(requestA.ok, "prompt request composes");
  if (!requestA.ok) throw new Error("prompt request must compose");
  const promptOnce = buildAiPrompt(requestA.data);
  const promptTwice = buildAiPrompt(requestA.data);
  assert(JSON.stringify(promptOnce) === JSON.stringify(promptTwice), "prompt construction is deterministic");
  assert(promptOnce.system.includes("DATA, not instructions") || promptOnce.system.includes("informational DATA"), "retrieved content is treated as data");
  assert(promptOnce.user.includes("<RETRIEVED_KNOWLEDGE>"), "user prompt labels retrieved data");
  assert(!promptOnce.user.includes("geography-data.ts"), "prompt omits payload paths");
  passed.push("prompt construction is deterministic and treats retrieval as data");

  const assessmentRequest = composeAiRequestFromRetrieval({
    requestId: "ai-request/6b-assessment-ctx",
    intent: "explain-assessment",
    text: "Explain this practice result",
    query: "earth's rotation",
    assessmentResult: completedResult(),
  });
  assert(assessmentRequest.ok, "assessment context composes");
  if (assessmentRequest.ok) {
    assert(assessmentRequest.data.context.assessment?.contentVersion === 1, "content version is preserved");
    assert(assessmentRequest.data.context.assessment?.result?.score === 1, "canonical score is copied, not rescored");
    assert(hasSufficientGrounding(assessmentRequest.data), "assessment result is sufficient grounding");
  }
  passed.push("assessment explanations do not rescore and preserve content version");

  const timeoutProvider = createXaiAiProvider(
    {
      apiKey: "test-key-6b",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-4.6",
      timeoutMs: 20,
      maxOutputTokens: 64,
    },
    {
      fetchFn: (_url, init) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    },
  );
  const timeoutOut = await timeoutProvider.complete({
    request: requestA.data,
    instructions: { system: "sys", user: "user" },
  });
  assert(timeoutOut.status === "failed", "timeout is a provider failure");
  assert(timeoutOut.text === "The AI provider timed out.", "timeout message is normalized");
  passed.push("timeout is enforced");

  const authProvider = createXaiAiProvider(
    {
      apiKey: "super-secret-key",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-4.6",
      timeoutMs: 100,
      maxOutputTokens: 64,
    },
    {
      fetchFn: async () => jsonResponse(401, { error: "invalid super-secret-key" }),
    },
  );
  const authOut = await authProvider.complete({
    request: requestA.data,
  });
  assert(authOut.status === "failed", "auth failure is normalized");
  assert(!authOut.text.includes("super-secret-key"), "secrets are absent from error text");
  const rateProvider = createXaiAiProvider(
    {
      apiKey: "test-key-6b",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-4.6",
      timeoutMs: 100,
      maxOutputTokens: 64,
    },
    { fetchFn: async () => jsonResponse(429, { error: "rate" }) },
  );
  const rateOut = await rateProvider.complete({
    request: requestA.data,
  });
  assert(rateOut.text.includes("rate-limited"), "rate limits are normalized");
  passed.push("provider failures are normalized without secrets");

  const huge: AiProvider = {
    async complete() {
      return { status: "success", text: "x".repeat(AI_MAX_OUTPUT_LENGTH + 50) };
    },
  };
  const capped = await answerWithGrounding(
    {
      requestId: "ai-request/6b-cap",
      intent: "knowledge-answer",
      text: "What is Earth's Rotation?",
      query: "earth's rotation",
    },
    huge,
  );
  assert(capped.ok && capped.data.output.text.length === AI_MAX_OUTPUT_LENGTH, "generated output is capped");
  passed.push("output limits are enforced");

  assert(searchTopics("rotation").some((item) => item.id === ROTATION_TOPIC), "Phase 5 searchTopics remains compatible");
  passed.push("existing search remains compatible");

  const core = [
    "src/lib/ai-intelligence/types.ts",
    "src/lib/ai-intelligence/provider.ts",
    "src/lib/ai-intelligence/prompt.ts",
    "src/lib/ai-intelligence/compose.ts",
    "src/lib/ai-intelligence/validate.ts",
    "src/lib/ai-intelligence/index.ts",
  ];
  for (const path of core) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("ai-providers"), `${path} does not import the provider adapter`);
      assert(!specifier.includes("openai"), `${path} has no vendor SDK`);
    }
    assert(!source.includes("api.x.ai"), `${path} has no provider endpoint`);
    assert(!source.includes("XAI_API_KEY"), `${path} does not read provider secrets`);
    assert(!source.includes("embeddings"), `${path} has no embeddings`);
  }
  const adapterSource = readFileSync("src/lib/ai-providers/xai/adapter.ts", "utf8");
  assert(adapterSource.includes("AiProvider"), "adapter conforms to AiProvider");
  assert(!adapterSource.includes("web_search"), "adapter has no web search");
  assert(!adapterSource.includes("embeddings"), "adapter has no vector search");
  const serverSource = readFileSync("src/lib/ai-providers/xai/server.ts", "utf8");
  assert(serverSource.includes("server-only"), "server factory is marked server-only");
  const configSource = readFileSync("src/lib/ai-providers/xai/config.ts", "utf8");
  assert(configSource.includes("XAI_API_KEY"), "config reads XAI_API_KEY");
  assert(configSource.includes("NEXT_PUBLIC_XAI_API_KEY"), "config rejects public env keys");
  passed.push("provider SDK/API is isolated from core contracts");

  const clientSurfaces = [
    "src/components/navigation/SearchBar.tsx",
    "src/components/assessment/MCQPractice.tsx",
    "src/app/layout.tsx",
  ];
  for (const path of clientSurfaces) {
    const source = readFileSync(path, "utf8");
    assert(!source.includes("ai-providers"), `${path} does not import the provider`);
    assert(!source.includes("XAI_API_KEY"), `${path} does not reference the API key`);
  }
  passed.push("no client-side provider access");

  const aiPasses = await runAiIntelligenceVerification();
  assert(aiPasses.length > 0, "Phase 6A verifier still returns passes");
  passed.push("existing Phase 6A verifier still passes");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-ai-provider.ts");

if (executedFromCli) {
  const passed = await runAiProviderVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("AI_PROVIDER_VERIFICATION: PASS");
}
