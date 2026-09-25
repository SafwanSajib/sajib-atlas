import { resolveGeminiModel, type EnvLike } from "@/lib/ai-providers/gemini/config";
import { DEFAULT_GEMINI_FALLBACK, DEFAULT_PRIMARY_PROVIDER } from "@/lib/ai-providers/registry";
import {
  geographyAtmosphereProductionPackage,
  geographyPlateTectonicsProductionPackage,
  geographyWaterCycleProductionPackage,
} from "@/lib/content/production/index";
import { BATCH_WORKER_CONCURRENCY } from "../batch-engine/types";
import type { ThreeTopicLiveGate } from "./types";

/**
 * Readiness card only. This does not create a batch, tick an item, or call a provider.
 * maximumGeminiHttpAttempts reports the existing adapter bound (`attempt <= 2`).
 * It does not add a retry. existingFallback reports the router default; it does not enable a new one.
 * geminiModel uses resolveGeminiModel, the same value readGeminiProviderConfig gives the adapter.
 */
export function inspectThreeTopicLiveGate(env: EnvLike = process.env): ThreeTopicLiveGate {
  if (BATCH_WORKER_CONCURRENCY !== 1) {
    throw new Error("Batch control: the live gate requires worker concurrency 1.");
  }
  const topics = [
    geographyWaterCycleProductionPackage,
    geographyAtmosphereProductionPackage,
    geographyPlateTectonicsProductionPackage,
  ];
  return {
    itemCount: 3,
    execution: "not-started",
    engine: "tickBatchWorker",
    notUsed: "generateStudioBatchAction",
    concurrency: 1,
    maximumGeminiHttpAttempts: 2,
    geminiModel: resolveGeminiModel(env),
    primaryProvider: DEFAULT_PRIMARY_PROVIDER,
    existingFallback: DEFAULT_GEMINI_FALLBACK,
    autoPublish: false,
    insertsIntoContentReview: false,
    topicIds: topics.map((topic) => topic.topic.id),
    sourceCounts: topics.map((topic) => topic.sources.length),
    titles: topics.map((topic) => topic.topic.title),
  };
}
