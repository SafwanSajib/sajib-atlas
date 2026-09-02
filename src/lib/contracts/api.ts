/**
 * Unified platform read API contracts (Phase 1J).
 *
 * Composition layer over existing domain read contracts. Not a catalog,
 * not HTTP, not a payload API. Canonical catalogs remain the source of truth.
 *
 * Canonical Domain Catalogs
 *   → Existing Read Contracts (Phase 1E)
 *     → Unified Platform Read Contract (this module)
 *       → Future HTTP / API Transport (not implemented)
 *
 * JSON-safe primitives only. No Date, Map, Set, functions, class instances,
 * React nodes, browser objects, or `any`.
 *
 * Payload locations such as `src/lib/geography-data.ts` are internal
 * architecture. They are not a public API contract.
 */

import type { AnalyticsEvent } from "@/lib/analytics/types";
import type {
  CommerceOrder,
  CommercePaymentRead,
  CommerceProduct,
  CommerceProductRef,
  CommercePurchase,
} from "@/lib/commerce/types";
import type { AccessDecision, Entitlement } from "@/lib/entitlement/types";
import type { IdentityRead } from "@/lib/identity/types";
import type { LearnerGoal, LearnerProfile } from "@/lib/learner/types";
import type {
  AssessmentSetRead,
  CategoryRead,
  ConceptRead,
  DisciplineRead,
  SubjectRead,
  TopicRead,
} from "./types";

export type { IdentityRead } from "@/lib/identity/types";

export type {
  AssessmentSetRead,
  CategoryRead,
  ConceptRead,
  ContentMetadataRead,
  DisciplineRead,
  SubjectRead,
  TopicRead,
} from "./types";

/** Contract evolution labels. Identities do not include these versions. */
export const PLATFORM_API_CONTRACT_VERSIONS = ["v1", "v2", "v3"] as const;
export type PlatformApiContractVersion = (typeof PLATFORM_API_CONTRACT_VERSIONS)[number];
export const CURRENT_PLATFORM_API_CONTRACT_VERSION: PlatformApiContractVersion = "v1";

/**
 * Public assessment-set identity for API consumers.
 * Derived from AssessmentSetRead. Omits the internal payload pointer
 * (`module` / `field`) because that is not a public payload contract.
 */
export type AssessmentSetApiRead = Omit<AssessmentSetRead, "payload">;

/**
 * Future-safe topic read. Identity and lightweight relationships only.
 * Does not include study paragraphs, MCQ arrays, learner state, analytics,
 * entitlement, or commerce.
 */
export type TopicReadResponse = {
  topic: TopicRead;
  concepts: readonly ConceptRead[];
  assessmentSets: readonly AssessmentSetApiRead[];
};

export type KnowledgeCollectionRead = {
  disciplines: readonly DisciplineRead[];
  subjects: readonly SubjectRead[];
  categories: readonly CategoryRead[];
};

export type TopicCollectionRead = {
  items: readonly TopicRead[];
};

export type ConceptCollectionRead = {
  items: readonly ConceptRead[];
};

export type AssessmentCollectionRead = {
  items: readonly AssessmentSetApiRead[];
};

export type SubjectCollectionRead = {
  items: readonly SubjectRead[];
};

export type CategoryCollectionRead = {
  items: readonly CategoryRead[];
};

/** TypeScript lookup shapes. Not URL/query-string parsing. */
export type GetTopicQuery = {
  topicId: string;
};

export type GetTopicsQuery = {
  categoryId?: string;
  subjectId?: string;
};

export type GetSubjectsQuery = {
  disciplineId?: string;
};

export type GetCategoriesQuery = {
  subjectId?: string;
};

export const PLATFORM_READ_ERROR_CODES = [
  "invalid_request",
  "not_found",
  "validation_failure",
] as const;
export type PlatformReadErrorCode = (typeof PLATFORM_READ_ERROR_CODES)[number];

/** Transport-independent read error. No HTTP status, stack, or file paths. */
export type PlatformReadError = {
  code: PlatformReadErrorCode;
  message: string;
};

export type PlatformReadSuccess<T> = {
  success: true;
  contractVersion: PlatformApiContractVersion;
  data: T;
};

export type PlatformReadFailure = {
  success: false;
  error: PlatformReadError;
};

export type PlatformReadResult<T> = PlatformReadSuccess<T> | PlatformReadFailure;

/**
 * Identity read boundary. Canonical learner identity only.
 * Not authentication, profile, goals, or learner state.
 */
export type IdentityReadResponse = {
  identity: IdentityRead;
};

/**
 * Learner read boundary. Profile and goals only.
 * Does not include localStorage, completion state, analytics, or commerce.
 */
export type LearnerProfileRead = LearnerProfile;
export type LearnerGoalRead = LearnerGoal;

export type LearnerReadResponse = {
  profile: LearnerProfileRead;
  goals: readonly LearnerGoalRead[];
};

/**
 * Entitlement read boundary. Access state, not purchase/payment state.
 */
export type EntitlementRead = Entitlement;
export type EntitlementAccessRead = AccessDecision;

/**
 * Commerce read boundary. Product / order / purchase identity, plus a
 * public payment read that omits provider internals and secrets.
 * No checkout, invoice, or billing response types.
 */
export type CommerceOrderRead = CommerceOrder;
export type CommerceProductRefRead = CommerceProductRef;
export type CommerceProductRead = CommerceProduct;
export type CommercePurchaseRead = CommercePurchase;
export type CommercePaymentPublicRead = CommercePaymentRead;

/**
 * Analytics remains a separate domain. Not composed into knowledge reads.
 */
export type AnalyticsEventRead = AnalyticsEvent;
