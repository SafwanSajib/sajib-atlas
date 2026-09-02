/**
 * Deterministic ranking. Score is an explicit field weight, not array order.
 */

import { SEARCH_RANK_WEIGHTS, type SearchMatchedField } from "./types";

export type RankedMatch = {
  score: number;
  matchedFields: SearchMatchedField[];
};

export function compareRankedResults(
  left: { score: number; id: string },
  right: { score: number; id: string },
): number {
  if (left.score !== right.score) return right.score - left.score;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export { SEARCH_RANK_WEIGHTS };
