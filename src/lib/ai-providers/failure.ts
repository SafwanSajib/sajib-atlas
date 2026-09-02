/**
 * Normalized provider-failure classification and fallback eligibility.
 *
 * Eligible for one fallback: rate_limited, timeout, network, upstream,
 * malformed_response.
 * Never fallback: configuration, authentication, invalid_request,
 * policy_blocked, unknown.
 */

import {
  FALLBACK_ELIGIBLE_CATEGORIES,
  type AiProviderFailureCategory,
  type ClassifiedAiProviderOutput,
  type FallbackEligibleCategory,
} from "./types";

const ELIGIBLE = new Set<string>(FALLBACK_ELIGIBLE_CATEGORIES);

export function isFallbackEligible(category: AiProviderFailureCategory | undefined): category is FallbackEligibleCategory {
  return category !== undefined && ELIGIBLE.has(category);
}

export function categoryFromOutput(output: ClassifiedAiProviderOutput): AiProviderFailureCategory | undefined {
  if (output.status === "success") return undefined;
  if (output.status === "blocked") return output.failureCategory ?? "policy_blocked";
  return output.failureCategory ?? "unknown";
}

export function classifyHttpFailure(
  status: number,
  providerStatus?: string,
): AiProviderFailureCategory {
  const code = providerStatus?.toUpperCase();
  if (code === "UNAUTHENTICATED" || code === "PERMISSION_DENIED") return "authentication";
  if (code === "RESOURCE_EXHAUSTED") return "rate_limited";
  if (code === "DEADLINE_EXCEEDED") return "timeout";
  if (code === "UNAVAILABLE" || code === "INTERNAL") return "upstream";
  if (code === "INVALID_ARGUMENT" || code === "NOT_FOUND" || code === "FAILED_PRECONDITION") {
    return "invalid_request";
  }
  if (status === 401 || status === 403) return "authentication";
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 404 || status === 422) return "invalid_request";
  if (status >= 500) return "upstream";
  return "unknown";
}
