/**
 * Gemini provider adapter (Phase 6E).
 * Official generateContent HTTP API. Core AI contracts stay in ai-intelligence.
 */

export { createGeminiAiProvider, type GeminiFetch } from "./adapter";
export {
  readGeminiProviderConfig,
  GEMINI_DEFAULT_BASE_URL,
  GEMINI_DEFAULT_MAX_OUTPUT_TOKENS,
  GEMINI_DEFAULT_MODEL,
  GEMINI_DEFAULT_TIMEOUT_MS,
  GEMINI_PROVIDER_ID,
  type EnvLike,
  type GeminiProviderConfig,
} from "./config";
