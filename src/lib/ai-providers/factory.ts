/**
 * Build a routed AiProvider from server env. Not imported by client code.
 */

import { aiSuccess } from "@/lib/ai-intelligence/errors";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";
import { createGeminiAiProvider } from "./gemini/adapter";
import { readGeminiProviderConfig } from "./gemini/config";
import { createAiProviderRouter } from "./router";
import { readAiRoutingConfig, type EnvLike } from "./routing-config";
import type { AiProviderId, AiProviderRouter, ClassifiedAiProvider } from "./types";
import { createXaiAiProvider } from "./xai/adapter";
import { readXaiProviderConfig } from "./xai/config";

function bindProvider(id: AiProviderId, env: EnvLike): AiIntelligenceResult<ClassifiedAiProvider> {
  if (id === "gemini") {
    const config = readGeminiProviderConfig(env);
    if (!config.ok) return config;
    return aiSuccess(createGeminiAiProvider(config.data));
  }
  const config = readXaiProviderConfig(env);
  if (!config.ok) return config;
  return aiSuccess(createXaiAiProvider(config.data));
}

export function createRoutedProvider(env: EnvLike): AiIntelligenceResult<AiProviderRouter> {
  const routing = readAiRoutingConfig(env);
  if (!routing.ok) return routing;

  const primary = bindProvider(routing.data.primaryId, env);
  if (!primary.ok) return primary;

  const providers: Partial<Record<AiProviderId, ClassifiedAiProvider>> = {
    [routing.data.primaryId]: primary.data,
  };

  if (routing.data.fallbackId) {
    const fallback = bindProvider(routing.data.fallbackId, env);
    if (fallback.ok) providers[routing.data.fallbackId] = fallback.data;
  }

  return aiSuccess(
    createAiProviderRouter({
      primaryId: routing.data.primaryId,
      fallbackId: routing.data.fallbackId,
      providers,
      budgetMs: routing.data.budgetMs,
    }),
  );
}
