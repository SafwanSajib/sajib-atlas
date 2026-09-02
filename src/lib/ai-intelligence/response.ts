/**
 * Map provider output onto the domain AiResponse. Distinguishes generated
 * prose from grounding references. Does not expose provider SDK objects.
 */

import { groundingFromReferences } from "./context";
import { aiFailure } from "./errors";
import type { AiProvider, AiProviderInstructions } from "./provider";
import { responseIdForRequest } from "./request";
import { assertAiSafeSurface } from "./safety";
import { deriveGroundingState } from "./grounding";
import {
  AI_MAX_OUTPUT_LENGTH,
  AI_SCHEMA_VERSION,
  type AiIntelligenceResult,
  type AiRequest,
  type AiResponse,
  type AiResponseStatus,
} from "./types";
import { validateAiResponse } from "./validate";

function capOutput(text: string): string {
  if (text.length <= AI_MAX_OUTPUT_LENGTH) return text;
  return text.slice(0, AI_MAX_OUTPUT_LENGTH);
}

export async function createAiResponse(
  request: AiRequest,
  provider: AiProvider,
  instructions?: AiProviderInstructions,
): Promise<AiIntelligenceResult<AiResponse>> {
  const output = await provider.complete({ request, instructions });
  if (output === null || typeof output !== "object") {
    return aiFailure("provider_failure", "provider output must be an object");
  }
  if (output.status !== "success" && output.status !== "failed" && output.status !== "blocked") {
    return aiFailure("provider_failure", "provider status is invalid");
  }
  if (typeof output.text !== "string") {
    return aiFailure("provider_failure", "provider text must be a string");
  }

  const draft: AiResponse = {
    schemaVersion: AI_SCHEMA_VERSION,
    requestId: request.requestId,
    responseId: responseIdForRequest(request.requestId),
    status: output.status,
    output: { kind: "generated", text: capOutput(output.text) },
    grounding: groundingFromReferences(request.context.references),
    groundingState: deriveGroundingState(request),
    provider: { bound: true },
  };

  if (output.status === "success") {
    const unsafe = assertAiSafeSurface({ output: draft.output, grounding: draft.grounding }, "provider output");
    if (unsafe) return aiFailure("blocked", unsafe);
  }

  return validateAiResponse(draft);
}

export function createInsufficientContextResponse(request: AiRequest): AiResponse {
  const status: AiResponseStatus = "insufficient_context";
  return {
    schemaVersion: AI_SCHEMA_VERSION,
    requestId: request.requestId,
    responseId: responseIdForRequest(request.requestId),
    status,
    output: {
      kind: "generated",
      text: "Insufficient canonical context to produce a grounded answer.",
    },
    grounding: groundingFromReferences(request.context.references),
    groundingState: "insufficient-context",
    provider: { bound: false },
  };
}
