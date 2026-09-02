import { existsSync, readFileSync } from "node:fs";
import { createAiRequest } from "@/lib/ai-intelligence/request";
import {
  AI_SCHEMA_VERSION,
  answerWithGrounding,
  type AiProvider,
  type AiProviderInput,
} from "@/lib/ai-intelligence/index";
import { runAiExperienceVerification } from "@/lib/ai-experience/verify-experience";
import { createFakeAiProvider, type FakeProviderRecorder } from "./fake";
import { isFallbackEligible } from "./failure";
import { createRoutedProvider } from "./factory";
import { createGeminiAiProvider } from "./gemini/adapter";
import { GEMINI_DEFAULT_MODEL, GEMINI_PROVIDER_ID, readGeminiProviderConfig } from "./gemini/config";
import { DEFAULT_GEMINI_FALLBACK, DEFAULT_PRIMARY_PROVIDER, AI_PROVIDER_REGISTRY } from "./registry";
import { createAiProviderRouter } from "./router";
import { isPrimaryProviderConfigured, readAiRoutingConfig } from "./routing-config";
import { FALLBACK_ELIGIBLE_CATEGORIES } from "./types";
import { createXaiAiProvider } from "./xai/adapter";
import { XAI_PROVIDER_ID } from "./xai/config";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`AI-provider-routing verification failed: ${message}`);
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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sampleInput(): AiProviderInput {
  const request = createAiRequest({
    requestId: "ai-request/6e-route",
    intent: "knowledge-answer",
    text: "Earth's Rotation",
    context: {
      references: [
        {
          id: "geography/earths-rotation",
          kind: "topic",
          title: "Earth's Rotation",
          href: "/geography/earths-rotation",
          score: 100,
        },
      ],
    },
  });
  assert(request.ok, "sample request is valid");
  return {
    request: request.data,
    instructions: { system: "SYS-GROUNDING", user: "USER-GROUNDING" },
  };
}

