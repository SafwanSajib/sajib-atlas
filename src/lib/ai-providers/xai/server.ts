/**
 * Server-only factory. Do not import from client components.
 */

import "server-only";

import { createXaiAiProvider } from "./adapter";
import { readXaiProviderConfig } from "./config";
import type { AiProvider } from "@/lib/ai-intelligence/provider";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";

export function createServerXaiProvider(
  env: NodeJS.ProcessEnv = process.env,
): AiIntelligenceResult<AiProvider> {
  const config = readXaiProviderConfig(env);
  if (!config.ok) return config;
  return { ok: true, data: createXaiAiProvider(config.data) };
}
