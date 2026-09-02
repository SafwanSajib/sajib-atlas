/**
 * Provider-agnostic AI completion boundary.
 *
 * No SDK, API key, environment secret, or network access lives here.
 * Future vendor or local-model adapters implement this interface
 * without changing domain contracts.
 */

import type { AiRequest, AiResponseStatus } from "./types";

export type AiProviderInstructions = {
  system: string;
  user: string;
};

export type AiProviderInput = {
  request: AiRequest;
  instructions?: AiProviderInstructions;
};

export type AiProviderOutput = {
  status: Exclude<AiResponseStatus, "insufficient_context">;
  text: string;
};

export type AiProvider = {
  complete(input: AiProviderInput): Promise<AiProviderOutput>;
};
