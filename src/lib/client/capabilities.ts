/**
 * Platform capability and identity reads. Reuses Phase 8 helpers.
 */

import { composeDefaultIdentityReadResponse } from "@/lib/contracts/compose";
import type { IdentityReadResponse } from "@/lib/contracts/api";
import { defaultPlatformCapabilities } from "@/lib/platform/capabilities";
import { platformSuccess } from "@/lib/platform/envelope";
import type { PlatformCapabilityRead, PlatformReadResult } from "@/lib/platform/types";

export function clientReadCapabilities(): PlatformReadResult<PlatformCapabilityRead> {
  return platformSuccess(defaultPlatformCapabilities());
}

export function clientReadIdentity(): PlatformReadResult<IdentityReadResponse> {
  return platformSuccess(composeDefaultIdentityReadResponse());
}
