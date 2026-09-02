/**
 * Official Gemini generateContent HTTP adapter.
 * Isolated from AI domain contracts. No SDK types leak into ai-intelligence.
 */

import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { classifyHttpFailure } from "../failure";
import type { AiProviderFailureCategory, ClassifiedAiProvider, ClassifiedAiProviderOutput } from "../types";
import type { GeminiProviderConfig } from "./config";
import { GEMINI_PROVIDER_ID } from "./config";

export type GeminiFetch = (input: string, init: RequestInit) => Promise<Response>;

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

function readErrorStatus(payload: unknown): string | undefined {
  if (payload === null || typeof payload !== "object") return undefined;
  const error = (payload as Record<string, unknown>).error;
  if (error === null || typeof error !== "object") return undefined;
  const status = (error as Record<string, unknown>).status;
  return typeof status === "string" ? status : undefined;
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
  deps: { fetchFn?: GeminiFetch } = {},
): ClassifiedAiProvider {
  const fetchFn = deps.fetchFn ?? fetch;
  const provider: ClassifiedAiProvider = {
    id: GEMINI_PROVIDER_ID,
    async complete(input) {
      const system = input.instructions?.system ?? "Answer using only supplied canonical context.";
      const user = input.instructions?.user ?? input.request.input.text;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      const url = `${config.baseUrl}/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
      try {
        const response = await fetchFn(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: config.maxOutputTokens },
          }),
          signal: controller.signal,
        });

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          if (!response.ok) {
            return classified("failed", "The AI provider is unavailable.", classifyHttpFailure(response.status));
          }
          return classified("failed", "The AI provider returned a malformed response.", "malformed_response");
        }

        if (policyBlocked(payload)) {
          return classified("blocked", "The AI provider blocked this request.", "policy_blocked");
        }

        if (!response.ok) {
          const category = classifyHttpFailure(response.status, readErrorStatus(payload));
          const text =
            category === "authentication"
              ? "The AI provider rejected authentication."
              : category === "rate_limited"
                ? "The AI provider rate-limited the request."
                : category === "invalid_request"
                  ? "The AI provider rejected the request."
                  : "The AI provider is unavailable.";
          return classified("failed", sanitizeMessage(text, config.apiKey), category);
        }

        const text = readAssistantText(payload);
        if (typeof text !== "string" || !text.trim()) {
          return classified("failed", "The AI provider returned a malformed response.", "malformed_response");
        }
        return classified("success", text);
      } catch (error) {
        const name = error instanceof Error ? error.name : "";
        if (name === "AbortError" || name === "TimeoutError") {
          return classified("failed", "The AI provider timed out.", "timeout");
        }
        return classified(
          "failed",
          sanitizeMessage("The AI provider is unavailable.", config.apiKey),
          "network",
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
  const _contract: AiProvider = provider;
  void _contract;
  return provider;
}
