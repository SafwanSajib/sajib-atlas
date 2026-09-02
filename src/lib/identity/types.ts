/**
 * Identity foundation (Phase 7A).
 *
 * Authentication → Identity Resolution → Canonical Learner Identity
 *   → Learner Profile / Goals / Intelligence
 *
 * This module owns canonical learner identity. It is not authentication,
 * not LearnerProfile, not learner state, not entitlement, and not commerce.
 *
 * JSON-safe primitives only. No Date, Map, functions, React, cookies,
 * tokens, or secrets.
 */

/** Canonical local learner identity. Do not hash, replace, or UUID this value. */
export const LOCAL_LEARNER_ID = "learner/local";

export const IDENTITY_MODES = ["local", "authenticated", "external"] as const;
export type IdentityMode = (typeof IDENTITY_MODES)[number];

/** Only local is active in Phase 7A. Other modes are structural. */
export const ACTIVE_IDENTITY_MODE: IdentityMode = "local";

export const IDENTITY_STATUSES = ["active", "disabled"] as const;
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];

/**
 * Canonical platform learner id.
 * Local: `learner/local`. Future authenticated: `learner/{opaque-id}`.
 */
export type IdentityId = string;

/**
 * Canonical Sajib Atlas learner. Not an auth user and not a profile.
 */
export type LearnerIdentity = {
  learnerId: string;
  mode: IdentityMode;
  status: IdentityStatus;
};

/**
 * Authentication answers whether a principal has been authenticated.
 * Provider subject must never become learnerId.
 */
export type AuthenticationIdentity = {
  authenticated: boolean;
  provider?: string;
  subject?: string;
};

/**
 * External provider reference. Internal representation only.
 * External identity ≠ canonical learner identity.
 * Not part of the public identity read contract.
 */
export type ExternalIdentityRef = {
  provider: string;
  subject: string;
};

export type IdentityResolutionInput = {
  mode?: IdentityMode;
  learnerId?: string;
  authentication?: AuthenticationIdentity;
  external?: ExternalIdentityRef;
};

export const IDENTITY_ERROR_CODES = [
  "invalid_identity",
  "unsupported_identity_mode",
  "identity_not_found",
] as const;
export type IdentityErrorCode = (typeof IDENTITY_ERROR_CODES)[number];

export type IdentityError = {
  code: IdentityErrorCode;
  message: string;
};

export type IdentityResolution =
  | { ok: true; identity: LearnerIdentity }
  | { ok: false; error: IdentityError };

/** Public JSON-safe identity read. No email, phone, tokens, or provider subject. */
export type IdentityRead = {
  learnerId: string;
  mode: IdentityMode;
  status: IdentityStatus;
};

export type IdentityResolver = {
  resolve(input?: IdentityResolutionInput): IdentityResolution;
};

/**
 * Future provider-neutral authentication source.
 * Not an identity authority and not a learner profile.
 */
export type AuthenticationIdentitySource = {
  current(): AuthenticationIdentity | undefined;
};

export const FORBIDDEN_PUBLIC_IDENTITY_FIELDS = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "clientSecret",
  "providerSecret",
  "authorization",
  "cookie",
  "sessionToken",
  "credential",
  "cvv",
  "cardNumber",
  "internalPath",
  "filesystemPath",
  "providerPayload",
  "rawResponse",
  "email",
  "phone",
  "sessionId",
] as const;

export const IDENTITY_MIGRATION_OPERATION = "migrate-local-to-authenticated" as const;

/**
 * Future local → authenticated migration contract.
 * Describes intent only. Does not copy, merge, delete, or persist state.
 */
export type IdentityMigrationDescription = {
  operation: typeof IDENTITY_MIGRATION_OPERATION;
  fromLearnerId: string;
  toLearnerId: string;
  copiesState: false;
  deletesState: false;
  mergesRecords: false;
  implemented: false;
};
