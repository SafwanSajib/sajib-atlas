/**
 * Client state session. Dual store + offline-safe reads.
 * Online uses existing client reads (engines). Offline uses public cache
 * only. Protected features fail closed without a live decideAccess path.
 */

import type { AssessmentSetApiRead, IdentityReadResponse, TopicReadResponse } from "@/lib/contracts/api";
import type { AccessDecision, AccessQuery, Entitlement } from "@/lib/entitlement/types";
import type { PlatformCapabilityRead, PlatformReadResult } from "@/lib/platform/types";
import type { SearchResponse } from "@/lib/search/types";
import type { LearnerIntelligenceSnapshot } from "@/lib/learner-intelligence/types";
import type { AiExperienceResult, AiExperienceView } from "@/lib/ai-experience/types";
import { platformSuccess } from "@/lib/platform/envelope";
import { clientReadAccess } from "./access";
import { clientReadAi } from "./ai";
import { clientReadAssessment } from "./assessment";
import { clientReadCapabilities, clientReadIdentity } from "./capabilities";
import { clientCacheGet, clientCachePut, emptyClientServerCache, type ClientServerCache } from "./cache";
import { clientReadLearnerIntelligence } from "./intelligence";
import {
  clientLocalLearnerWrite,
  emptyClientLocalLearner,
  type ClientLocalLearnerRecord,
} from "./local";
import { clientReadError, clientReadLoading, clientReadSuccess } from "./read-state";
import { clientSearch } from "./search";
import { clientOfflineProtectedAccess, clientServerCacheKey } from "./state";
import { clientReadTopic } from "./topics";
import {
  CLIENT_LOCAL_STORE_KIND,
  CLIENT_SERVER_CACHE_KIND,
  type ClientCacheableResource,
  type ClientReadState,
  type ClientStoreKind,
} from "./types";

export type ClientState = {
  online: boolean;
  server: ClientServerCache;
  local: ClientLocalLearnerRecord;
  reads: { readonly [key: string]: ClientReadState<unknown> };
};

export type ClientStateRead<T> = {
  state: ClientState;
  read: ClientReadState<T>;
};

export function createClientState(online: boolean = true): ClientState {
  return {
    online,
    server: emptyClientServerCache(),
    local: emptyClientLocalLearner(),
    reads: {},
  };
}

export function clientSetOnline(state: ClientState, online: boolean): ClientState {
  return { ...state, online };
}

function withRead<T>(
  state: ClientState,
  key: string,
  read: ClientReadState<T>,
  server: ClientServerCache = state.server,
  local: ClientLocalLearnerRecord = state.local,
): ClientStateRead<T> {
  return {
    state: { ...state, server, local, reads: { ...state.reads, [key]: read } },
    read,
  };
}

export function clientStateBeginRead(
  state: ClientState,
  key: string,
  store: ClientStoreKind,
): ClientState {
  return { ...state, reads: { ...state.reads, [key]: clientReadLoading(store) } };
}

function cachePublic(
  cache: ClientServerCache,
  resource: ClientCacheableResource,
  query: string,
  data: unknown,
): ClientServerCache {
  const put = clientCachePut(cache, {
    resource,
    query,
    data,
    classification: "public",
  });
  return put.success ? put.data : cache;
}

function serveCache<T>(
  state: ClientState,
  resource: ClientCacheableResource,
  query: string,
): ClientStateRead<T> {
  const key = clientServerCacheKey(resource, query);
  const entry = clientCacheGet(state.server, key);
  if (entry && entry.resource === resource && entry.classification === "public") {
    return withRead(
      state,
      key,
      clientReadSuccess(CLIENT_SERVER_CACHE_KIND, "cache", entry.data as T),
    );
  }
  return withRead(
    state,
    key,
    clientReadError(CLIENT_SERVER_CACHE_KIND, { code: "not_found", message: "offline cache miss" }),
  );
}

function serveLive<T>(
  state: ClientState,
  resource: ClientCacheableResource,
  query: string,
  result: PlatformReadResult<T>,
): ClientStateRead<T> {
  const key = clientServerCacheKey(resource, query);
  if (!result.success) {
    return withRead(state, key, clientReadError(CLIENT_SERVER_CACHE_KIND, result.error));
  }
  const server = cachePublic(state.server, resource, query, result.data);
  return withRead(
    state,
    key,
    clientReadSuccess(CLIENT_SERVER_CACHE_KIND, "server", result.data),
    server,
  );
}

