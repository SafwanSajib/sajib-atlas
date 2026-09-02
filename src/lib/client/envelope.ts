/**
 * Parse Phase 8 envelopes. Not a second result type.
 */

import { isPlatformReadEnvelope, platformFailure } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";

export async function readClientEnvelope<T>(
  response: Response,
): Promise<PlatformReadResult<T>> {
  let body: unknown;
  try {
    body = JSON.parse(await response.text()) as unknown;
  } catch {
    return platformFailure("invalid_request", "malformed request");
  }
  if (!isPlatformReadEnvelope(body)) {
    return platformFailure("invalid_request", "malformed request");
  }
  return body as PlatformReadResult<T>;
}
