/**
 * In-memory server-read cache. Public catalog copies only.
 * Not local learner state, not a grant, not persistence.
 */

import { FORBIDDEN_PLATFORM_FIELDS } from "@/lib/platform/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";
import { clientServerCacheKey } from "./state";
import {
  CLIENT_CACHEABLE_RESOURCES,
  CLIENT_SERVER_CACHE_KIND,
  type ClientCacheableResource,
} from "./types";

const UNSAFE_CACHE_KEYS = [
  ...FORBIDDEN_PLATFORM_FIELDS,
  "payload",
  "answer",
  "correctAnswer",
  "explanation",
  "shortcutOrTrap",
  "mcqPractice",
] as const;

export type ClientServerCacheEntry = {
  key: string;
  resource: ClientCacheableResource;
  classification: "public";
  data: unknown;
};

export type ClientServerCache = {
  kind: typeof CLIENT_SERVER_CACHE_KIND;
  entries: { readonly [key: string]: ClientServerCacheEntry };
};

function collectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    keys.add(key);
    collectKeys(record[key], keys);
  }
  return keys;
}

function isCacheableResource(value: string): value is ClientCacheableResource {
  for (const resource of CLIENT_CACHEABLE_RESOURCES) {
    if (resource === value) return true;
  }
  return false;
}

function cloneJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export function emptyClientServerCache(): ClientServerCache {
  return { kind: CLIENT_SERVER_CACHE_KIND, entries: {} };
}

export function isSafeClientCacheData(value: unknown): boolean {
  if (value === undefined) return false;
  try {
    JSON.stringify(value);
  } catch {
    return false;
  }
  const keys = collectKeys(value);
  for (const banned of UNSAFE_CACHE_KEYS) {
    if (keys.has(banned)) return false;
  }
  return true;
}

export function clientCacheGet(
  cache: ClientServerCache,
  key: string,
): ClientServerCacheEntry | undefined {
  return cache.entries[key];
}

export function clientCachePut(
  cache: ClientServerCache,
  input: {
    resource: string;
    query?: string;
    data: unknown;
    classification: string;
  },
): PlatformReadResult<ClientServerCache> {
  if (!isCacheableResource(input.resource)) {
    return platformFailure("invalid_request", "resource is not cacheable");
  }
  if (input.classification !== "public") {
    return platformFailure("invalid_request", "protected content is not cacheable");
  }
  if (!isSafeClientCacheData(input.data)) {
    return platformFailure("invalid_request", "unsafe cache payload");
  }
  const key = clientServerCacheKey(input.resource, input.query ?? "");
  const entry: ClientServerCacheEntry = {
    key,
    resource: input.resource,
    classification: "public",
    data: cloneJson(input.data),
  };
  return platformSuccess({
    kind: CLIENT_SERVER_CACHE_KIND,
    entries: { ...cache.entries, [key]: entry },
  });
}
