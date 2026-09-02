/**
 * Client read status. Idle / loading / success / error.
 * Does not fetch, cache, or decide access.
 */

import type { PlatformReadError } from "@/lib/contracts/api";
import type { ClientReadSource, ClientReadState, ClientStoreKind } from "./types";

export function clientReadIdle<T>(store: ClientStoreKind): ClientReadState<T> {
  return { status: "idle", store };
}

export function clientReadLoading<T>(store: ClientStoreKind): ClientReadState<T> {
  return { status: "loading", store };
}

export function clientReadSuccess<T>(
  store: ClientStoreKind,
  source: ClientReadSource,
  data: T,
): ClientReadState<T> {
  return { status: "success", store, source, data };
}

export function clientReadError<T>(
  store: ClientStoreKind,
  error: PlatformReadError,
): ClientReadState<T> {
  return { status: "error", store, error };
}
