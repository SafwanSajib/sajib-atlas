/**
 * Dispatch to existing Phase 8 HTTP handlers. Does not add product routes.
 */

import { platformFailure } from "@/lib/platform/envelope";
import {
  handlePlatformCapabilitiesGet,
  handlePlatformIdentityGet,
  handlePlatformTopicsGet,
} from "@/lib/platform/http";
import type { PlatformReadResult } from "@/lib/platform/types";
import { readClientEnvelope } from "./envelope";

export async function clientExecuteRequest(request: Request): Promise<PlatformReadResult<unknown>> {
  let path: string;
  try {
    path = new URL(request.url).pathname;
  } catch {
    return platformFailure("invalid_request", "malformed request");
  }
  if (path === "/api/v1/capabilities") {
    return readClientEnvelope(handlePlatformCapabilitiesGet(request));
  }
  if (path === "/api/v1/identity") {
    return readClientEnvelope(handlePlatformIdentityGet(request));
  }
  if (path === "/api/v1/topics") {
    return readClientEnvelope(handlePlatformTopicsGet(request));
  }
  return platformFailure("invalid_request", "malformed request");
}
