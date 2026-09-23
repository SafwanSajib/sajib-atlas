"use server";

/**
 * Studio issues one routed generation per item.
 * Provider failover (Gemini primary → xAI) is owned by createServerRoutedProvider.
 * Action duration is configured on src/app/content-studio/page.tsx (150s).
 */

import { createServerRoutedProvider } from "@/lib/ai-providers/server";
import { runStudioBatch } from "./batch";
import { runStudioPipeline } from "./pipeline";
import type { StudioBatchItemInput, StudioBatchItemResult, StudioPipelineResult, StudioSourcePacketInput, StudioTopicIdentityInput } from "./types";

function unavailable(message: string): StudioPipelineResult {
  return { ok: false, error: { code: "unavailable", message } };
}

function providerOrUnavailable() {
  // One routed generation per item. Gemini→xAI failover is owned by createServerRoutedProvider.
  if (process.env.NODE_ENV === "production") {
    return { ok: false as const, error: unavailable("Content Production Studio is disabled in production.") };
  }
  const provider = createServerRoutedProvider();
  if (!provider.ok) {
    return { ok: false as const, error: unavailable("Studio drafting is unavailable because the AI provider is not configured.") };
  }
  return { ok: true as const, provider: provider.data };
}

export async function generateStudioDraftAction(input: {
  identity: StudioTopicIdentityInput;
  sourceText?: string;
  sourcePacket?: StudioSourcePacketInput;
}): Promise<StudioPipelineResult> {
  const resolved = providerOrUnavailable();
  if (!resolved.ok) return resolved.error;
  return runStudioPipeline({
    identity: input.identity,
    sourceText: input.sourceText,
    sourcePacket: input.sourcePacket,
    provider: resolved.provider,
  });
}

export async function generateStudioBatchAction(items: readonly StudioBatchItemInput[]): Promise<readonly StudioBatchItemResult[]> {
  const resolved = providerOrUnavailable();
  if (!resolved.ok) {
    return items.map((item) => ({ id: item.id, result: resolved.error }));
  }
  return runStudioBatch({ items, provider: resolved.provider });
}
