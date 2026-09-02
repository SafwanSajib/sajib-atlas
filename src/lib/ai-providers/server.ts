/**
 * Server-only routed provider factory. Do not import from client components.
 */

import "server-only";

import { createRoutedProvider } from "./factory";
import type { AiIntelligenceResult } from "@/lib/ai-intelligence/types";
import type { AiProviderRouter } from "./types";

export function createServerRoutedProvider(
  env: NodeJS.ProcessEnv = process.env,
): AiIntelligenceResult<AiProviderRouter> {
  return createRoutedProvider(env);
}
