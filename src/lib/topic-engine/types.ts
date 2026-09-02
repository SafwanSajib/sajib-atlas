/**
 * Universal Topic Engine contracts (Phase 2).
 *
 * Domain orchestration over existing Phase 0C–1J catalogs and read models.
 * Not a second canonical registry. Topic identity remains `${subjectId}/${slug}`
 * in `src/lib/content/manifest.ts`.
 *
 * JSON-safe primitives only. No Date, Map, Set, functions, class instances,
 * React nodes, browser objects, or `any`.
 *
 * Does not embed Geography study paragraphs, MCQ arrays, learner storage,
 * analytics events, entitlements, or commerce records.
 */

import type { AssessmentKind } from "@/lib/assessment/types";
import { CONTENT_LIFECYCLES } from "@/lib/content/metadata";
import type { ContentLifecycle, ContentStatus } from "@/lib/content/types";

export type { AssessmentKind, ContentLifecycle, ContentStatus };
export { CONTENT_LIFECYCLES };

/**
 * Lifecycle/state layers stay separate:
 * - `identityExistence` is catalog membership (present / absent)
 * - `contentAvailability` is payload completeness (available / partial / planned)
 * - `publicationState` is Phase 1C `contentMetadata.lifecycle` (draft / published / archived)
 * - `capabilityAvailability` is engine operation availability per capability
 * - `operationalState` is a derived rollup, not a substitute for the layers above
 *
 * Absence is not `planned`. `partial` is not `draft`. Those states require identity.
 * `contentStatus` is payload completeness only — never engine readiness.
 * Publication vocabulary is Phase 1C `CONTENT_LIFECYCLES`, not a second enum.
 */
export const TOPIC_IDENTITY_EXISTENCE_STATES = ["present", "absent"] as const;
export type TopicIdentityExistence = (typeof TOPIC_IDENTITY_EXISTENCE_STATES)[number];

/** Payload completeness. Phase 0C/1 `CanonicalTopic.contentStatus`. */
export const TOPIC_CONTENT_AVAILABILITY_STATES = ["available", "partial", "planned"] as const;
export type TopicContentAvailability = ContentStatus;

/** Publication/lifecycle. Alias of Phase 1C `ContentLifecycle`. */
export type TopicPublicationState = ContentLifecycle;

export const TOPIC_OPERATIONAL_STATES = [
  "study-ready",
  "catalog-only",
  "unpublished",
  "retired",
] as const;
export type TopicOperationalState = (typeof TOPIC_OPERATIONAL_STATES)[number];

/**
 * Booleans that are forbidden unless they have a precise architectural meaning.
 *
 * Phase 2 assigns them none:
 * - `isReady` is not identity, content availability, publication, or capability availability
 * - `isComplete` is not contentStatus, learner completion storage, or capabilityAvailability.completion
 * - `isActive` is not publication, operationalState, or capability availability
 *
 * A later phase may introduce one only if it names exactly one layer and is
 * documented. Until then these keys are invalid at true or false.
 */
export const AMBIGUOUS_TOPIC_ENGINE_BOOLEANS = ["isReady", "isComplete", "isActive"] as const;
export type AmbiguousTopicEngineBoolean = (typeof AMBIGUOUS_TOPIC_ENGINE_BOOLEANS)[number];

/**
 * Universal capability kinds. Subject-independent.
 * Additional kinds must not change topic identity.
 */
export const TOPIC_CAPABILITY_KINDS = [
  "study",
  "concepts",
  "assessment",
  "completion",
  "revision",
  "search",
] as const;
export type TopicCapabilityKind = (typeof TOPIC_CAPABILITY_KINDS)[number];

export const TOPIC_CAPABILITY_FAMILIES = [
  "content",
  "assessment",
  "learner",
  "search",
  "access",
] as const;
export type TopicCapabilityFamily = (typeof TOPIC_CAPABILITY_FAMILIES)[number];

export const TOPIC_SEARCH_INDEXES = ["canonical-manifest"] as const;
export type TopicSearchIndex = (typeof TOPIC_SEARCH_INDEXES)[number];

