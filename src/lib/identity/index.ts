/**
 * Identity foundation (Phase 7A).
 *
 * Canonical learner identity and resolution. Not authentication, profile,
 * learner state, entitlement, or commerce. Local mode only.
 */

export { describeLocalToAuthenticatedMigration } from "./migration";
export type { IdentityMigrationResult } from "./migration";
export { defaultIdentityRead, toIdentityRead } from "./read";
export {
  createLocalIdentityResolver,
  createUnauthenticatedIdentitySource,
  localLearnerIdentity,
  resolveLearnerIdentity,
} from "./resolve";
export {
  ACTIVE_IDENTITY_MODE,
  FORBIDDEN_PUBLIC_IDENTITY_FIELDS,
  IDENTITY_ERROR_CODES,
  IDENTITY_MIGRATION_OPERATION,
  IDENTITY_MODES,
  IDENTITY_STATUSES,
  LOCAL_LEARNER_ID,
} from "./types";
export type {
  AuthenticationIdentity,
  AuthenticationIdentitySource,
  ExternalIdentityRef,
  IdentityError,
  IdentityErrorCode,
  IdentityId,
  IdentityMigrationDescription,
  IdentityMode,
  IdentityRead,
  IdentityResolution,
  IdentityResolutionInput,
  IdentityResolver,
  IdentityStatus,
  LearnerIdentity,
} from "./types";
export {
  assertExternalIsNotCanonical,
  isCanonicalLocalLearnerId,
  isIdentityMode,
  isIdentityStatus,
  isOpaqueAuthenticatedLearnerIdShape,
  isUnsafeCanonicalLearnerId,
  validateAuthenticationIdentity,
  validateExternalIdentityRef,
  validateLearnerIdentity,
} from "./validate";
