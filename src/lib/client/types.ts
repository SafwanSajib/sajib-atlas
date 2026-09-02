/**
 * Shared client adapter contracts (Phase 9B).
 *
 * Reuses Phase 8 types. Not a second envelope, catalog, or learner id.
 * Not Android/iOS, auth, or HTTP routes.
 */

export {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  FORBIDDEN_PLATFORM_FIELDS,
  PLATFORM_CLIENT_SURFACES,
  PLATFORM_READ_ERROR_CODES,
} from "@/lib/platform/types";
export type {
  PlatformCapabilityRead,
  PlatformClientSurface,
  PlatformPage,
  PlatformReadResult,
  PlatformRequestContext,
} from "@/lib/platform/types";

export const CLIENT_STORE_KINDS = ["server-cache", "local-learner"] as const;
export type ClientStoreKind = (typeof CLIENT_STORE_KINDS)[number];

export const CLIENT_LOCAL_STORE_KIND: ClientStoreKind = "local-learner";
export const CLIENT_SERVER_CACHE_KIND: ClientStoreKind = "server-cache";

export type ClientNavigationTarget = {
  kind: "topic";
  topicId: string;
  href: string;
};

export const CLIENT_READ_STATUSES = ["idle", "loading", "success", "error"] as const;
export type ClientReadStatus = (typeof CLIENT_READ_STATUSES)[number];

export const CLIENT_READ_SOURCES = ["server", "cache", "local", "policy"] as const;
export type ClientReadSource = (typeof CLIENT_READ_SOURCES)[number];

export const CLIENT_CACHEABLE_RESOURCES = [
  "capabilities",
  "identity",
  "topics",
  "assessment",
  "search",
] as const;
export type ClientCacheableResource = (typeof CLIENT_CACHEABLE_RESOURCES)[number];

export type ClientReadState<T> = {
  status: ClientReadStatus;
  store: ClientStoreKind;
  source?: ClientReadSource;
  data?: T;
  error?: { code: string; message: string };
};
