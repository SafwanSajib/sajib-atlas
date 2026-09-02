/**
 * Pure identity resolution. Local mode only.
 * Does not read cookies, query a database, or call a provider.
 */

import {
  ACTIVE_IDENTITY_MODE,
  LOCAL_LEARNER_ID,
  type AuthenticationIdentitySource,
  type IdentityError,
  type IdentityErrorCode,
  type IdentityResolution,
  type IdentityResolutionInput,
  type IdentityResolver,
  type LearnerIdentity,
} from "./types";
import { isCanonicalLocalLearnerId, isIdentityMode, isUnsafeCanonicalLearnerId } from "./validate";

function failure(code: IdentityErrorCode, message: string): IdentityResolution {
  const error: IdentityError = { code, message };
  return { ok: false, error };
}

export function localLearnerIdentity(): LearnerIdentity {
  return {
    learnerId: LOCAL_LEARNER_ID,
    mode: "local",
    status: "active",
  };
}

/**
 * Resolve the canonical Sajib Atlas learner.
 * Current implementation supports local → learner/local only.
 */
export function resolveLearnerIdentity(
  input: IdentityResolutionInput = {},
): IdentityResolution {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return failure("invalid_identity", "identity input must be an object");
  }

  const mode = input.mode ?? ACTIVE_IDENTITY_MODE;
  if (!isIdentityMode(mode)) {
    return failure("invalid_identity", "identity mode is invalid");
  }
  if (mode === "authenticated") {
    return failure(
      "unsupported_identity_mode",
      "authenticated identity is not active",
    );
  }
  if (mode === "external") {
    return failure(
      "unsupported_identity_mode",
      "external identity is not canonical learner identity",
    );
  }

  if (input.external !== undefined) {
    return failure(
      "invalid_identity",
      "external identity is not canonical learner identity",
    );
  }

  if (input.authentication?.authenticated === true) {
    return failure(
      "unsupported_identity_mode",
      "authentication is not identity resolution",
    );
  }

  if (input.learnerId !== undefined) {
    if (typeof input.learnerId !== "string" || !input.learnerId.trim()) {
      return failure("invalid_identity", "learnerId is invalid");
    }
    if (isUnsafeCanonicalLearnerId(input.learnerId)) {
      return failure(
        "invalid_identity",
        "learnerId cannot be email, phone, provider subject, or token",
      );
    }
    if (!isCanonicalLocalLearnerId(input.learnerId)) {
      return failure("identity_not_found", "local identity is learner/local");
    }
  }

  return { ok: true, identity: localLearnerIdentity() };
}

export function createLocalIdentityResolver(): IdentityResolver {
  return { resolve: resolveLearnerIdentity };
}

export function createUnauthenticatedIdentitySource(): AuthenticationIdentitySource {
  return {
    current: () => ({ authenticated: false }),
  };
}
