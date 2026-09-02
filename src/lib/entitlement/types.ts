/**
 * Entitlement identity contract (Phase 1H).
 *
 * Answers whether a local learner/client has access. Not a purchase, payment,
 * subscription, invoice, or transaction.
 *
 * JSON-safe primitives only. No Date, Map, functions, or financial fields.
 */

export const ENTITLEMENT_SCOPES = ["feature", "subject", "topic", "assessment_set"] as const;
export type EntitlementScope = (typeof ENTITLEMENT_SCOPES)[number];

export const ENTITLEMENT_STATUSES = ["active", "expired", "revoked"] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

/**
 * How access was granted. Identifiers only — no commerce implementation.
 */
export const ENTITLEMENT_SOURCES = [
  "free",
  "manual",
  "purchase",
  "subscription",
  "promotional",
] as const;
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

/**
 * Canonical id or feature key. Do not embed knowledge or MCQ payloads.
 */
export type EntitlementTarget = {
  featureKey?: string;
  subjectId?: string;
  topicId?: string;
  assessmentSetId?: string;
};

export type Entitlement = {
  id: string;
  learnerId?: string;
  scope: EntitlementScope;
  target: EntitlementTarget;
  status: EntitlementStatus;
  source?: EntitlementSource;
  grantedAt?: string;
  /** Inclusive access window start. Distinct from grantedAt. */
  startsAt?: string;
  expiresAt?: string;
  /** Opaque grant reference. Not a payment, token, or secret. */
  sourceReference?: string;
};

export type AccessQuery = {
  scope: EntitlementScope;
  targetId: string;
  learnerId?: string;
  /** Optional ISO-8601 UTC instant used to evaluate startsAt/expiresAt. */
  asOf?: string;
};

export type AccessEvaluationOptions = {
  /** Injectable evaluation instant. Overrides query.asOf when provided. */
  now?: string;
};

/**
 * Public catalog access remains `free` (Phase 1H).
 * `missing` means entitlement is required and none is currently valid.
 */
export const ACCESS_REASONS = ["free", "entitled", "missing", "expired", "revoked"] as const;
export type AccessReason = (typeof ACCESS_REASONS)[number];

export const ACCESS_CLASSIFICATIONS = ["public", "protected"] as const;
export type AccessClassification = (typeof ACCESS_CLASSIFICATIONS)[number];

export type AccessDecision = {
  allowed: boolean;
  reason: AccessReason;
  classification: AccessClassification;
};

/**
 * Future Product → Order → Purchase → Entitlement proposal.
 * Not an access decision and not a payment record.
 */
export type EntitlementGrantProposal = {
  learnerId: string;
  scope: EntitlementScope;
  targetId: string;
  source: EntitlementSource;
  sourceReference?: string;
  startsAt?: string;
  expiresAt?: string;
};

export const FORBIDDEN_ENTITLEMENT_FIELDS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "credential",
  "sessionToken",
  "privateKey",
  "providerPayload",
  "rawResponse",
  "amount",
  "currency",
  "payment",
  "paid",
  "invoice",
  "cardNumber",
  "cvv",
] as const;
