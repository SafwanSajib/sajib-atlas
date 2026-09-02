/**
 * Entitlement & access foundation (Phase 1H / 7B).
 *
 * Entitlement → Access. Not payment, authentication, persistence, or UI.
 */

export { classifyAccess, decideAccess, hasEntitlement, isPublicCatalogResource } from "./access";
export { entitlementFromGrantProposal, proposeEntitlementGrant } from "./grant";
export { entitlementId, primaryTargetId } from "./identity";
export type { EntitlementStore } from "./store";
export {
  ACCESS_CLASSIFICATIONS,
  ACCESS_REASONS,
  ENTITLEMENT_SCOPES,
  ENTITLEMENT_SOURCES,
  ENTITLEMENT_STATUSES,
  FORBIDDEN_ENTITLEMENT_FIELDS,
} from "./types";
export type {
  AccessClassification,
  AccessDecision,
  AccessEvaluationOptions,
  AccessQuery,
  AccessReason,
  Entitlement,
  EntitlementGrantProposal,
  EntitlementScope,
  EntitlementSource,
  EntitlementStatus,
  EntitlementTarget,
} from "./types";
export { isIsoDateTimeUtc, validateEntitlement } from "./validate";
