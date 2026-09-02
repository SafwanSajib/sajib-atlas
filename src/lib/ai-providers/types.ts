/**
 * Provider-routing contracts (Phase 6E). Isolated from AI Intelligence.
 * No Geography, Search, scoring, learner persistence, or UI.
 */

import type { AiProvider, AiProviderInput, AiProviderOutput } from "@/lib/ai-intelligence/provider";

export const AI_PROVIDER_IDS = ["gemini", "xai"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

export const AI_PROVIDER_FAILURE_CATEGORIES = [
  "configuration",
  "authentication",
  "invalid_request",
  "rate_limited",
  "timeout",
  "network",
  "upstream",
  "policy_blocked",
  "malformed_response",
  "unknown",
] as const;
export type AiProviderFailureCategory = (typeof AI_PROVIDER_FAILURE_CATEGORIES)[number];

/** Transient failures that may invoke the configured fallback once. */
export const FALLBACK_ELIGIBLE_CATEGORIES = [
  "rate_limited",
  "timeout",
  "network",
  "upstream",
  "malformed_response",
] as const;
export type FallbackEligibleCategory = (typeof FALLBACK_ELIGIBLE_CATEGORIES)[number];

export type ClassifiedAiProviderOutput = AiProviderOutput & {
  failureCategory?: AiProviderFailureCategory;
};

export type ClassifiedAiProvider = {
  id: AiProviderId;
  complete(input: AiProviderInput): Promise<ClassifiedAiProviderOutput>;
};

export type AiProviderRoutingTrace = {
  primaryProvider: AiProviderId;
  fallbackProvider?: AiProviderId;
  selectedProvider: AiProviderId;
  fallbackAttempted: boolean;
  finalProvider?: AiProviderId;
  primaryFailureCategory?: AiProviderFailureCategory;
  fallbackFailureCategory?: AiProviderFailureCategory;
  providerCalls: number;
};

export type AiProviderRoutingResult = {
  output: ClassifiedAiProviderOutput;
  trace: AiProviderRoutingTrace;
};

export type AiProviderRouter = AiProvider & {
  primaryId: AiProviderId;
  fallbackId?: AiProviderId;
  route(input: AiProviderInput): Promise<AiProviderRoutingResult>;
};

export function isAiProviderId(value: string): value is AiProviderId {
  return value === "gemini" || value === "xai";
}

export function isAiProviderFailureCategory(value: string): value is AiProviderFailureCategory {
  return (AI_PROVIDER_FAILURE_CATEGORIES as readonly string[]).includes(value);
}
