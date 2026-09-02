/**
 * Platform foundation contracts (Phase 8B).
 *
 * Thin composition over Phase 1J. Not HTTP, not a domain catalog, not
 * authentication. Client surface is not learner identity.
 *
 * JSON-safe primitives only.
 */

import type { IdentityRead } from "@/lib/identity/types";
import {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  PLATFORM_API_CONTRACT_VERSIONS,
  PLATFORM_READ_ERROR_CODES,
  type PlatformApiContractVersion,
  type PlatformReadError,
  type PlatformReadErrorCode,
  type PlatformReadFailure,
  type PlatformReadResult,
  type PlatformReadSuccess,
} from "@/lib/contracts/api";

export {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  PLATFORM_API_CONTRACT_VERSIONS,
  PLATFORM_READ_ERROR_CODES,
};
export type {
  PlatformApiContractVersion,
  PlatformReadError,
  PlatformReadErrorCode,
  PlatformReadFailure,
  PlatformReadResult,
  PlatformReadSuccess,
};

export const PLATFORM_CLIENT_SURFACES = ["web", "android", "ios", "api"] as const;
export type PlatformClientSurface = (typeof PLATFORM_CLIENT_SURFACES)[number];

/** Surface identity. Not a learner, account, or device advertising id. */
export type PlatformClientIdentity = {
  surface: PlatformClientSurface;
};

export type PlatformRequestContext = {
  contractVersion: PlatformApiContractVersion;
  client: PlatformClientIdentity;
  learnerId?: string;
  requestId?: string;
};

export type PlatformPage<T> = {
  items: readonly T[];
  limit: number;
  nextCursor?: string;
};

export const PLATFORM_COMMERCE_CAPABILITY = "records-only" as const;
export const PLATFORM_PERSISTENCE_CAPABILITY = "local" as const;

/**
 * Platform surface availability. Not Topic Engine capability discovery.
 */
export type PlatformCapabilityRead = {
  contractVersion: PlatformApiContractVersion;
  identity: IdentityRead;
  authentication: false;
  knowledgeRead: true;
  search: true;
  assessmentContracts: true;
  learnerIntelligence: true;
  aiAsk: true;
  entitlement: true;
  commerce: typeof PLATFORM_COMMERCE_CAPABILITY;
  persistence: typeof PLATFORM_PERSISTENCE_CAPABILITY;
};

export const FORBIDDEN_PLATFORM_FIELDS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "credential",
  "sessionToken",
  "privateKey",
  "cardNumber",
  "cvv",
  "providerPayload",
  "rawResponse",
] as const;