/**
 * Engine capability availability. Named states, not ambiguous booleans
 * such as `isReady`, `isComplete`, or `isActive`.
 */
export const TOPIC_ENGINE_CAPABILITY_AVAILABILITY_STATES = ["available", "unavailable"] as const;
export type TopicEngineCapabilityAvailabilityState =
  (typeof TOPIC_ENGINE_CAPABILITY_AVAILABILITY_STATES)[number];

export type TopicEngineCapabilityAvailability = {
  study: TopicEngineCapabilityAvailabilityState;
  concepts: TopicEngineCapabilityAvailabilityState;
  assessment: TopicEngineCapabilityAvailabilityState;
  completion: TopicEngineCapabilityAvailabilityState;
  revision: TopicEngineCapabilityAvailabilityState;
  search: TopicEngineCapabilityAvailabilityState;
};

/** Identity lookup result. Does not compose payload, capabilities, or navigation. */
export type TopicIdentityState = {
  topicId: string;
  identityExistence: TopicIdentityExistence;
};

/**
 * Four-layer lifecycle inspect. Content availability and publication exist
 * only when identity is present.
 */
export type TopicLifecycleInspect =
  | {
      topicId: string;
      identityExistence: "absent";
    }
  | {
      topicId: string;
      identityExistence: "present";
      contentAvailability: TopicContentAvailability;
      publicationState: TopicPublicationState;
      capabilityAvailability: TopicEngineCapabilityAvailability;
      operationalState: TopicOperationalState;
    };

export type TopicEngineIdentity = {
  id: string;
  href: string;
  title: string;
  slug: string;
  subjectId: string;
};

export type TopicEngineHierarchy = {
  disciplineId: string;
  subjectId: string;
  categoryId: string;
};

export type TopicEngineStatus = {
  /** Composed models are always present; absence is reported by identity inspect. */
  identityExistence: "present";
  operationalState: TopicOperationalState;
  /** Content availability. Phase 1 `CanonicalTopic.contentStatus`. Payload only. */
  contentStatus: ContentStatus;
  /** Publication/lifecycle. Copied from Phase 1C `contentMetadata.lifecycle`. */
  lifecycle: ContentLifecycle;
  /** Engine capability availability. Independent of `contentStatus`. */
  capabilityAvailability: TopicEngineCapabilityAvailability;
  version: number;
  sourceId?: string;
  updatedAt?: string;
  /** Forbidden. Use capabilityAvailability named states. */
  isReady?: never;
  /** Forbidden. Not contentStatus, learner storage, or capabilityAvailability.completion. */
  isComplete?: never;
  /** Forbidden. Not publication, operationalState, or capabilityAvailability. */
  isActive?: never;
};

export type TopicEngineConceptRef = {
  id: string;
  topicId: string;
  slug: string;
  title: string;
};

export type TopicContentCapabilities = {
  /** Payload completeness. Not engine study availability. */
  contentStatus: ContentStatus;
  conceptCount: number;
};

export type TopicAssessmentCapabilities = {
  kinds: readonly AssessmentKind[];
  assessmentSetIds: readonly string[];
  assessmentSetCount: number;
};

export const TOPIC_LEARNER_STATE_LOCATIONS = ["external"] as const;
export type TopicLearnerStateLocation = (typeof TOPIC_LEARNER_STATE_LOCATIONS)[number];

export type TopicLearnerCapabilities = {
  localLearnerId: "learner/local";
  /** Learner storage stays outside the engine. The engine does not read it. */
  learnerState: TopicLearnerStateLocation;
};

export type TopicSearchCapabilities = {
  index: TopicSearchIndex;
};

export const TOPIC_CATALOG_ACCESS_STATES = ["public", "restricted"] as const;
export type TopicCatalogAccess = (typeof TOPIC_CATALOG_ACCESS_STATES)[number];

export type TopicAccessCapabilities = {
  catalogAccess: TopicCatalogAccess;
};

/**
 * Universal topic capability discovery. Same object for every subject.
 * Zero concepts and zero assessment sets are valid.
 */
