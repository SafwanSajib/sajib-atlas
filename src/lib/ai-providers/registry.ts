/**
 * Explicit provider registry. Not a plugin loader.
 * Client input cannot register, select, or supply a provider class.
 */

import { AI_PROVIDER_IDS, type AiProviderId } from "./types";

export const AI_PROVIDER_REGISTRY: Record<AiProviderId, { id: AiProviderId }> = {
  gemini: { id: "gemini" },
  xai: { id: "xai" },
};

export const DEFAULT_PRIMARY_PROVIDER: AiProviderId = "gemini";
export const DEFAULT_GEMINI_FALLBACK: AiProviderId = "xai";

export function registeredProviderIds(): readonly AiProviderId[] {
  return AI_PROVIDER_IDS;
}

export function isRegisteredProviderId(value: string): value is AiProviderId {
  return value === "gemini" || value === "xai";
}
