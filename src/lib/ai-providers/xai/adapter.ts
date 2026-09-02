/**
 * xAI Responses-compatible chat adapter. Isolated from AI domain contracts.
 * Uses HTTP fetch; does not import vendor types into ai-intelligence.
 */

import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { classifyHttpFailure } from "../failure";
import type { AiProviderFailureCategory, ClassifiedAiProvider, ClassifiedAiProviderOutput } from "../types";
import type { XaiProviderConfig } from "./config";
import { XAI_PROVIDER_ID } from "./config";

export type XaiFetch = (input: string, init: RequestInit) => Promise<Response>;

function sanitizeMessage(message: string, apiKey: string): string {
  let text = message;
  if (apiKey) text = text.split(apiKey).join("[redacted]");
  text = text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
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

function readAssistantText(payload: unknown): string | undefined {
  if (payload === null || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const choices = record.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const message = (choices[0] as Record<string, unknown>).message;
    if (message && typeof message === "object") {
      const content = (message as Record<string, unknown>).content;
      if (typeof content === "string") return content;
    }
  }
  const outputText = record.output_text;
  if (typeof outputText === "string") return outputText;
  return undefined;
}

export function createXaiAiProvider(
  config: XaiProviderConfig,
  deps: { fetchFn?: XaiFetch } = {},
): ClassifiedAiProvider {
  const fetchFn = deps.fetchFn ?? fetch;
  const provider: ClassifiedAiProvider = {
    id: XAI_PROVIDER_ID,
    async complete(input) {
      const system = input.instructions?.system ?? "Answer using only supplied canonical context.";
      const user = input.instructions?.user ?? input.request.input.text;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const response = await fetchFn(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: config.maxOutputTokens,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          return classified("failed", "The AI provider rejected authentication.", "authentication");
        }
        if (response.status === 429) {
          return classified("failed", "The AI provider rate-limited the request.", "rate_limited");
        }
        if (!response.ok) {
          return classified(
            "failed",
            "The AI provider is unavailable.",
            classifyHttpFailure(response.status),
          );
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          return classified("failed", "The AI provider returned a malformed response.", "malformed_response");
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
