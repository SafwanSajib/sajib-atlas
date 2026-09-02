/**
 * Platform foundation (Phase 8B).
 *
 * Envelope, client surface, version, errors, optional page, capabilities.
 * Composes Phase 1J. Not HTTP, auth, mobile, or a domain catalog.
 */

export { defaultPlatformCapabilities } from "./capabilities";
export { validatePlatformClientIdentity, isPlatformClientSurface } from "./client";
export { validatePlatformRequestContext } from "./context";
export {
  isPlatformReadEnvelope,
  mapAiExperienceResult,
  platformFailure,
  platformSuccess,
} from "./envelope";
export {
  handlePlatformCapabilitiesGet,
  handlePlatformIdentityGet,
  handlePlatformTopicsGet,
  parsePlatformHttpContext,
  platformHttpResponse,
  platformMethodNotAllowed,
  statusForPlatformError,
} from "./http";
export { mapDomainErrorCode, sanitizePlatformErrorMessage, toPlatformError } from "./errors";
export { createPlatformPage, resolvePlatformLimit, validatePlatformCursor } from "./page";
export {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  FORBIDDEN_PLATFORM_FIELDS,
  PLATFORM_API_CONTRACT_VERSIONS,
  PLATFORM_CLIENT_SURFACES,
  PLATFORM_COMMERCE_CAPABILITY,
  PLATFORM_PERSISTENCE_CAPABILITY,
  PLATFORM_READ_ERROR_CODES,
} from "./types";
export type {
  PlatformApiContractVersion,
  PlatformCapabilityRead,
  PlatformClientIdentity,
  PlatformClientSurface,
  PlatformPage,
  PlatformReadError,
  PlatformReadErrorCode,
  PlatformReadFailure,
  PlatformReadResult,
  PlatformReadSuccess,
  PlatformRequestContext,
} from "./types";
