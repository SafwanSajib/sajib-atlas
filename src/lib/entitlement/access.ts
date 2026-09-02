/**
 * Pure access evaluation (Phase 1H / 7B).
 *
 * Resource → Access Classification → Entitlement Evaluation → Access Decision
 *
 * Does not read storage, authenticate, call APIs, mutate state, or process payment.
 * Catalog subjects, topics, and assessment sets are public. Features are protected.
 * Matching is exact scope + targetId. No subject→topic inheritance.
 */

import { getAssessmentSet } from "@/lib/assessment/sets";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { getSubject } from "@/lib/knowledge/catalog";
import { primaryTargetId } from "./identity";
import type {
  AccessClassification,
  AccessDecision,
  AccessEvaluationOptions,
  AccessQuery,
  AccessReason,
  Entitlement,
  EntitlementScope,
} from "./types";
import { FORBIDDEN_ENTITLEMENT_FIELDS } from "./types";
import { isIsoDateTimeUtc, validateEntitlement } from "./validate";

export function isPublicCatalogResource(scope: EntitlementScope, targetId: string): boolean {
  if (!targetId?.trim()) return false;
  if (scope === "feature") return false;
  if (scope === "subject") return getSubject(targetId) !== undefined;
  if (scope === "topic") return getCanonicalTopic(targetId) !== undefined;
  return getAssessmentSet(targetId) !== undefined;
}

export function classifyAccess(scope: EntitlementScope, targetId: string): AccessClassification {
  return isPublicCatalogResource(scope, targetId) ? "public" : "protected";
}

function decision(
  allowed: boolean,
  reason: AccessReason,
  classification: AccessClassification,
): AccessDecision {
  return { allowed, reason, classification };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasForbiddenEntitlementFields(value: Record<string, unknown>): boolean {
  for (const key of FORBIDDEN_ENTITLEMENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  }
  return false;
}

function evaluationInstant(
  query: AccessQuery,
  options: AccessEvaluationOptions | undefined,
): string | undefined {
  const raw = options?.now ?? query.asOf;
  if (raw === undefined) return undefined;
  if (!isIsoDateTimeUtc(raw)) return undefined;
  return raw;
}

function ownsEntitlement(learnerId: string | undefined, currentLearnerId: string | undefined): boolean {
  if (learnerId === undefined) return true;
  if (!currentLearnerId) return false;
  return learnerId === currentLearnerId;
}

function targetOf(entitlement: Entitlement): string | undefined {
  return primaryTargetId(entitlement.scope, entitlement.target);
}

function matchesExact(
  entitlement: Entitlement,
  query: AccessQuery,
): boolean {
  if (entitlement.scope !== query.scope) return false;
  return targetOf(entitlement) === query.targetId;
}

function windowState(
  entitlement: Entitlement,
  now: string | undefined,
): "in" | "before" | "after" | "unknown" {
  if (entitlement.startsAt === undefined && entitlement.expiresAt === undefined) return "in";
  if (!now) return "unknown";
  const instant = Date.parse(now);
  if (entitlement.startsAt !== undefined) {
    if (instant < Date.parse(entitlement.startsAt)) return "before";
  }
  if (entitlement.expiresAt !== undefined) {
    if (instant > Date.parse(entitlement.expiresAt)) return "after";
  }
  return "in";
}

function usableEntitlement(value: unknown): Entitlement | undefined {
  if (!isRecord(value)) return undefined;
  if (hasForbiddenEntitlementFields(value)) return undefined;
  const target = isRecord(value.target) ? value.target : undefined;
  try {
    return validateEntitlement({
      id: typeof value.id === "string" ? value.id : "",
      learnerId: typeof value.learnerId === "string" ? value.learnerId : undefined,
      scope: typeof value.scope === "string" ? value.scope : "",
      target: {
        featureKey: typeof target?.featureKey === "string" ? target.featureKey : undefined,
        subjectId: typeof target?.subjectId === "string" ? target.subjectId : undefined,
        topicId: typeof target?.topicId === "string" ? target.topicId : undefined,
        assessmentSetId: typeof target?.assessmentSetId === "string" ? target.assessmentSetId : undefined,
      },
      status: typeof value.status === "string" ? value.status : "",
      source: typeof value.source === "string" ? value.source : undefined,
      grantedAt: typeof value.grantedAt === "string" ? value.grantedAt : undefined,
      startsAt: typeof value.startsAt === "string" ? value.startsAt : undefined,
      expiresAt: typeof value.expiresAt === "string" ? value.expiresAt : undefined,
      sourceReference: typeof value.sourceReference === "string" ? value.sourceReference : undefined,
    });
  } catch {
    return undefined;
  }
}

/**
 * Pure, fail-closed access decision. Public catalog resources stay free.
 */
export function decideAccess(
  query: AccessQuery,
  entitlements: readonly Entitlement[],
  options?: AccessEvaluationOptions,
): AccessDecision {
  const classification = classifyAccess(query.scope, query.targetId);
  if (classification === "public") {
    return decision(true, "free", "public");
  }

  const now = evaluationInstant(query, options);
  let sawRevoked = false;
  let sawExpired = false;

  for (const item of entitlements) {
    const record = isRecord(item) ? item : undefined;
    if (record && hasForbiddenEntitlementFields(record)) {
      continue;
    }
    if (record && typeof record.learnerId === "string" && !ownsEntitlement(record.learnerId, query.learnerId)) {
      continue;
    }

    const entitlement = usableEntitlement(item);
    if (!entitlement) continue;
    if (!ownsEntitlement(entitlement.learnerId, query.learnerId)) continue;
    if (!matchesExact(entitlement, query)) continue;

    if (entitlement.status === "revoked") {
      sawRevoked = true;
      continue;
    }

    const window = windowState(entitlement, now);
    if (entitlement.status === "expired" || window === "after") {
      sawExpired = true;
      continue;
    }
    if (window === "before" || window === "unknown") continue;
    if (entitlement.status !== "active") continue;

    return decision(true, "entitled", "protected");
  }

  if (sawRevoked) return decision(false, "revoked", "protected");
  if (sawExpired) return decision(false, "expired", "protected");
  return decision(false, "missing", "protected");
}

export function hasEntitlement(
  query: AccessQuery,
  entitlements: readonly Entitlement[],
  options?: AccessEvaluationOptions,
): boolean {
  return decideAccess(query, entitlements, options).allowed;
}