export type TopicEngineCapabilities = {
  content: TopicContentCapabilities;
  assessment: TopicAssessmentCapabilities;
  learner: TopicLearnerCapabilities;
  search: TopicSearchCapabilities;
  access: TopicAccessCapabilities;
};

/**
 * Universal Topic Capability Model (Phase 2 §4).
 *
 * Bound to canonical topic identity. Not Geography-specific.
 * Discovery is identity refs; availability is explicit enums.
 */
export type TopicCapabilityModel = {
  topicId: string;
  discovery: TopicEngineCapabilities;
  availability: TopicEngineCapabilityAvailability;
};

/**
 * Questions the universal capability model can answer.
 * Answers are enums or identity objects, not `isReady` / `canStudy` booleans.
 */
export const TOPIC_CAPABILITY_ASKS = [
  "availability",
  "study-content",
  "concepts",
  "assessment-set",
  "concept-count",
  "assessment-identity",
  "learner-identity",
  "search-index",
  "catalog-access",
] as const;
export type TopicCapabilityAsk = (typeof TOPIC_CAPABILITY_ASKS)[number];

export type TopicCapabilityQuestion =
  | { ask: "availability"; kind: TopicCapabilityKind }
  | { ask: "study-content" }
  | { ask: "concepts" }
  | { ask: "assessment-set" }
  | { ask: "concept-count" }
  | { ask: "assessment-identity" }
  | { ask: "learner-identity" }
  | { ask: "search-index" }
  | { ask: "catalog-access" };

export type TopicCapabilityAnswer =
  | {
      ask: "availability";
      kind: TopicCapabilityKind;
      availability: TopicEngineCapabilityAvailabilityState;
    }
  | {
      ask: "study-content";
      studyContent: TopicIdentityExistence;
      contentStatus: ContentStatus;
    }
  | { ask: "concepts"; concepts: TopicIdentityExistence; conceptCount: number }
  | {
      ask: "assessment-set";
      assessmentSet: TopicIdentityExistence;
      assessmentSetCount: number;
      assessmentSetIds: readonly string[];
    }
  | { ask: "concept-count"; conceptCount: number }
  | {
      ask: "assessment-identity";
      assessmentSetIds: readonly string[];
      kinds: readonly AssessmentKind[];
      assessmentSetCount: number;
    }
  | { ask: "learner-identity"; localLearnerId: "learner/local" }
  | { ask: "search-index"; index: TopicSearchIndex }
  | { ask: "catalog-access"; catalogAccess: TopicCatalogAccess };

export type TopicEngineNeighbor = {
  id: string;
  href: string;
  title: string;
  slug: string;
};

export type TopicEngineNavigation = {
  parentCategoryId: string;
  parentCategoryHref?: string;
  previous?: TopicEngineNeighbor;
  next?: TopicEngineNeighbor;
  siblingIds: readonly string[];
};

/**
 * Composed topic record. Identity is copied from the canonical catalog,
 * not minted here.
 */
export type TopicEngineModel = {
  identity: TopicEngineIdentity;
  hierarchy: TopicEngineHierarchy;
  status: TopicEngineStatus;
  concepts: readonly TopicEngineConceptRef[];
  capabilities: TopicEngineCapabilities;
  navigation: TopicEngineNavigation;
  /** Forbidden. Use status.capabilityAvailability. */
  isReady?: never;
  /** Forbidden. Not learner completion and not content completeness. */
  isComplete?: never;
  /** Forbidden. Not publication or operational state. */
  isActive?: never;
};

export type TopicEngineInspect = {
  topic: TopicEngineModel;
  diagnostics: {
    identityExistence: "present";
    contentAvailability: TopicContentAvailability;
    publicationState: TopicPublicationState;
    capabilityAvailability: TopicEngineCapabilityAvailability;
    conceptCount: number;
    assessmentSetCount: number;
    siblingCount: number;
    catalogBound: boolean;
  };
};

export type TopicResolutionQuery = {
  topicId?: string;
  href?: string;
  subjectId?: string;
  slug?: string;
};

export type TopicEngineListQuery = {
  disciplineId?: string;
  subjectId?: string;
  categoryId?: string;
};
