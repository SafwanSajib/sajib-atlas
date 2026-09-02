import { getAssessmentSet } from "@/lib/assessment/sets";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { getSubject } from "@/lib/knowledge/catalog";
import { isLocalLearnerId } from "@/lib/learner/identity";
import { entitlementId, primaryTargetId } from "./identity";
import {
  ENTITLEMENT_SCOPES,
  ENTITLEMENT_SOURCES,
  ENTITLEMENT_STATUSES,
  type Entitlement,
  type EntitlementScope,
  type EntitlementSource,
  type EntitlementStatus,
} from "./types";

function fail(message: string): never {
  throw new Error(`Entitlement: ${message}`);
}

const ISO_DATE_TIME_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const FEATURE_KEY = /^[a-z][a-z0-9-]*$/;

function isScope(value: string): value is EntitlementScope {
  for (const scope of ENTITLEMENT_SCOPES) {
    if (scope === value) return true;
  }
  return false;
}

function isStatus(value: string): value is EntitlementStatus {
  for (const status of ENTITLEMENT_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function isSource(value: string): value is EntitlementSource {
  for (const source of ENTITLEMENT_SOURCES) {
    if (source === value) return true;
  }
  return false;
}

export function isIsoDateTimeUtc(value: string): boolean {
  if (!ISO_DATE_TIME_UTC.test(value)) return false;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  const iso = new Date(ms).toISOString();
  if (iso === value) return true;
  if (value.endsWith("Z") && !value.includes(".")) {
    return iso === `${value.slice(0, -1)}.000Z`;
  }
  return false;
}

function assertOptionalTimestamp(value: string | undefined, label: string): void {
  if (value === undefined) return;
  if (!value.trim() || !isIsoDateTimeUtc(value)) fail(`invalid ${label}`);
}

const SOURCE_REFERENCE = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export function validateEntitlement(input: {
  id: string;
  learnerId?: string;
  scope: string;
  target: {
    featureKey?: string;
    subjectId?: string;
    topicId?: string;
    assessmentSetId?: string;
  };
  status: string;
  source?: string;
  grantedAt?: string;
  startsAt?: string;
  expiresAt?: string;
  sourceReference?: string;
}): Entitlement {
  if (!input.id?.trim()) fail("empty entitlement id");
  if (!isScope(input.scope)) fail(`invalid scope ${input.scope}`);
  if (!isStatus(input.status)) fail(`invalid status ${input.status}`);
  if (!input.target) fail("missing target");

  const primary = primaryTargetId(input.scope, input.target);
  if (!primary?.trim()) fail(`scope ${input.scope} requires a primary target id`);

  const expectedId = entitlementId(input.scope, primary);
  if (input.id !== expectedId) fail(`entitlement id must equal ${expectedId}`);

  const target: Entitlement["target"] = {};
  if (input.scope === "feature") {
    if (!FEATURE_KEY.test(primary)) fail(`invalid feature key ${primary}`);
    target.featureKey = primary;
  } else if (input.scope === "subject") {
    if (!getSubject(primary)) fail(`unknown subject ${primary}`);
    target.subjectId = primary;
  } else if (input.scope === "topic") {
    if (!getCanonicalTopic(primary)) fail(`unknown topic ${primary}`);
    target.topicId = primary;
  } else {
    if (!getAssessmentSet(primary)) fail(`unknown assessment set ${primary}`);
    target.assessmentSetId = primary;
  }

  const entitlement: Entitlement = {
    id: input.id,
    scope: input.scope,
    target,
    status: input.status,
  };

  if (input.learnerId !== undefined) {
    if (!isLocalLearnerId(input.learnerId)) {
      fail(`unsupported learnerId ${input.learnerId}`);
    }
    entitlement.learnerId = input.learnerId;
  }

  if (input.source !== undefined) {
    if (!isSource(input.source)) fail(`invalid grant source ${input.source}`);
    entitlement.source = input.source;
  }

  assertOptionalTimestamp(input.grantedAt, "grantedAt");
  assertOptionalTimestamp(input.startsAt, "startsAt");
  assertOptionalTimestamp(input.expiresAt, "expiresAt");
  if (input.grantedAt !== undefined && input.expiresAt !== undefined) {
    if (Date.parse(input.expiresAt) < Date.parse(input.grantedAt)) {
      fail("expiresAt must not precede grantedAt");
    }
  }
  if (input.startsAt !== undefined && input.expiresAt !== undefined) {
    if (Date.parse(input.expiresAt) < Date.parse(input.startsAt)) {
      fail("expiresAt must not precede startsAt");
    }
  }
  if (input.grantedAt !== undefined) entitlement.grantedAt = input.grantedAt;
  if (input.startsAt !== undefined) entitlement.startsAt = input.startsAt;
  if (input.expiresAt !== undefined) entitlement.expiresAt = input.expiresAt;

  if (input.sourceReference !== undefined) {
    if (!input.sourceReference.trim() || !SOURCE_REFERENCE.test(input.sourceReference)) {
      fail("invalid sourceReference");
    }
    if (input.sourceReference.includes("@") || input.sourceReference.includes("/")) {
      fail("invalid sourceReference");
    }
    entitlement.sourceReference = input.sourceReference;
  }

  return entitlement;
}
