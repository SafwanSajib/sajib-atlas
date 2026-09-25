import { AI_SCHEMA_VERSION } from "@/lib/ai-intelligence/types";
import type { AiProvider, AiProviderOutput } from "@/lib/ai-intelligence/provider";
import { buildStudioPrompt } from "./prompt";
import { STUDIO_MAX_OUTPUT_TOKENS, STUDIO_TIMEOUT_MS } from "./types";
import type {
  StudioProviderTrace,
  StudioSourceInput,
  StudioSourceMetadata,
  StudioTopicIdentity,
  StudioUsageMetadata,
} from "./types";

export type StudioGenerateSuccess = { ok: true; text: string; usage?: StudioUsageMetadata; providerTrace?: StudioProviderTrace };
export type StudioGenerateResult =
  | StudioGenerateSuccess
  | { ok: false; error: { code: "provider_failure"; message: string }; providerTrace?: StudioProviderTrace };

function studioRequestId(explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  const opaque = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `ai-request/studio-${opaque}`;
}

function readProviderTrace(output: AiProviderOutput): StudioProviderTrace | undefined {
  if (!("callTrace" in output)) return undefined;
  const raw = (output as AiProviderOutput & { callTrace?: unknown }).callTrace;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  if (typeof record.provider !== "string" || typeof record.attempts !== "number" || typeof record.retryOccurred !== "boolean") {
    return undefined;
  }
  if (!Array.isArray(record.attemptsDetail)) return undefined;
  const attemptsDetail = record.attemptsDetail.flatMap((item) => {
    if (item === null || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.attempt !== "number" || typeof row.outcome !== "string") return [];
    const detail: { attempt: number; outcome: string; status?: number; finishReason?: string } = {
      attempt: row.attempt,
      outcome: row.outcome,
    };
    if (typeof row.status === "number") detail.status = row.status;
    if (typeof row.finishReason === "string") detail.finishReason = row.finishReason;
    return [detail];
  });
  return {
    provider: record.provider,
    attempts: record.attempts,
    retryOccurred: record.retryOccurred,
    attemptsDetail,
  };
}

function readUsage(output: AiProviderOutput): StudioUsageMetadata | undefined {
  if (!("usage" in output)) return undefined;
  const raw = (output as AiProviderOutput & { usage?: unknown }).usage;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  const usage: StudioUsageMetadata = {};
  if (typeof record.promptTokens === "number" && Number.isFinite(record.promptTokens)) usage.promptTokens = record.promptTokens;
  if (typeof record.completionTokens === "number" && Number.isFinite(record.completionTokens)) usage.completionTokens = record.completionTokens;
  if (typeof record.totalTokens === "number" && Number.isFinite(record.totalTokens)) usage.totalTokens = record.totalTokens;
  return Object.keys(usage).length > 0 ? usage : undefined;
}

export async function generateStudioDraft(input: {
  identity: StudioTopicIdentity;
  sourceText: string;
  provider: AiProvider;
  requestId?: string;
  sourceMetadata?: readonly (StudioSourceMetadata | StudioSourceInput)[];
}): Promise<StudioGenerateResult> {
  const instructions = buildStudioPrompt(input.identity, input.sourceText, input.sourceMetadata ?? []);
  // One routed complete() per item. Gemini→xAI failover lives in the provider router, not here.
  const output = await input.provider.complete({
    request: {
      schemaVersion: AI_SCHEMA_VERSION,
      requestId: studioRequestId(input.requestId),
      // Intent is required by AiRequest. Studio never calls Ask, retrieve, or compose.
      intent: "knowledge-answer",
      input: { text: "Content Production Studio structured draft." },
      context: { references: [] },
    },
    instructions,
    limits: {
      maxOutputTokens: STUDIO_MAX_OUTPUT_TOKENS,
      timeoutMs: STUDIO_TIMEOUT_MS,
    },
  });
  const providerTrace = readProviderTrace(output);
  if (output.status !== "success" || !output.text.trim()) {
    return {
      ok: false,
      error: { code: "provider_failure", message: output.text.trim() || "The AI provider did not return a draft." },
      ...(providerTrace ? { providerTrace } : {}),
    };
  }
  const usage = readUsage(output);
  return {
    ok: true,
    text: output.text,
    ...(usage ? { usage } : {}),
    ...(providerTrace ? { providerTrace } : {}),
  };
}
