/**
 * Shared client adapter (Phase 9B) and client state (Phase 9C).
 *
 * Consumes Phase 8 contracts. Not Android/iOS, auth, HTTP routes, or a domain engine.
 */

export { clientReadAccess } from "./access";
export { clientReadAi } from "./ai";
export { clientReadAssessment } from "./assessment";
export { clientReadCapabilities, clientReadIdentity } from "./capabilities";
export { readClientEnvelope } from "./envelope";
export { clientExecuteRequest } from "./http";
export { clientReadLearnerIntelligence } from "./intelligence";
export { clientNavigateTopic } from "./navigation";
export { createClientRequest, createClientRequestHeaders } from "./request";
export { clientSearch } from "./search";
export { clientCacheGet, clientCachePut, emptyClientServerCache, isSafeClientCacheData } from "./cache";
export { clientLocalLearnerWrite, emptyClientLocalLearner } from "./local";
export { clientReadError, clientReadIdle, clientReadLoading, clientReadSuccess } from "./read-state";
export {
  clientSetOnline,
  clientStateBeginRead,
  clientStatePeek,
  clientStateReadAccess,
  clientStateReadAi,
  clientStateReadAssessment,
  clientStateReadCapabilities,
  clientStateReadIdentity,
  clientStateReadLearnerIntelligence,
  clientStateReadTopic,
  clientStateSearch,
  clientStateWriteLocal,
  createClientState,
} from "./session";
export { clientOfflineProtectedAccess, clientServerCacheKey, clientStoreKind } from "./state";
export { clientReadTopic, clientReadTopics } from "./topics";
export {
  WEB_CLIENT_SURFACE,
  applyWebLearnerToClientState,
  createWebClientHeaders,
  createWebClientRequest,
  createWebClientState,
  projectWebLearnerToClient,
  webSearchTopics,
} from "./web";
export {
  CLIENT_CACHEABLE_RESOURCES,
  CLIENT_LOCAL_STORE_KIND,
  CLIENT_READ_SOURCES,
  CLIENT_READ_STATUSES,
  CLIENT_SERVER_CACHE_KIND,
  CLIENT_STORE_KINDS,
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  FORBIDDEN_PLATFORM_FIELDS,
  PLATFORM_CLIENT_SURFACES,
  PLATFORM_READ_ERROR_CODES,
} from "./types";
export type {
  ClientCacheableResource,
  ClientNavigationTarget,
  ClientReadSource,
  ClientReadState,
  ClientReadStatus,
  ClientStoreKind,
  PlatformCapabilityRead,
  PlatformClientSurface,
  PlatformPage,
  PlatformReadResult,
  PlatformRequestContext,
} from "./types";
export type { ClientServerCache, ClientServerCacheEntry } from "./cache";
export type { ClientLocalLearnerRecord } from "./local";
export type { ClientState, ClientStateRead } from "./session";
