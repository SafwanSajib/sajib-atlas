/**
 * Server-only Gemini factory. Do not import from client components.
 */

import "server-only";

import { createGeminiAiProvider } from "./adapter";
import { readGeminiProviderConfig } from "./config";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";
import type { ClassifiedAiProvider } from "../types";

export function createServerGeminiProvider(
  env: NodeJS.ProcessEnv = process.env,
): AiIntelligenceResult<ClassifiedAiProvider> {
  const config = readGeminiProviderConfig(env);
  if (!config.ok) return config;
  return { ok: true, data: createGeminiAiProvider(config.data) };
}
