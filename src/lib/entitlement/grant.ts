/**
 * Future-safe entitlement grant proposal (Phase 7B).
 *
 * Product → Order → Purchase → Entitlement → Access
 *
 * This module stops before persistence and payment. A proposal is not an
 * access decision and is not a commerce transaction.
 */

import { isCanonicalLocalLearnerId } from "@/lib/identity/validate";
import { entitlementId } from "./identity";
import type { Entitlement, EntitlementGrantProposal, EntitlementTarget } from "./types";
import { validateEntitlement } from "./validate";

function fail(message: string): never {
  throw new Error(`Entitlement grant: ${message}`);
}

function targetFor(
  scope: EntitlementGrantProposal["scope"],
  targetId: string,
): EntitlementTarget {
  if (scope === "feature") return { featureKey: targetId };
  if (scope === "subject") return { subjectId: targetId };
  if (scope === "topic") return { topicId: targetId };
  return { assessmentSetId: targetId };
}

export function proposeEntitlementGrant(input: {
  learnerId: string;
  scope: EntitlementGrantProposal["scope"];
  targetId: string;
  source: EntitlementGrantProposal["source"];
  sourceReference?: string;
  startsAt?: string;
  expiresAt?: string;
}): EntitlementGrantProposal {
  if (!input || typeof input !== "object") fail("proposal must be an object");
  if (!isCanonicalLocalLearnerId(input.learnerId)) fail("learnerId must be learner/local");
  if (!input.targetId?.trim()) fail("targetId is required");

  entitlementFromGrantProposal({
    learnerId: input.learnerId,
    scope: input.scope,
    targetId: input.targetId,
    source: input.source,
    sourceReference: input.sourceReference,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
  });

  const proposal: EntitlementGrantProposal = {
    learnerId: input.learnerId,
    scope: input.scope,
    targetId: input.targetId,
    source: input.source,
  };
  if (input.sourceReference !== undefined) proposal.sourceReference = input.sourceReference;
  if (input.startsAt !== undefined) proposal.startsAt = input.startsAt;
  if (input.expiresAt !== undefined) proposal.expiresAt = input.expiresAt;
  return proposal;
}

/**
 * Materialize a canonical Entitlement from a grant proposal.
 * Does not persist. Access still requires decideAccess.
 */
export function entitlementFromGrantProposal(
  proposal: EntitlementGrantProposal,
): Entitlement {
  if (!proposal || typeof proposal !== "object") fail("proposal must be an object");
  return validateEntitlement({
    id: entitlementId(proposal.scope, proposal.targetId),
    learnerId: proposal.learnerId,
    scope: proposal.scope,
    target: targetFor(proposal.scope, proposal.targetId),
    status: "active",
    source: proposal.source,
    startsAt: proposal.startsAt,
    expiresAt: proposal.expiresAt,
    sourceReference: proposal.sourceReference,
  });
}
