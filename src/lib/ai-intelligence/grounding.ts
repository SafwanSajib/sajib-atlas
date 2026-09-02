/**
 * Deterministic grounding state from retrieval/context policy.
 * Not model self-reported confidence.
 */

import {
  AI_GROUNDED_MIN_SCORE,
  AI_MIN_GROUNDING_SCORE,
  type AiGroundingState,
  type AiRequest,
} from "./types";

export function highestRetrievalScore(request: AiRequest): number {
  let highest = 0;
  for (const item of request.context.references) {
    const score = item.score ?? 0;
    if (score > highest) highest = score;
  }
  return highest;
}

export function deriveGroundingState(request: AiRequest): AiGroundingState {
  if (request.intent === "explain-assessment" && request.context.assessment?.result) {
    return "grounded";
  }
  const highest = highestRetrievalScore(request);
  if (highest >= AI_GROUNDED_MIN_SCORE) return "grounded";
  if (highest >= AI_MIN_GROUNDING_SCORE) return "weakly-grounded";
  return "insufficient-context";
}

export function hasSufficientGrounding(request: AiRequest): boolean {
  return deriveGroundingState(request) !== "insufficient-context";
}
