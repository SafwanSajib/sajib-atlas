/**
 * Future local → authenticated migration boundary.
 * Contract only: does not copy, merge, delete, or persist learner state.
 */

import { IDENTITY_MIGRATION_OPERATION, LOCAL_LEARNER_ID, type IdentityError, type IdentityErrorCode, type IdentityMigrationDescription, type LearnerIdentity } from "./types";
import { isCanonicalLocalLearnerId, isOpaqueAuthenticatedLearnerIdShape, isUnsafeCanonicalLearnerId, validateLearnerIdentity } from "./validate";

export type IdentityMigrationResult =
  | { ok: true; description: IdentityMigrationDescription }
  | { ok: false; error: IdentityError };

function failure(code: IdentityErrorCode, message: string): IdentityMigrationResult {
  return { ok: false, error: { code, message } };
}

/**
 * Describe how local → authenticated migration could later occur.
 * Does not perform migration.
 */
export function describeLocalToAuthenticatedMigration(
  authenticatedIdentity: LearnerIdentity,
): IdentityMigrationResult {
  let validated: LearnerIdentity;
  try {
    validated = validateLearnerIdentity(authenticatedIdentity);
  } catch {
    return failure("invalid_identity", "authenticated identity is invalid");
  }
  if (validated.mode !== "authenticated") {
    return failure("unsupported_identity_mode", "migration target must be authenticated");
  }
  if (isCanonicalLocalLearnerId(validated.learnerId)) {
    return failure("invalid_identity", "migration target cannot be learner/local");
  }
  if (isUnsafeCanonicalLearnerId(validated.learnerId)) {
    return failure("invalid_identity", "migration target cannot be email, phone, provider subject, or token");
  }
  if (!isOpaqueAuthenticatedLearnerIdShape(validated.learnerId)) {
    return failure("invalid_identity", "migration target must be an opaque learner/{id}");
  }

  const description: IdentityMigrationDescription = {
    operation: IDENTITY_MIGRATION_OPERATION,
    fromLearnerId: LOCAL_LEARNER_ID,
    toLearnerId: validated.learnerId,
    copiesState: false,
    deletesState: false,
    mergesRecords: false,
    implemented: false,
  };
  return { ok: true, description };
}
