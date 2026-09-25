/**
 * Official Gemini generateContent HTTP adapter.
 * Isolated from AI domain contracts. No SDK types leak into ai-intelligence.
 */

import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { classifyHttpFailure } from "../failure";
import {
  AI_PROVIDER_FINISH_REASONS,
  type AiProviderAttemptRecord,
  type AiProviderFailureCategory,
  type AiProviderFinishReason,
  type ClassifiedAiProvider,
  type ClassifiedAiProviderOutput,
} from "../types";
import type { GeminiProviderConfig } from "./config";
import { GEMINI_PROVIDER_ID } from "./config";

export type GeminiFetch = (input: string, init: RequestInit) => Promise<Response>;
export type GeminiSleep = (ms: number) => Promise<void>;

const GEMINI_TRANSIENT_RETRY_DELAY_MS = 250;

function isRetryableGeminiUpstream(status: number, providerStatus?: string): boolean {
  const category = classifyHttpFailure(status, providerStatus);
  if (category === "rate_limited") return true;
  const code = providerStatus?.toUpperCase();
  return status === 503 || code === "UNAVAILABLE" || code === "INTERNAL";
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeMessage(message: string, apiKey: string): string {
  let text = message;
  if (apiKey) text = text.split(apiKey).join("[redacted]");
  text = text.replace(/x-goog-api-key:\s*\S+/gi, "x-goog-api-key: [redacted]");
  return text;
}

function classified(
  status: ClassifiedAiProviderOutput["status"],
  text: string,
  failureCategory?: AiProviderFailureCategory,
): ClassifiedAiProviderOutput {
  const output: ClassifiedAiProviderOutput = { status, text };
  if (failureCategory) output.failureCategory = failureCategory;
  return output;
}

function withCallTrace(
  output: ClassifiedAiProviderOutput,
  details: readonly AiProviderAttemptRecord[],
): ClassifiedAiProviderOutput {
  return {
    ...output,
    callTrace: {
      provider: GEMINI_PROVIDER_ID,
      attempts: details.length,
      retryOccurred: details.length > 1,
      attemptsDetail: details,
    },
  };
}

function readErrorStatus(payload: unknown): string | undefined {
  if (payload === null || typeof payload !== "object") return undefined;
  const error = (payload as Record<string, unknown>).error;
  if (error === null || typeof error !== "object") return undefined;
  const status = (error as Record<string, unknown>).status;
  return typeof status === "string" ? status : undefined;
}

function readFinishReason(payload: unknown): AiProviderFinishReason | undefined {
  if (payload === null || typeof payload !== "object") return undefined;
  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== "object") return undefined;
  const finish = (candidates[0] as Record<string, unknown>).finishReason;
  if (typeof finish !== "string") return undefined;
  return (AI_PROVIDER_FINISH_REASONS as readonly string[]).includes(finish)
    ? (finish as AiProviderFinishReason)
    : undefined;
}

function attemptRecord(
  attempt: number,
  outcome: AiProviderAttemptRecord["outcome"],
  status?: number,
  finishReason?: AiProviderFinishReason,
): AiProviderAttemptRecord {
  const record: AiProviderAttemptRecord = { attempt, outcome };
  if (typeof status === "number") record.status = status;
  if (finishReason) record.finishReason = finishReason;
  return record;
}

function readAssistantText(payload: unknown): string | undefined {
  if (payload === null || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const candidates = record.candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== "object") return undefined;
  const content = (candidates[0] as Record<string, unknown>).content;
  if (content === null || typeof content !== "object") return undefined;
  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) return undefined;
  const chunks: string[] = [];
  for (const part of parts) {
    if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
      chunks.push((part as Record<string, unknown>).text as string);
    }
  }
  const text = chunks.join("");
  return text.trim() ? text : undefined;
}

