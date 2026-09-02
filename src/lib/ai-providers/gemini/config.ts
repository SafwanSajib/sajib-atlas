/**
 * Server-side Gemini configuration. Secrets stay in env, never NEXT_PUBLIC_*.
 */

import { aiFailure, aiSuccess } from "@/lib/ai-intelligence/errors";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";

export const GEMINI_PROVIDER_ID = "gemini";
export const GEMINI_DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
export const GEMINI_DEFAULT_TIMEOUT_MS = 10000;
export const GEMINI_DEFAULT_MAX_OUTPUT_TOKENS = 800;

export type GeminiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export type EnvLike = Record<string, string | undefined>;

function parsePositiveInt(value: string | undefined, fallback: number, label: string): AiIntelligenceResult<number> {
  if (value === undefined || value.trim() === "") return aiSuccess(fallback);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return aiFailure("validation_failure", `${label} must be a positive integer`);
  }
  return aiSuccess(parsed);
}

export function readGeminiProviderConfig(env: EnvLike): AiIntelligenceResult<GeminiProviderConfig> {
  if (env.NEXT_PUBLIC_GEMINI_API_KEY !== undefined && env.NEXT_PUBLIC_GEMINI_API_KEY !== "") {
    return aiFailure("invalid_request", "provider credentials must not use NEXT_PUBLIC_ variables");
  }
  const apiKey = env.GEMINI_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return aiFailure("provider_failure", "GEMINI_API_KEY is not configured");
  }
  const timeout = parsePositiveInt(env.GEMINI_TIMEOUT_MS, GEMINI_DEFAULT_TIMEOUT_MS, "GEMINI_TIMEOUT_MS");
  if (!timeout.ok) return timeout;
  const maxTokens = parsePositiveInt(
    env.GEMINI_MAX_OUTPUT_TOKENS,
    GEMINI_DEFAULT_MAX_OUTPUT_TOKENS,
    "GEMINI_MAX_OUTPUT_TOKENS",
  );
  if (!maxTokens.ok) return maxTokens;
  const model = env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
  const baseUrl = env.GEMINI_BASE_URL?.trim() || GEMINI_DEFAULT_BASE_URL;
  return aiSuccess({
    apiKey: apiKey.trim(),
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    timeoutMs: timeout.data,
    maxOutputTokens: maxTokens.data,
  });
}
