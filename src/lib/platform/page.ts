/**
 * Optional collection page. Does not replace Search limit/total.
 */

import { SEARCH_DEFAULT_LIMIT, SEARCH_MAX_LIMIT } from "@/lib/search/types";
import type { PlatformPage } from "./types";

function fail(message: string): never {
  throw new Error(`Platform page: ${message}`);
}

export function validatePlatformCursor(cursor: string): string {
  if (!cursor?.trim()) fail("empty cursor");
  if (/^\d+$/.test(cursor)) fail("cursor must not be a numeric offset");
  if (cursor.includes("@") || cursor.includes("..") || cursor.toLowerCase().includes("src/")) {
    fail("invalid cursor");
  }
  return cursor;
}

export function resolvePlatformLimit(raw: string | null | undefined): number {
  if (raw === null || raw === undefined || raw.trim() === "") return SEARCH_DEFAULT_LIMIT;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > SEARCH_MAX_LIMIT) {
    fail(`limit must be between 1 and ${SEARCH_MAX_LIMIT}`);
  }
  return limit;
}

export function createPlatformPage<T>(
  items: readonly T[],
  limit: number = SEARCH_DEFAULT_LIMIT,
): PlatformPage<T> {
  if (!Array.isArray(items)) fail("items must be an array");
  if (!Number.isInteger(limit) || limit < 1 || limit > SEARCH_MAX_LIMIT) {
    fail(`limit must be between 1 and ${SEARCH_MAX_LIMIT}`);
  }
  const sliced = items.slice(0, limit);
  const page: PlatformPage<T> = { items: sliced, limit };
  if (items.length > limit) page.nextCursor = "cursor/continue";
  return page;
}