function policyBlocked(payload: unknown): boolean {
  if (payload === null || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  const feedback = record.promptFeedback;
  if (feedback && typeof feedback === "object") {
    const reason = (feedback as Record<string, unknown>).blockReason;
    if (typeof reason === "string" && reason && reason !== "BLOCK_REASON_UNSPECIFIED") return true;
  }
  const candidates = record.candidates;
  if (Array.isArray(candidates) && candidates[0] && typeof candidates[0] === "object") {
    const finish = (candidates[0] as Record<string, unknown>).finishReason;
    if (finish === "SAFETY" || finish === "PROHIBITED_CONTENT" || finish === "BLOCKLIST") return true;
  }
  return false;
}

export function createGeminiAiProvider(
  config: GeminiProviderConfig,
  deps: { fetchFn?: GeminiFetch; sleepFn?: GeminiSleep } = {},
): ClassifiedAiProvider {
  const fetchFn = deps.fetchFn ?? fetch;
  const sleepFn = deps.sleepFn ?? defaultSleep;
  const provider: ClassifiedAiProvider = {
    id: GEMINI_PROVIDER_ID,
    async complete(input) {
      const system = input.instructions?.system ?? "Answer using only supplied canonical context.";
      const user = input.instructions?.user ?? input.request.input.text;
      const timeoutMs = input.limits?.timeoutMs ?? config.timeoutMs;
      const maxOutputTokens = input.limits?.maxOutputTokens ?? config.maxOutputTokens;
      const url = `${config.baseUrl}/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
      const body = JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens },
      });

      let lastUnavailable: ClassifiedAiProviderOutput | undefined;
      const details: AiProviderAttemptRecord[] = [];
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetchFn(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": config.apiKey,
            },
            body,
            signal: controller.signal,
          });

          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            if (!response.ok) {
              const category = classifyHttpFailure(response.status);
              details.push(attemptRecord(attempt, category, response.status));
              const failed = withCallTrace(classified("failed", "The AI provider is unavailable.", category), details);
              if (attempt === 1 && isRetryableGeminiUpstream(response.status)) {
                lastUnavailable = failed;
                await sleepFn(GEMINI_TRANSIENT_RETRY_DELAY_MS);
                continue;
              }
              return failed;
            }
            details.push(attemptRecord(attempt, "malformed_response"));
            return withCallTrace(classified("failed", "The AI provider returned a malformed response.", "malformed_response"), details);
          }

          if (policyBlocked(payload)) {
            details.push(attemptRecord(attempt, "policy_blocked", response.status, readFinishReason(payload)));
            return withCallTrace(classified("blocked", "The AI provider blocked this request.", "policy_blocked"), details);
          }

          if (!response.ok) {
            const providerStatus = readErrorStatus(payload);
            const category = classifyHttpFailure(response.status, providerStatus);
            details.push(attemptRecord(attempt, category, response.status, readFinishReason(payload)));
            const text =
              category === "authentication"
                ? "The AI provider rejected authentication."
                : category === "rate_limited"
                  ? "The AI provider rate-limited the request."
                  : category === "invalid_request"
                    ? "The AI provider rejected the request."
                    : "The AI provider is unavailable.";
            const failed = withCallTrace(classified("failed", sanitizeMessage(text, config.apiKey), category), details);
            if (attempt === 1 && isRetryableGeminiUpstream(response.status, providerStatus)) {
              lastUnavailable = failed;
              await sleepFn(GEMINI_TRANSIENT_RETRY_DELAY_MS);
              continue;
            }
            return failed;
          }

          const text = readAssistantText(payload);
          if (typeof text !== "string" || !text.trim()) {
            details.push(attemptRecord(attempt, "malformed_response", response.status, readFinishReason(payload)));
            return withCallTrace(classified("failed", "The AI provider returned a malformed response.", "malformed_response"), details);
          }
          details.push(attemptRecord(attempt, "success", response.status, readFinishReason(payload)));
          return withCallTrace(classified("success", text), details);
        } catch (error) {
          const name = error instanceof Error ? error.name : "";
          if (name === "AbortError" || name === "TimeoutError") {
            details.push(attemptRecord(attempt, "timeout"));
            return withCallTrace(classified("failed", "The AI provider timed out.", "timeout"), details);
          }
          details.push(attemptRecord(attempt, "network"));
          return withCallTrace(
            classified("failed", sanitizeMessage("The AI provider is unavailable.", config.apiKey), "network"),
            details,
          );
        } finally {
          clearTimeout(timer);
        }
      }
      return withCallTrace(lastUnavailable ?? classified("failed", "The AI provider is unavailable.", "upstream"), details);
    },
  };
  const _contract: AiProvider = provider;
  void _contract;
  return provider;
}
