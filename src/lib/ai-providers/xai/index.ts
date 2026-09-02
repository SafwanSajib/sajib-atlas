/**
 * xAI / SpaceXAI provider adapter (Phase 6B).
 * Core AI contracts remain in src/lib/ai-intelligence/.
 */

export { createXaiAiProvider, type XaiFetch } from "./adapter";
export {
  readXaiProviderConfig,
  XAI_DEFAULT_BASE_URL,
  XAI_DEFAULT_MAX_OUTPUT_TOKENS,
  XAI_DEFAULT_MODEL,
  XAI_DEFAULT_TIMEOUT_MS,
  XAI_PROVIDER_ID,
  type EnvLike,
  type XaiProviderConfig,
} from "./config";
