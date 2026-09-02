/**
 * Platform request context. Resolved learnerId is identity, not a credential.
 */

import { isCanonicalLocalLearnerId } from "@/lib/identity/validate";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { validatePlatformClientIdentity } from "./client";
import {
  PLATFORM_API_CONTRACT_VERSIONS,
  type PlatformApiContractVersion,
  type PlatformRequestContext,
} from "./types";

function fail(message: string): never {
  throw new Error(`Platform context: ${message}`);
}

const REQUEST_ID = /^platform-request\/[a-z][a-z0-9-]{2,127}$/;

function isContractVersion(value: string): value is PlatformApiContractVersion {
  for (const version of PLATFORM_API_CONTRACT_VERSIONS) {
    if (version === value) return true;
  }
  return false;
}

export function validatePlatformRequestContext(input: {
  contractVersion: string;
  client: { surface: string };
  learnerId?: string;
  requestId?: string;
}): PlatformRequestContext {
  if (!input || typeof input !== "object") fail("request context must be an object");
  if (!isContractVersion(input.contractVersion)) {
    fail(`invalid contractVersion ${input.contractVersion}`);
  }
  const client = validatePlatformClientIdentity(input.client);
  const context: PlatformRequestContext = {
    contractVersion: input.contractVersion,
    client,
  };
  if (input.learnerId !== undefined) {
    if (!isCanonicalLocalLearnerId(input.learnerId)) {
      fail("learnerId must be learner/local");
    }
    context.learnerId = LOCAL_LEARNER_ID;
  }
  if (input.requestId !== undefined) {
    if (!REQUEST_ID.test(input.requestId)) fail("invalid requestId");
    context.requestId = input.requestId;
  }
  return context;
}