export function clientStateReadCapabilities(state: ClientState): ClientStateRead<PlatformCapabilityRead> {
  if (!state.online) return serveCache(state, "capabilities", "");
  return serveLive(state, "capabilities", "", clientReadCapabilities());
}

export function clientStateReadIdentity(state: ClientState): ClientStateRead<IdentityReadResponse> {
  if (!state.online) return serveCache(state, "identity", "");
  return serveLive(state, "identity", "", clientReadIdentity());
}

export function clientStateReadTopic(
  state: ClientState,
  topicId: string,
): ClientStateRead<TopicReadResponse> {
  const query = `topicId=${topicId.trim()}`;
  if (!state.online) return serveCache(state, "topics", query);
  return serveLive(state, "topics", query, clientReadTopic(topicId));
}

export function clientStateReadAssessment(
  state: ClientState,
  assessmentSetId: string,
): ClientStateRead<AssessmentSetApiRead> {
  const query = `assessmentSetId=${assessmentSetId.trim()}`;
  if (!state.online) return serveCache(state, "assessment", query);
  return serveLive(state, "assessment", query, clientReadAssessment(assessmentSetId));
}

export function clientStateSearch(state: ClientState, queryText: string): ClientStateRead<SearchResponse> {
  const query = `q=${queryText}`;
  if (!state.online) return serveCache(state, "search", query);
  return serveLive(state, "search", query, clientSearch(queryText));
}

export function clientStateReadAccess(
  state: ClientState,
  query: AccessQuery,
  entitlements: readonly Entitlement[] = [],
): ClientStateRead<AccessDecision> {
  const key = clientServerCacheKey("access", `${query.scope}:${query.targetId}`);
  if (!state.online) {
    const read = clientReadSuccess(
      CLIENT_SERVER_CACHE_KIND,
      "policy",
      clientOfflineProtectedAccess(),
    );
    return withRead(state, key, read);
  }
  const result = clientReadAccess(query, entitlements);
  if (!result.success) {
    return withRead(state, key, clientReadError(CLIENT_SERVER_CACHE_KIND, result.error));
  }
  return withRead(
    state,
    key,
    clientReadSuccess(CLIENT_SERVER_CACHE_KIND, "server", result.data),
  );
}

export function clientStateReadLearnerIntelligence(
  state: ClientState,
): ClientStateRead<LearnerIntelligenceSnapshot> {
  const key = "local-learner/intelligence";
  const result = clientReadLearnerIntelligence(state.local.intelligence, state.local.completedTopicIds);
  if (!result.success) {
    return withRead(state, key, clientReadError(CLIENT_LOCAL_STORE_KIND, result.error));
  }
  return withRead(
    state,
    key,
    clientReadSuccess(CLIENT_LOCAL_STORE_KIND, "local", result.data),
  );
}

export function clientStateReadAi(
  state: ClientState,
  result: AiExperienceResult,
): ClientStateRead<AiExperienceView> {
  const key = "ai/experience";
  if (!state.online) {
    return withRead(
      state,
      key,
      clientReadError(CLIENT_SERVER_CACHE_KIND, {
        code: "invalid_request",
        message: "offline",
      }),
    );
  }
  const mapped = clientReadAi(result);
  if (!mapped.success) {
    return withRead(state, key, clientReadError(CLIENT_SERVER_CACHE_KIND, mapped.error));
  }
  return withRead(
    state,
    key,
    clientReadSuccess(CLIENT_SERVER_CACHE_KIND, "server", mapped.data),
  );
}

export function clientStateWriteLocal(
  state: ClientState,
  input: {
    learnerId?: string;
    completedTopicIds?: readonly string[];
    intelligence?: ClientLocalLearnerRecord["intelligence"];
  },
): PlatformReadResult<ClientState> {
  const written = clientLocalLearnerWrite(state.local, input);
  if (!written.success) return written;
  return platformSuccess({ ...state, local: written.data });
}

export function clientStatePeek(state: ClientState, key: string): ClientReadState<unknown> | undefined {
  return state.reads[key];
}
