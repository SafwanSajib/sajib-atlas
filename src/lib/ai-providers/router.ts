/**
 * Bounded provider router. One primary call, at most one eligible fallback.
 * Does not retrieve, score, or mutate learner state.
 */

import type { AiProviderInput, AiProviderOutput } from "@/lib/ai-intelligence/provider";
import { categoryFromOutput, isFallbackEligible } from "./failure";
import type {
  AiProviderId,
  AiProviderRouter,
  AiProviderRoutingResult,
  AiProviderRoutingTrace,
  ClassifiedAiProvider,
  ClassifiedAiProviderOutput,
} from "./types";

export type CreateAiProviderRouterInput = {
  primaryId: AiProviderId;
  fallbackId?: AiProviderId;
  providers: Partial<Record<AiProviderId, ClassifiedAiProvider>>;
  budgetMs: number;
};

function publicOutput(output: ClassifiedAiProviderOutput): AiProviderOutput {
  return { status: output.status, text: output.text };
}

function unavailable(text: string, category: ClassifiedAiProviderOutput["failureCategory"]): ClassifiedAiProviderOutput {
  const output: ClassifiedAiProviderOutput = { status: "failed", text };
  if (category) output.failureCategory = category;
  return output;
}

export function createAiProviderRouter(input: CreateAiProviderRouterInput): AiProviderRouter {
  const primary = input.providers[input.primaryId];
  const fallback =
    input.fallbackId && input.fallbackId !== input.primaryId
      ? input.providers[input.fallbackId]
      : undefined;

  async function route(request: AiProviderInput): Promise<AiProviderRoutingResult> {
    const trace: AiProviderRoutingTrace = {
      primaryProvider: input.primaryId,
      selectedProvider: input.primaryId,
      fallbackAttempted: false,
      providerCalls: 0,
    };
    if (input.fallbackId) trace.fallbackProvider = input.fallbackId;

    if (!primary) {
      return {
        output: unavailable("The AI provider is not configured.", "configuration"),
        trace: { ...trace, primaryFailureCategory: "configuration", providerCalls: 0 },
      };
    }

    void input.budgetMs;
    trace.providerCalls += 1;
    const primaryOut = await primary.complete(request);
    if (primaryOut.status === "success") {
      return {
        output: primaryOut,
        trace: { ...trace, finalProvider: input.primaryId, providerCalls: 1 },
      };
    }

    const primaryCategory = categoryFromOutput(primaryOut);
    trace.primaryFailureCategory = primaryCategory;

    if (primaryOut.status === "blocked" || !isFallbackEligible(primaryCategory) || !fallback) {
      return { output: primaryOut, trace };
    }

    trace.fallbackAttempted = true;
    trace.providerCalls += 1;
    const fallbackOut = await fallback.complete(request);
    const fallbackCategory = categoryFromOutput(fallbackOut);
    if (fallbackCategory) trace.fallbackFailureCategory = fallbackCategory;
    if (fallbackOut.status === "success") {
      trace.finalProvider = input.fallbackId;
    }
    return { output: fallbackOut, trace };
  }

  return {
    primaryId: input.primaryId,
    fallbackId: input.fallbackId,
    async complete(request): Promise<AiProviderOutput> {
      const routed = await route(request);
      return publicOutput(routed.output);
    },
    route,
  };
}
