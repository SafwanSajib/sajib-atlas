/**
 * Universal Topic Engine (Phase 2).
 *
 * Canonical Knowledge/Content Identity
 *   → Existing Phase 1 Contracts
 *     → Universal Topic Engine
 *       → Future Web / API / Mobile / AI consumers
 *
 * Not a second topic registry. Not HTTP. Not a Geography-specific engine.
 */

export {
  TOPIC_ENGINE_ERROR_CODES,
  isTopicEngineErrorCode,
  topicEngineFailure,
  topicEngineSuccess,
  type TopicEngineError,
  type TopicEngineErrorCode,
  type TopicEngineFailure,
  type TopicEngineResult,
  type TopicEngineSuccess,
} from "./errors";
export {
  canonicalTopicId,
  hrefFromTopicId,
  isCanonicalTopicIdShape,
  parseTopicId,
  topicIdFromHref,
} from "./identity";
export {
  deriveTopicEngineCapabilityAvailability,
  deriveTopicEngineStatus,
  deriveTopicIdentityExistence,
  deriveTopicOperationalState,
  inspectTopicIdentityState,
  inspectTopicLifecycleState,
  isTopicContentAvailability,
  isTopicEngineCapabilityAvailabilityState,
  isTopicIdentityExistence,
  isTopicOperationalState,
  isTopicPublicationState,
  topicIdentityExists,
} from "./status";
export {
  composeTopicCapabilityModel,
  composeTopicCapabilityModelForTopicId,
  discoverAccessCapabilities,
  discoverAssessmentCapabilities,
  discoverContentCapabilities,
  discoverLearnerCapabilities,
  discoverSearchCapabilities,
  discoverTopicCapabilities,
  getCapabilityAvailability,
  isTopicCapabilityKind,
  listAvailableCapabilityKinds,
} from "./capabilities";
export {
  answerTopicCapabilityQuestion,
  askTopicCapability,
  parseTopicCapabilityQuestion,
} from "./questions";
export { composeTopicEngineModel, composeTopicEngineModelFromCanonical } from "./composition";
export { composeTopicNavigation, listCategoryTopicIds } from "./navigation";
export {
  inspectTopicIdentity,
  inspectTopicLifecycle,
  listTopicEngineModels,
  listTopicEngineModelsByCategory,
  listTopicEngineModelsByDiscipline,
  listTopicEngineModelsBySubject,
  normalizeTopicResolutionQuery,
  resolveTopic,
  resolveTopicById,
  searchTopicEngine,
} from "./resolution";
export { inspectTopic } from "./inspect";
export {
  assertJsonSafe,
  assertNoAmbiguousTopicEngineBooleans,
  assertNoForbiddenTopicEngineKeys,
  assertNoImplementationPaths,
  validateTopicEngineModel,
} from "./validate";
export {
  AMBIGUOUS_TOPIC_ENGINE_BOOLEANS,
  CONTENT_LIFECYCLES,
  TOPIC_CAPABILITY_ASKS,
  TOPIC_CAPABILITY_FAMILIES,
  TOPIC_CAPABILITY_KINDS,
  TOPIC_CATALOG_ACCESS_STATES,
  TOPIC_CONTENT_AVAILABILITY_STATES,
  TOPIC_ENGINE_CAPABILITY_AVAILABILITY_STATES,
  TOPIC_IDENTITY_EXISTENCE_STATES,
  TOPIC_LEARNER_STATE_LOCATIONS,
  TOPIC_OPERATIONAL_STATES,
  TOPIC_SEARCH_INDEXES,
} from "./types";
export type {
  AmbiguousTopicEngineBoolean,
  TopicAccessCapabilities,
  TopicCapabilityAnswer,
  TopicCapabilityAsk,
  TopicCapabilityFamily,
  TopicCapabilityKind,
  TopicCapabilityModel,
  TopicCapabilityQuestion,
  TopicCatalogAccess,
  TopicAssessmentCapabilities,
  TopicContentAvailability,
  TopicContentCapabilities,
  TopicEngineCapabilityAvailability,
  TopicEngineCapabilityAvailabilityState,
  TopicEngineCapabilities,
  TopicEngineConceptRef,
  TopicEngineHierarchy,
  TopicEngineIdentity,
  TopicEngineInspect,
  TopicEngineListQuery,
  TopicEngineModel,
  TopicEngineNavigation,
  TopicEngineNeighbor,
  TopicEngineStatus,
  TopicIdentityExistence,
  TopicIdentityState,
  TopicLearnerCapabilities,
  TopicLearnerStateLocation,
  TopicLifecycleInspect,
  TopicOperationalState,
  TopicPublicationState,
  TopicResolutionQuery,
  TopicSearchCapabilities,
  TopicSearchIndex,
} from "./types";
