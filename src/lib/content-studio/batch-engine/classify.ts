import type { StudioFailure, StudioPipelineResult } from "../types";
import { redactSecrets, sanitizeProviderTrace } from "./sanitize";
import type { BatchItemResult, BatchItemState } from "./types";

export type ClassifiedItemResult = {
  state: Exclude<BatchItemState, "pending" | "running">;
  result: BatchItemResult;
};

function safeMessage(message: string): string {
  return redactSecrets(message).slice(0, 500);
}

function isRateLimited(result: StudioFailure): boolean {
  if (result.error.code !== "provider_failure") return false;
  const detail = result.providerTrace?.attemptsDetail ?? [];
  const last = detail[detail.length - 1];
  if (last && (last.status === 429 || last.outcome === "rate_limited" || last.outcome.startsWith("rate_limited "))) return true;
  if (!result.providerTrace) return /rate-?limit|429|resource_exhausted/i.test(result.error.message);
  return false;
}

export function classifyPipelineResult(result: StudioPipelineResult, completedAt: string): ClassifiedItemResult {
  if (!result.ok) {
    const state = result.error.code === "invalid_source"
      ? "source_insufficient"
      : isRateLimited(result)
        ? "rate_limited"
        : "failed";
    return {
      state,
      result: {
        completedAt,
        pipelineOk: false,
        pipelineErrorCode: result.error.code,
        safeMessage: safeMessage(result.error.message),
        ...(sanitizeProviderTrace(result.providerTrace) ? { providerTrace: sanitizeProviderTrace(result.providerTrace) } : {}),
      },
    };
  }
  const qualityOverall = result.record.qualitySnapshot?.report.overall;
  if (!qualityOverall) {
    return {
      state: "failed",
      result: {
        completedAt,
        pipelineOk: false,
        safeMessage: "Studio pipeline returned a draft without a quality snapshot.",
      },
    };
  }
  return {
    state: qualityOverall === "blocked" ? "quality_blocked" : "succeeded",
    result: {
      completedAt,
      pipelineOk: true,
      qualityOverall,
      ...(sanitizeProviderTrace(result.providerTrace) ? { providerTrace: sanitizeProviderTrace(result.providerTrace) } : {}),
      draft: result.record,
    },
  };
}

export function classifyThrown(error: unknown, completedAt: string): ClassifiedItemResult {
  const message = error instanceof Error ? error.message : "Batch item execution failed.";
  return {
    state: "failed",
    result: {
      completedAt,
      pipelineOk: false,
      safeMessage: safeMessage(message),
    },
  };
}
