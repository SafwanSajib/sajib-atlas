/**
 * Client API request builder. Headers and Request only.
 * Does not score, grant access, or send learner spoof headers.
 */

import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { validatePlatformRequestContext } from "@/lib/platform/context";
import { CURRENT_PLATFORM_API_CONTRACT_VERSION } from "@/lib/platform/types";

export function createClientRequestHeaders(input: {
  surface: string;
  requestId?: string;
}): Record<string, string> {
  const context = validatePlatformRequestContext({
    contractVersion: CURRENT_PLATFORM_API_CONTRACT_VERSION,
    client: { surface: input.surface },
    learnerId: LOCAL_LEARNER_ID,
    ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
  });
  const headers: Record<string, string> = {
    "X-Platform-Client": context.client.surface,
    "X-Platform-Contract-Version": context.contractVersion,
  };
  if (context.requestId) headers["X-Platform-Request-Id"] = context.requestId;
  return headers;
}

export function createClientRequest(input: {
  surface: string;
  url: string;
  requestId?: string;
}): Request {
  return new Request(input.url, {
    method: "GET",
    headers: createClientRequestHeaders(input),
  });
}
