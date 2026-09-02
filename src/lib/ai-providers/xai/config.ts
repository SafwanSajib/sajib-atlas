/**
 * Server-side xAI (SpaceXAI) configuration. Secrets stay in env, never NEXT_PUBLIC_*.
 */

import { aiFailure, aiSuccess } from "@/lib/ai-intelligence/errors";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";

export const XAI_PROVIDER_ID = "xai";
export const XAI_DEFAULT_BASE_URL = "https://api.x.ai/v1";
export const XAI_DEFAULT_MODEL = "grok-4.6";
export const XAI_DEFAULT_TIMEOUT_MS = 15000;
export const XAI_DEFAULT_MAX_OUTPUT_TOKENS = 800;

export type XaiProviderConfig = {
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

export function readXaiProviderConfig(env: EnvLike): AiIntelligenceResult<XaiProviderConfig> {
  if (env.NEXT_PUBLIC_XAI_API_KEY !== undefined && env.NEXT_PUBLIC_XAI_API_KEY !== "") {
    return aiFailure("invalid_request", "provider credentials must not use NEXT_PUBLIC_ variables");
  }
  const apiKey = env.XAI_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return aiFailure("provider_failure", "XAI_API_KEY is not configured");
  }
  const timeout = parsePositiveInt(env.AI_PROVIDER_TIMEOUT_MS, XAI_DEFAULT_TIMEOUT_MS, "AI_PROVIDER_TIMEOUT_MS");
  if (!timeout.ok) return timeout;
  const maxTokens = parsePositiveInt(
    env.AI_PROVIDER_MAX_OUTPUT_TOKENS,
    XAI_DEFAULT_MAX_OUTPUT_TOKENS,
    "AI_PROVIDER_MAX_OUTPUT_TOKENS",
  );
  if (!maxTokens.ok) return maxTokens;
  const model = env.AI_PROVIDER_MODEL?.trim() || XAI_DEFAULT_MODEL;
  const baseUrl = env.AI_PROVIDER_BASE_URL?.trim() || XAI_DEFAULT_BASE_URL;
  return aiSuccess({
    apiKey: apiKey.trim(),
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    timeoutMs: timeout.data,
    maxOutputTokens: maxTokens.data,
  });
}
