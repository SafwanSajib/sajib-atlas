/**
 * Server-side routing policy. Browser cannot choose a provider or model.
 */

import { aiFailure, aiSuccess } from "@/lib/ai-intelligence/errors";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";
import { readGeminiProviderConfig } from "./gemini/config";
import { DEFAULT_GEMINI_FALLBACK, DEFAULT_PRIMARY_PROVIDER, isRegisteredProviderId } from "./registry";
import type { AiProviderId } from "./types";
import { readXaiProviderConfig } from "./xai/config";

export const AI_DEFAULT_ROUTE_BUDGET_MS = 25000;

export type EnvLike = Record<string, string | undefined>;

export type AiRoutingConfig = {
  primaryId: AiProviderId;
  fallbackId?: AiProviderId;
  budgetMs: number;
};

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  label: string,
): AiIntelligenceResult<number> {
  if (value === undefined || value.trim() === "") return aiSuccess(fallback);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return aiFailure("validation_failure", `${label} must be a positive integer`);
  }
  return aiSuccess(parsed);
}

export function readAiRoutingConfig(env: EnvLike): AiIntelligenceResult<AiRoutingConfig> {
  const rawPrimary = env.AI_PRIMARY_PROVIDER?.trim() || DEFAULT_PRIMARY_PROVIDER;
  if (!isRegisteredProviderId(rawPrimary)) {
    return aiFailure("validation_failure", "AI_PRIMARY_PROVIDER is not a registered provider.");
  }

  const rawFallback = env.AI_FALLBACK_PROVIDER?.trim();
  let fallbackId: AiProviderId | undefined;
  if (rawFallback) {
    if (!isRegisteredProviderId(rawFallback)) {
      return aiFailure("validation_failure", "AI_FALLBACK_PROVIDER is not a registered provider.");
    }
    if (rawFallback !== rawPrimary) fallbackId = rawFallback;
  } else if (rawPrimary === DEFAULT_PRIMARY_PROVIDER) {
    fallbackId = DEFAULT_GEMINI_FALLBACK;
  }

  const budget = parsePositiveInt(env.AI_PROVIDER_BUDGET_MS, AI_DEFAULT_ROUTE_BUDGET_MS, "AI_PROVIDER_BUDGET_MS");
  if (!budget.ok) return budget;

  const config: AiRoutingConfig = {
    primaryId: rawPrimary,
    budgetMs: budget.data,
  };
  if (fallbackId) config.fallbackId = fallbackId;
  return aiSuccess(config);
}

export function isPrimaryProviderConfigured(env: EnvLike): boolean {
  const routing = readAiRoutingConfig(env);
  if (!routing.ok) return false;
  if (routing.data.primaryId === "gemini") return readGeminiProviderConfig(env).ok;
  if (routing.data.primaryId === "xai") return readXaiProviderConfig(env).ok;
  return false;
}
