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
import { createGeminiAiProvider } from "./gemini/adapter";
import { createAiProviderRouter } from "./router";
import { createXaiAiProvider } from "./xai/adapter";
import {
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

  let capturedBody = "";
  const bodyProvider = createXaiAiProvider(
    {
      apiKey: "test-key-6b",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-4.6",
      timeoutMs: 100,
      maxOutputTokens: 64,
    },
    {
      fetchFn: async (_url, init) => {
        capturedBody = typeof init.body === "string" ? init.body : "";
        return jsonResponse(200, { choices: [{ message: { content: "ok" } }] });
      },
    },
  );
  await bodyProvider.complete({ request: requestA.data, instructions: { system: "sys", user: "user" } });
  assert(capturedBody.includes("\"max_tokens\":64"), "Ask/default path keeps adapter token budget");
  await bodyProvider.complete({
    request: requestA.data,
    instructions: { system: "sys", user: "user" },
    limits: { maxOutputTokens: 8192, timeoutMs: 60000 },
  });
  assert(capturedBody.includes("\"max_tokens\":8192"), "optional limits override adapter defaults without changing config");
  passed.push("per-call generation limits are optional and backward compatible");

  const geminiCfg = {
    apiKey: "test-gemini-key",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-3.6-flash",
    timeoutMs: 1000,
    maxOutputTokens: 64,
  };
  const geminiOk = { candidates: [{ content: { parts: [{ text: "ok" }] } }] };
  const gemini503 = { error: { code: 503, status: "UNAVAILABLE", message: "high demand" } };
  const gemini429 = { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "quota" } };
  const geminiInput = { request: requestA.data, instructions: { system: "sys", user: "user" } };
  const noSleep = async () => undefined;

  let r1 = 0;
  const r1Provider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r1 += 1;
      if (r1 === 1) return jsonResponse(503, gemini503);
      return jsonResponse(200, geminiOk);
    },
  });
  const r1Out = await r1Provider.complete(geminiInput);
  assert(r1 === 2, "Gemini 503 then success retries exactly once");
  assert(r1Out.status === "success" && r1Out.text === "ok", "retry success is returned to the caller");
  assert(r1Out.callTrace?.attempts === 2, "503 then success records 2 Gemini attempts");
  assert(r1Out.callTrace?.retryOccurred === true, "503 then success records retryOccurred");
  assert(r1Out.callTrace?.attemptsDetail[0]?.outcome === "upstream" && r1Out.callTrace?.attemptsDetail[0]?.status === 503, "first attempt is 503/upstream");
  assert(r1Out.callTrace?.attemptsDetail[1]?.outcome === "success", "second attempt is success");
  passed.push("Gemini 503 retries once then returns success");

  let r2 = 0;
  const r2Provider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r2 += 1;
      return jsonResponse(503, gemini503);
    },
  });
  const r2Out = await r2Provider.complete(geminiInput);
  assert(r2 === 2, "double 503 makes exactly two Gemini attempts");
  assert(r2Out.status === "failed" && r2Out.text === "The AI provider is unavailable.", "final 503 remains unavailable");
  assert(r2Out.callTrace?.attempts === 2 && r2Out.callTrace.retryOccurred === true, "double 503 records two upstream attempts");
  assert(r2Out.callTrace?.attemptsDetail.every((item) => item.outcome === "upstream" && item.status === 503) === true, "both attempts are 503/unavailable");
  passed.push("Gemini 503 twice does not retry a third time");

  let r429ok = 0;
  const r429okProvider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r429ok += 1;
      if (r429ok === 1) return jsonResponse(429, gemini429);
      return jsonResponse(200, geminiOk);
    },
  });
  const r429okOut = await r429okProvider.complete(geminiInput);
  assert(r429ok === 2, "Gemini 429 then success retries exactly once");
  assert(r429okOut.status === "success" && r429okOut.text === "ok", "429 retry success is returned");
  assert(r429okOut.callTrace?.retryOccurred === true, "429 then success records retryOccurred");
  assert(r429okOut.callTrace?.attemptsDetail[0]?.outcome === "rate_limited" && r429okOut.callTrace?.attemptsDetail[0]?.status === 429, "first 429 is rate_limited");
  assert(r429okOut.callTrace?.attemptsDetail[1]?.outcome === "success" && r429okOut.callTrace?.attemptsDetail[1]?.status === 200, "second 429 retry is success");
  passed.push("Gemini 429 retries once then returns success");

  let r429twice = 0;
  const r429twiceProvider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r429twice += 1;
      return jsonResponse(429, gemini429);
    },
  });
  const r429twiceOut = await r429twiceProvider.complete(geminiInput);
  assert(r429twice === 2, "double 429 makes exactly two Gemini attempts");
  assert(r429twiceOut.status === "failed" && r429twiceOut.text === "The AI provider rate-limited the request.", "final 429 remains rate-limited");
  assert(r429twiceOut.callTrace?.attemptsDetail.every((item) => item.outcome === "rate_limited" && item.status === 429) === true, "both attempts are 429");
  passed.push("Gemini 429 twice does not retry a third time");

  let r429then503 = 0;
  const r429then503Provider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r429then503 += 1;
      if (r429then503 === 1) return jsonResponse(429, gemini429);
      return jsonResponse(503, gemini503);
    },
  });
  const r429then503Out = await r429then503Provider.complete(geminiInput);
  assert(r429then503 === 2, "429 then 503 makes exactly two attempts");
  assert(r429then503Out.callTrace?.attemptsDetail[1]?.outcome === "upstream" && r429then503Out.callTrace?.attemptsDetail[1]?.status === 503, "final 429→503 is upstream");
  passed.push("Gemini 429 then 503 stops after two attempts");

  let r503then429 = 0;
  const r503then429Provider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r503then429 += 1;
      if (r503then429 === 1) return jsonResponse(503, gemini503);
      return jsonResponse(429, gemini429);
    },
  });
  const r503then429Out = await r503then429Provider.complete(geminiInput);
  assert(r503then429 === 2, "503 then 429 makes exactly two attempts");
  assert(r503then429Out.callTrace?.attemptsDetail[1]?.outcome === "rate_limited" && r503then429Out.callTrace?.attemptsDetail[1]?.status === 429, "final 503→429 is rate_limited");
  passed.push("Gemini 503 then 429 stops after two attempts");

  for (const [label, status, body, expected] of [
    ["400", 400, { error: { code: 400, status: "INVALID_ARGUMENT", message: "bad" } }, "rejected the request"],
    ["401", 401, { error: { code: 401, status: "UNAUTHENTICATED", message: "auth" } }, "rejected authentication"],
    ["404", 404, { error: { code: 404, status: "NOT_FOUND", message: "missing" } }, "rejected the request"],
  ] as const) {
    let calls = 0;
    const provider = createGeminiAiProvider(geminiCfg, {
      sleepFn: noSleep,
      fetchFn: async () => {
        calls += 1;
        return jsonResponse(status, body);
      },
    });
    const out = await provider.complete(geminiInput);
    assert(calls === 1, `Gemini ${label} makes exactly one attempt`);
    assert(out.status === "failed" && out.text.includes(expected), `Gemini ${label} is not retried`);
    assert(out.callTrace?.attempts === 1 && out.callTrace.retryOccurred === false, `Gemini ${label} records a single attempt`);
  }
  passed.push("Gemini 400/401/404 are not retried");

  let r8 = 0;
  const r8Provider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => {
      r8 += 1;
      return jsonResponse(200, geminiOk);
    },
  });
  const r8Out = await r8Provider.complete(geminiInput);
  assert(r8 === 1 && r8Out.status === "success", "successful first Gemini response is not retried");
  assert(r8Out.callTrace?.attempts === 1 && r8Out.callTrace.retryOccurred === false, "success first attempt records attempts=1");
  assert(r8Out.callTrace?.attemptsDetail[0]?.outcome === "success", "success first attempt records success outcome");
  passed.push("successful Gemini response is a single attempt");

  const stopProvider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => jsonResponse(200, { candidates: [{ finishReason: "STOP", content: { parts: [{ text: "{\"ok\":true}" }] } }] }),
  });
  const stopOut = await stopProvider.complete(geminiInput);
  assert(stopOut.status === "success" && stopOut.text === "{\"ok\":true}", "STOP with valid JSON remains success");
  assert(stopOut.callTrace?.attemptsDetail[0]?.finishReason === "STOP", "STOP finishReason is recorded");
  passed.push("Gemini STOP finishReason is traced");

  const maxTokProvider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () =>
      jsonResponse(200, {
        candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: '{"disciplineId":"discipline/geography","sources":[{"reference":"' }] } }],
      }),
  });
  const maxTokOut = await maxTokProvider.complete(geminiInput);
  assert(maxTokOut.status === "success", "MAX_TOKENS with truncated text remains provider success");
  assert(maxTokOut.callTrace?.attemptsDetail[0]?.finishReason === "MAX_TOKENS", "MAX_TOKENS finishReason is recorded");
  assert(maxTokOut.callTrace?.attempts === 1 && maxTokOut.callTrace.retryOccurred === false, "MAX_TOKENS is not retried");
  passed.push("Gemini MAX_TOKENS finishReason is traced and not retried");

  const safetyProvider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => jsonResponse(200, { candidates: [{ finishReason: "SAFETY", content: { parts: [{ text: "blocked" }] } }] }),
  });
  const safetyOut = await safetyProvider.complete(geminiInput);
  assert(safetyOut.status === "blocked", "SAFETY remains blocked");
  assert(safetyOut.callTrace?.attemptsDetail[0]?.finishReason === "SAFETY", "SAFETY finishReason is recorded");
  assert(safetyOut.callTrace?.attempts === 1, "SAFETY is not retried");
  passed.push("Gemini SAFETY finishReason is traced");

  const prohibitedProvider = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => jsonResponse(200, { candidates: [{ finishReason: "PROHIBITED_CONTENT", content: { parts: [{ text: "blocked" }] } }] }),
  });
  const prohibitedOut = await prohibitedProvider.complete(geminiInput);
  assert(prohibitedOut.status === "blocked", "PROHIBITED_CONTENT remains blocked");
  assert(prohibitedOut.callTrace?.attemptsDetail[0]?.finishReason === "PROHIBITED_CONTENT", "PROHIBITED_CONTENT finishReason is recorded");
  passed.push("Gemini PROHIBITED_CONTENT finishReason is traced");

  const missingFinish = createGeminiAiProvider(geminiCfg, {
    sleepFn: noSleep,
    fetchFn: async () => jsonResponse(200, geminiOk),
  });
  const missingOut = await missingFinish.complete(geminiInput);
  assert(missingOut.status === "success", "missing finishReason still succeeds");
  assert(missingOut.callTrace?.attemptsDetail[0]?.finishReason === undefined, "missing finishReason is not fabricated");
  passed.push("missing finishReason is omitted");

  let geminiCalls = 0;
  let xaiCalls = 0;
  const routed = createAiProviderRouter({
    primaryId: "gemini",
    fallbackId: "xai",
    budgetMs: 1000,
    providers: {
      gemini: createGeminiAiProvider(geminiCfg, {
        sleepFn: noSleep,
        fetchFn: async () => {
          geminiCalls += 1;
          return jsonResponse(503, gemini503);
        },
      }),
      xai: createXaiAiProvider(
        { apiKey: "xai-test", baseUrl: "https://api.x.ai/v1", model: "grok-4.6", timeoutMs: 100, maxOutputTokens: 64 },
        {
          fetchFn: async () => {
            xaiCalls += 1;
            return jsonResponse(200, { choices: [{ message: { content: "fallback-ok" } }] });
          },
        },
      ),
    },
  });
  const routedOut = await routed.route(geminiInput);
  assert(geminiCalls === 2, "router fallback does not multiply Gemini retry count");
  assert(xaiCalls === 1, "router performs one fallback after Gemini is exhausted");
  assert(routedOut.output.status === "success" && routedOut.output.text === "fallback-ok", "fallback success is used");
  assert(routedOut.trace.providerCalls === 2, "router counts one Gemini logical call plus one fallback");
  passed.push("provider-router fallback does not multiply Gemini retries");

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