export async function runAiProviderRoutingVerification(): Promise<string[]> {
  const passed: string[] = [];

  assert(existsSync("src/lib/ai-providers/gemini/adapter.ts"), "Gemini adapter exists");
  assert(existsSync("src/lib/ai-providers/xai/adapter.ts"), "xAI adapter remains");
  assert(GEMINI_PROVIDER_ID === "gemini", "Gemini registry id is gemini");
  assert(XAI_PROVIDER_ID === "xai", "xAI registry id is xai");
  assert(DEFAULT_PRIMARY_PROVIDER === "gemini", "Gemini is the default primary");
  assert(DEFAULT_GEMINI_FALLBACK === "xai", "xAI is the default Gemini fallback");
  assert(GEMINI_DEFAULT_MODEL === "gemini-2.5-flash", "default Gemini model is gemini-2.5-flash");
  assert(AI_PROVIDER_REGISTRY.gemini.id === "gemini" && AI_PROVIDER_REGISTRY.xai.id === "xai", "registry is explicit");
  passed.push("Gemini adapter exists, xAI remains, Gemini is default primary");

  const defaultRouting = readAiRoutingConfig({});
  assert(defaultRouting.ok && defaultRouting.data.primaryId === "gemini", "unconfigured env defaults to Gemini");
  assert(defaultRouting.ok && defaultRouting.data.fallbackId === "xai", "unconfigured env defaults xAI fallback");
  const unknown = readAiRoutingConfig({ AI_PRIMARY_PROVIDER: "openai" });
  assert(!unknown.ok, "unknown primary provider fails deterministically");
  const xaiPrimary = readAiRoutingConfig({ AI_PRIMARY_PROVIDER: "xai" });
  assert(xaiPrimary.ok && xaiPrimary.data.primaryId === "xai" && xaiPrimary.data.fallbackId === undefined, "xAI primary has no implicit Gemini fallback");
  const xaiWithGemini = readAiRoutingConfig({ AI_PRIMARY_PROVIDER: "xai", AI_FALLBACK_PROVIDER: "gemini" });
  assert(xaiWithGemini.ok && xaiWithGemini.data.fallbackId === "gemini", "Gemini fallback must be explicit when xAI is primary");
  passed.push("provider registry is explicit and unknown names fail");

  const missingGemini = readGeminiProviderConfig({});
  assert(!missingGemini.ok, "missing GEMINI_API_KEY fails");
  const publicGemini = readGeminiProviderConfig({ NEXT_PUBLIC_GEMINI_API_KEY: "leak" });
  assert(!publicGemini.ok, "NEXT_PUBLIC Gemini credentials are rejected");
  const geminiCfg = readGeminiProviderConfig({ GEMINI_API_KEY: "test-gemini", GEMINI_MODEL: "gemini-2.5-flash" });
  assert(geminiCfg.ok && geminiCfg.data.model === "gemini-2.5-flash", "Gemini model is configurable with flash default");
  assert(!isPrimaryProviderConfigured({}), "missing primary key is not configured");
  const missingPrimary = createRoutedProvider({});
  assert(!missingPrimary.ok, "missing Gemini key does not silently fall back");
  const xaiOnly = createRoutedProvider({ AI_PRIMARY_PROVIDER: "xai", XAI_API_KEY: "xai-key" });
  assert(xaiOnly.ok && xaiOnly.data.primaryId === "xai", "intentional xAI-only routing is explicit");
  passed.push("secrets stay server-side and missing Gemini key does not fallback");

  const geminiAdapter = createGeminiAiProvider(geminiCfg.ok ? geminiCfg.data : {
    apiKey: "test-gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-flash",
    timeoutMs: 40,
    maxOutputTokens: 64,
  }, {
    fetchFn: async () => jsonResponse(200, {
      candidates: [{ content: { parts: [{ text: "Grounded Gemini text." }] } }],
    }),
  });
  const geminiOut = await geminiAdapter.complete(sampleInput());
  assert(geminiOut.status === "success" && geminiOut.text === "Grounded Gemini text.", "Gemini adapter implements AiProvider");
  const xaiAdapter = createXaiAiProvider({
    apiKey: "test-xai",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-4.6",
    timeoutMs: 40,
    maxOutputTokens: 64,
  }, {
    fetchFn: async () => jsonResponse(200, { choices: [{ message: { content: "Grounded xAI text." } }] }),
  });
  const xaiOut = await xaiAdapter.complete(sampleInput());
  assert(xaiOut.status === "success", "xAI adapter still implements AiProvider");
  passed.push("both adapters implement AiProvider");

  const sample = sampleInput();
  async function routePair(
    geminiBehavior: Parameters<typeof createFakeAiProvider>[1],
    xaiBehavior: Parameters<typeof createFakeAiProvider>[1],
  ) {
    const geminiRec: FakeProviderRecorder = { calls: 0, inputs: [] };
    const xaiRec: FakeProviderRecorder = { calls: 0, inputs: [] };
    const router = createAiProviderRouter({
      primaryId: "gemini",
      fallbackId: "xai",
      providers: {
        gemini: createFakeAiProvider("gemini", geminiBehavior, geminiRec),
        xai: createFakeAiProvider("xai", xaiBehavior, xaiRec),
      },
      budgetMs: 25000,
    });
    const routed = await router.route(sample);
    return { routed, geminiRec, xaiRec, router };
  }

  const success = await routePair("success", "success");
  assert(success.routed.trace.providerCalls === 1 && success.geminiRec.calls === 1 && success.xaiRec.calls === 0, "Gemini success is one call");
  assert(success.routed.trace.finalProvider === "gemini" && !success.routed.trace.fallbackAttempted, "successful primary does not fallback");
  const publicOut = await success.router.complete(sample);
  assert(!("failureCategory" in publicOut), "public complete() does not leak classification");

  const rate = await routePair("rate_limited", "success");
  assert(rate.routed.trace.fallbackAttempted && rate.routed.trace.providerCalls === 2, "rate-limit triggers one fallback");
  assert(rate.routed.trace.finalProvider === "xai" && rate.routed.output.text.startsWith("xai"), "fallback success is returned");
  assert(rate.geminiRec.inputs[0] === sample && rate.xaiRec.inputs[0] === sample, "fallback receives the same approved input");

  const timeout = await routePair("timeout", "success");
  assert(timeout.routed.trace.providerCalls === 2 && timeout.routed.trace.primaryFailureCategory === "timeout", "timeout triggers one fallback");
  const network = await routePair("network", "success");
  assert(network.routed.trace.providerCalls === 2, "network failure triggers one fallback");
  const upstream = await routePair("upstream", "success");
  assert(upstream.routed.trace.providerCalls === 2, "transient upstream failure triggers one fallback");
  const malformed = await routePair("malformed_response", "success");
  assert(malformed.routed.trace.providerCalls === 2 && malformed.routed.trace.primaryFailureCategory === "malformed_response", "malformed response falls back once");
  passed.push("eligible transient failures trigger exactly one fallback");

  const auth = await routePair("authentication", "success");
  assert(auth.xaiRec.calls === 0 && auth.routed.trace.primaryFailureCategory === "authentication", "authentication failure does not fallback");
  const configuration = await routePair("configuration", "success");
  assert(configuration.xaiRec.calls === 0, "configuration failure does not fallback");
  const invalid = await routePair("invalid_request", "success");
  assert(invalid.xaiRec.calls === 0, "invalid request does not fallback");
  const policy = await routePair("policy_blocked", "success");
  assert(policy.xaiRec.calls === 0 && policy.routed.output.status === "blocked", "policy block does not fallback");
  passed.push("non-eligible failures do not fallback");

  const bothFail = await routePair("rate_limited", "failure");
  assert(bothFail.routed.trace.providerCalls === 2 && bothFail.routed.output.status === "failed", "both-provider failure is explicit");
  assert(bothFail.routed.trace.fallbackAttempted, "trace records fallback attempt");
  assert(FALLBACK_ELIGIBLE_CATEGORIES.includes("malformed_response"), "malformed_response eligibility is documented");
  assert(!isFallbackEligible("authentication") && !isFallbackEligible("policy_blocked"), "auth and policy are not eligible");
  passed.push("maximum provider calls per request is 2 with no retry loop");

  const geminiCalls = { count: 0 };
  const liveGemini = createGeminiAiProvider({
    apiKey: "secret-gemini-key",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-flash",
    timeoutMs: 40,
    maxOutputTokens: 64,
  }, {
    fetchFn: async (_url, init) => {
      geminiCalls.count += 1;
      const body = String(init.body ?? "");
      assert(body.includes("<RETRIEVED_KNOWLEDGE>") || body.includes("Earth"), "Gemini receives approved grounded prompt text");
      assert(!body.includes("secret-gemini-key"), "Gemini body does not include the API key");
      return jsonResponse(200, { candidates: [{ content: { parts: [{ text: "Approved context answer." }] } }] });
    },
  });
  const groundedGemini = await answerWithGrounding(
    {
      requestId: "ai-request/6e-ground",
      intent: "knowledge-answer",
      text: "Earth's Rotation",
      query: "Earth's Rotation",
    },
    liveGemini,
  );
  assert(groundedGemini.ok && groundedGemini.data.groundingState !== "insufficient-context", "Gemini path stays grounded");
  assert(groundedGemini.ok && groundedGemini.data.grounding.some((item) => item.sourceId === "geography/earths-rotation"), "grounding metadata survives Gemini");
  const serialized = JSON.stringify(groundedGemini);
  assert(!serialized.includes("secret-gemini-key") && !serialized.includes("candidates"), "provider raw response and secrets do not leak");

  const geminiRec: FakeProviderRecorder = { calls: 0, inputs: [] };
  const xaiRec: FakeProviderRecorder = { calls: 0, inputs: [] };
  const routedProvider: AiProvider = createAiProviderRouter({
    primaryId: "gemini",
    fallbackId: "xai",
    providers: {
      gemini: createFakeAiProvider("gemini", "success", geminiRec),
      xai: createFakeAiProvider("xai", "success", xaiRec),
    },
    budgetMs: 25000,
  });
  const insufficient = await answerWithGrounding(
    {
      requestId: "ai-request/6e-empty",
      intent: "knowledge-answer",
      text: "What is Zorblax?",
      query: "What is Zorblax?",
    },
    routedProvider,
  );
  assert(insufficient.ok && insufficient.data.status === "insufficient_context", "insufficient context is explicit");
  const callsAfterInsufficient = { gemini: geminiRec.calls, xai: xaiRec.calls };
  assert(callsAfterInsufficient.gemini === 0 && callsAfterInsufficient.xai === 0, "insufficient context prevents all provider calls");
  const groundedRoute = await answerWithGrounding(
    {
      requestId: "ai-request/6e-ok",
      intent: "knowledge-answer",
      text: "Earth's Rotation",
      query: "Earth's Rotation",
    },
    routedProvider,
  );
  const callsAfterGrounded = { gemini: geminiRec.calls, xai: xaiRec.calls };
  assert(groundedRoute.ok && callsAfterGrounded.gemini === 1 && callsAfterGrounded.xai === 0, "grounded retrieval happens before provider invocation");
  assert(groundedRoute.ok && groundedRoute.data.grounding.some((item) => item.sourceId === "geography/earths-rotation"), "grounding survives provider switching boundary");
  passed.push("grounded retrieval stays in front of the router");

  const core = [
    "src/lib/ai-intelligence/types.ts",
    "src/lib/ai-intelligence/provider.ts",
    "src/lib/ai-intelligence/prompt.ts",
    "src/lib/ai-intelligence/compose.ts",
    "src/lib/ai-intelligence/validate.ts",
    "src/lib/ai-intelligence/index.ts",
    "src/lib/ai-experience/types.ts",
    "src/lib/ai-experience/service.ts",
  ];
  for (const path of core) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("gemini/"), `${path} has no Gemini adapter import`);
      assert(!specifier.includes("@google/genai") && !specifier.includes("@google/generative-ai"), `${path} has no Gemini SDK`);
    }
    assert(!source.includes("GEMINI_API_KEY") && !source.includes("XAI_API_KEY"), `${path} does not read provider secrets`);
    assert(!source.includes("generativelanguage.googleapis.com"), `${path} has no Gemini endpoint`);
    assert(!source.includes("isMcqAnswerCorrect") || path.includes("prompt"), `${path} does not rescore`);
    assert(!source.includes("markTopicComplete"), `${path} does not mutate completion`);
    assert(!source.includes("ingestAssessmentResult"), `${path} does not ingest learner results`);
  }
  passed.push("core AI contracts contain no provider-specific types");

  const clientSurfaces = [
    "src/components/ai/AiAskPanel.tsx",
    "src/components/navigation/Navbar.tsx",
    "src/components/assessment/MCQPractice.tsx",
  ];
  for (const path of clientSurfaces) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("ai-providers"), `${path} does not import provider modules`);
    }
    assert(!source.includes("GEMINI_API_KEY") && !source.includes("XAI_API_KEY"), `${path} has no secrets`);
    assert(!source.includes("AI_PRIMARY_PROVIDER"), `${path} cannot select a provider`);
  }
  const panel = readFileSync("src/components/ai/AiAskPanel.tsx", "utf8");
  assert(!panel.includes("Powered by") && !panel.includes("Gemini") && !panel.includes("Grok"), "UI stays provider-neutral");
  const page = readFileSync("src/app/ai/page.tsx", "utf8");
  assert(!page.includes("gemini/adapter") && !page.includes("xai/adapter"), "AI page does not import provider adapters");
  assert(!page.includes("GEMINI_API_KEY"), "AI page does not read the Gemini secret");
  const pkg = readFileSync("package.json", "utf8");
  assert(!pkg.toLowerCase().includes("litellm"), "LiteLLM is not introduced");
  const geminiServer = readFileSync("src/lib/ai-providers/gemini/server.ts", "utf8");
  const routedServer = readFileSync("src/lib/ai-providers/server.ts", "utf8");
  const xaiServer = readFileSync("src/lib/ai-providers/xai/server.ts", "utf8");
  assert(geminiServer.includes("server-only") && routedServer.includes("server-only") && xaiServer.includes("server-only"), "provider factories are server-only");
  const routingFiles = [
    "src/lib/ai-providers/router.ts",
    "src/lib/ai-providers/factory.ts",
    "src/lib/ai-providers/gemini/adapter.ts",
  ];
  for (const path of routingFiles) {
    const source = readFileSync(path, "utf8");
    assert(!source.includes("localStorage") && !source.includes("writeFileSync"), `${path} has no persistence`);
    assert(!source.includes("while (true)") && !source.includes("for (;;"), `${path} has no retry loop`);
  }
  passed.push("client cannot select providers; SDKs and secrets stay server-only");

  void AI_SCHEMA_VERSION;
  const experience = await runAiExperienceVerification();
  assert(experience.length > 0, "existing AI experience verifier still passes");
  passed.push("existing AI experience remains compatible");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-routing.ts");

if (executedFromCli) {
  const passed = await runAiProviderRoutingVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("AI_PROVIDER_ROUTING_VERIFICATION: PASS");
}
