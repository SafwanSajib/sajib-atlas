/**
 * Public identity read contract. JSON-safe. No secrets or provider subjects.
 */

import { localLearnerIdentity } from "./resolve";
import type { IdentityRead, LearnerIdentity } from "./types";
import { validateLearnerIdentity } from "./validate";

export function toIdentityRead(identity: LearnerIdentity): IdentityRead {
  const validated = validateLearnerIdentity(identity);
  return {
    learnerId: validated.learnerId,
    mode: validated.mode,
    status: validated.status,
  };
}

export function defaultIdentityRead(): IdentityRead {
  return toIdentityRead(localLearnerIdentity());
}
