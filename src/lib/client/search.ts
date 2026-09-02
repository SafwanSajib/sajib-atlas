/**
 * Search read. Delegates to Search retrieve. Does not re-rank.
 */

import { searchKnowledge } from "@/lib/search/retrieve";
import type { SearchResponse } from "@/lib/search/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";

export function clientSearch(
  query: string,
  limit?: number,
): PlatformReadResult<SearchResponse> {
  const result = searchKnowledge(query, limit === undefined ? {} : { limit });
  if (result.ok) return platformSuccess(result.data);
  return platformFailure(result.error.code, result.error.message);
}
