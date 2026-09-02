/**
 * Entitlement/access read. Delegates to decideAccess.
 * Client UI is not the access authority.
 */

import { decideAccess } from "@/lib/entitlement/access";
import type { AccessDecision, AccessQuery, Entitlement } from "@/lib/entitlement/types";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";

export function clientReadAccess(
  query: AccessQuery,
  entitlements: readonly Entitlement[] = [],
): PlatformReadResult<AccessDecision> {
  if (!query || typeof query !== "object") {
    return platformFailure("invalid_request", "access query is required");
  }
  const learnerId = query.learnerId ?? LOCAL_LEARNER_ID;
  if (learnerId !== LOCAL_LEARNER_ID) {
    return platformFailure("invalid_request", "learnerId must be learner/local");
  }
  return platformSuccess(
    decideAccess({ ...query, learnerId: LOCAL_LEARNER_ID }, entitlements),
  );
}
