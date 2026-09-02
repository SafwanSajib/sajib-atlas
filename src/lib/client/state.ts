/**
 * Client state boundary. Server-read cache keys are not local learner state.
 * Does not persist, grant access, or own sajib_atlas_learner_state.
 */

import { CURRENT_PLATFORM_API_CONTRACT_VERSION } from "@/lib/platform/types";
import type { AccessDecision } from "@/lib/entitlement/types";
import { CLIENT_LOCAL_STORE_KIND, CLIENT_SERVER_CACHE_KIND, type ClientStoreKind } from "./types";

function fail(message: string): never {
  throw new Error(`Client state: ${message}`);
}

export function clientStoreKind(kind: string): ClientStoreKind {
  if (kind === CLIENT_SERVER_CACHE_KIND) return CLIENT_SERVER_CACHE_KIND;
  if (kind === CLIENT_LOCAL_STORE_KIND) return CLIENT_LOCAL_STORE_KIND;
  fail("unknown store kind");
}

export function clientServerCacheKey(resource: string, query: string = ""): string {
  if (!resource?.trim()) fail("resource is required");
  if (resource.includes("@") || resource.toLowerCase().includes("src/")) fail("invalid resource");
  const base = `platform-cache/${CURRENT_PLATFORM_API_CONTRACT_VERSION}/${resource.trim()}`;
  if (!query.trim()) return base;
  return `${base}?${query.trim()}`;
}

/** Cached AccessDecision is not a grant. Protected resources fail closed offline. */
export function clientOfflineProtectedAccess(): AccessDecision {
  return { allowed: false, reason: "missing", classification: "protected" };
}
