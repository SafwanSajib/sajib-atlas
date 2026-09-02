/**
 * Platform capability discovery. Not Topic Engine per-topic capabilities.
 */

import { CURRENT_PLATFORM_API_CONTRACT_VERSION } from "@/lib/contracts/api";
import { defaultIdentityRead } from "@/lib/identity/read";
import type { PlatformCapabilityRead } from "./types";

export function defaultPlatformCapabilities(): PlatformCapabilityRead {
  return {
    contractVersion: CURRENT_PLATFORM_API_CONTRACT_VERSION,
    identity: defaultIdentityRead(),
    authentication: false,
    knowledgeRead: true,
    search: true,
    assessmentContracts: true,
    learnerIntelligence: true,
    aiAsk: true,
    entitlement: true,
    commerce: "records-only",
    persistence: "local",
  };
}
