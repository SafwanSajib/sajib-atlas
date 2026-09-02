import { isAnswerCorrect, nextScore } from "@/lib/assessment/scoring";
import { getAssessmentSetRead, getTopicRead } from "@/lib/contracts/read";
import { contentManifest, requireCanonicalTopic } from "@/lib/content/manifest";
import { decideAccess } from "@/lib/entitlement/access";
import { geographyTopicsBySlug } from "@/lib/geography-data";
import { getCategory, getDiscipline, getSubject } from "@/lib/knowledge/catalog";
import { getConcept } from "@/lib/knowledge/concepts";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { searchTopics } from "@/lib/search-data";
import {
  composeTopicCapabilityModel,
  composeTopicCapabilityModelForTopicId,
  getCapabilityAvailability,
  listAvailableCapabilityKinds,
} from "./capabilities";
import { askTopicCapability } from "./questions";
import { inspectTopic } from "./inspect";
import { parseTopicId, topicIdFromHref } from "./identity";
import {
  inspectTopicIdentity,
  inspectTopicLifecycle,
  listTopicEngineModels,
  listTopicEngineModelsByDiscipline,
  resolveTopic,
  searchTopicEngine,
} from "./resolution";
import { isTopicCompleted } from "@/store/learner/completion";
import {
  deriveTopicEngineCapabilityAvailability,
  deriveTopicIdentityExistence,
  deriveTopicOperationalState,
  topicIdentityExists,
} from "./status";
import { CONTENT_LIFECYCLES } from "./types";
import {
  assertJsonSafe,
  assertNoAmbiguousTopicEngineBooleans,
  assertNoForbiddenTopicEngineKeys,
  assertNoImplementationPaths,
  validateTopicEngineModel,
} from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Topic-engine verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Topic-engine verification failed: expected throw (${label})`);
}

export function runTopicEngineVerification(): string[] {
  const passed: string[] = [];
  const rotationId = "geography/earths-rotation";
  const canonical = requireCanonicalTopic(rotationId);

  const resolved = resolveTopic({ topicId: rotationId });
  assert(resolved.ok === true, "Earth's Rotation resolves by topicId");
  const rotation = resolved.ok ? validateTopicEngineModel(resolved.data) : undefined;
  assert(rotation !== undefined, "Earth's Rotation engine model validates");
  assert(rotation.identity.id === rotationId, "Earth's Rotation id is unchanged");
  assert(rotation.identity.href === "/geography/earths-rotation", "Earth's Rotation href is unchanged");
  assert(rotation.identity.title === "Earth's Rotation", "Earth's Rotation title is unchanged");
  assert(rotation.identity.slug === "earths-rotation", "Earth's Rotation slug is unchanged");
  assert(rotation.identity.subjectId === "geography", "Earth's Rotation subjectId is unchanged");
  assert(rotation.hierarchy.disciplineId === "geography", "discipline identity is present");
  assert(rotation.hierarchy.categoryId === "geography/physical-geography", "category identity is present");
  assert(rotation.status.contentStatus === "available", "contentStatus remains payload completeness");
  assert(rotation.status.lifecycle === canonical.contentMetadata.lifecycle, "engine lifecycle copies Phase 1C contentMetadata.lifecycle");
  assert(rotation.status.lifecycle === "published", "lifecycle remains published");
  assert(rotation.status.version === canonical.contentMetadata.version, "engine version copies Phase 1C contentMetadata.version");
  assert(rotation.status.version === 1, "content version is 1");
  assert(CONTENT_LIFECYCLES.includes("draft"), "Phase 1C publication vocabulary includes draft");
  assert(CONTENT_LIFECYCLES.includes("published"), "Phase 1C publication vocabulary includes published");
  assert(CONTENT_LIFECYCLES.includes("archived"), "Phase 1C publication vocabulary includes archived");
  assert(rotation.status.identityExistence === "present", "Earth's Rotation identity exists in the catalog");
  assert(rotation.status.operationalState === "study-ready", "available published topic is study-ready");
  assert(rotation.status.sourceId === "module/geography-data", "provenance sourceId is unchanged");
  assert(rotation.status.updatedAt === undefined, "updatedAt remains unknown");
  assert(rotation.concepts.length === 4, "Earth's Rotation has four concept refs");
  assert(rotation.concepts[0]?.id === "geography/earths-rotation/rotation", "Rotation concept identity is unchanged");
  assert(rotation.concepts[1]?.id === "geography/earths-rotation/axis", "Axis concept identity is unchanged");
  assert(rotation.concepts[2]?.id === "geography/earths-rotation/day-and-night", "Day and Night concept identity is unchanged");
  assert(rotation.concepts[3]?.id === "geography/earths-rotation/apparent-motion", "Apparent Motion concept identity is unchanged");
  assert(
    rotation.capabilities.assessment.assessmentSetIds[0] === "geography/earths-rotation/mcq-practice",
    "assessment-set identity is unchanged",
  );
  assert(rotation.capabilities.assessment.kinds[0] === "mcq-practice", "assessment kind is mcq-practice");
  assert(rotation.status.capabilityAvailability.study === "available", "Earth's Rotation study capability is available");
  assert(rotation.status.capabilityAvailability.concepts === "available", "Earth's Rotation concepts capability is available");
  assert(rotation.status.capabilityAvailability.assessment === "available", "Earth's Rotation assessment capability is available");
  assert(rotation.status.capabilityAvailability.completion === "available", "learner completion is applicable");
  assert(rotation.status.capabilityAvailability.revision === "available", "revision is applicable");
  assert(rotation.status.capabilityAvailability.search === "available", "search indexing is applicable");
  assert(rotation.capabilities.learner.localLearnerId === LOCAL_LEARNER_ID, "learner hook uses learner/local");
  assert(rotation.capabilities.learner.learnerState === "external", "engine does not hold learner state");
  assert(rotation.capabilities.search.index === "canonical-manifest", "search hook uses the canonical index");
  assert(rotation.capabilities.access.catalogAccess === "public", "catalog access remains public");
  const rotationCapabilities = composeTopicCapabilityModel({
    topicId: rotationId,
    lifecycle: canonical.contentMetadata.lifecycle,
    contentStatus: canonical.contentStatus,
    conceptCount: 4,
    assessmentSetIds: canonical.assessmentSetIds,
    kinds: ["mcq-practice"],
  });
  assert(rotationCapabilities.topicId === rotationId, "capability model is bound to canonical topic id");
  assert(
    rotationCapabilities.availability.study === "available",
    "capability model uses availability enums, not isReady",
  );
  assert(
    rotationCapabilities.discovery.assessment.assessmentSetCount === 1,
    "capability model discovery is identity refs and counts",
  );
  assert(!("isReady" in rotationCapabilities.discovery), "capability model has no isReady");
  assert(!("isComplete" in rotationCapabilities.availability), "capability availability has no isComplete");
  assert(!("isActive" in rotationCapabilities.availability), "capability availability has no isActive");
  assert(!("subject" in rotationCapabilities), "capability model is not subject-specific");
  assert(
    getCapabilityAvailability(rotationCapabilities.availability, "assessment") === "available",
    "assessment availability is addressable by kind",
  );
  const rotationKinds = listAvailableCapabilityKinds(rotationCapabilities.availability);
  assert(rotationKinds.includes("study") && rotationKinds.includes("assessment"), "Geography study topic lists study and assessment");
  assert(rotationKinds.includes("completion") && rotationKinds.includes("revision"), "Geography study topic lists completion and revision");

  const bcsCapabilities = composeTopicCapabilityModelForTopicId("bcs/english");
  assert(bcsCapabilities !== undefined, "BCS stub has a universal capability model");
  assert(bcsCapabilities.topicId === "bcs/english", "BCS capability model uses canonical id");
  assert(bcsCapabilities.discovery.content.conceptCount === 0, "BCS stub may have zero concepts");
  assert(bcsCapabilities.discovery.assessment.assessmentSetCount === 0, "BCS stub may have zero assessment sets");
  assert(bcsCapabilities.availability.study === "unavailable", "BCS study capability is unavailable");
  assert(bcsCapabilities.availability.concepts === "unavailable", "BCS concepts capability is unavailable");
  assert(bcsCapabilities.availability.assessment === "unavailable", "BCS assessment capability is unavailable");
  assert(bcsCapabilities.availability.completion === "unavailable", "BCS completion is not applicable");
  assert(bcsCapabilities.availability.revision === "unavailable", "BCS revision is not applicable");
  assert(bcsCapabilities.availability.search === "available", "BCS search indexing is applicable");
  assert(
    !listAvailableCapabilityKinds(bcsCapabilities.availability).includes("assessment"),
    "BCS stub does not list assessment as available",
  );
  const englishCapabilities = composeTopicCapabilityModelForTopicId("english/grammar");
  assert(englishCapabilities !== undefined, "English stub uses the same capability model");
  assert(englishCapabilities.discovery.assessment.kinds.length === 0, "English stub has an empty assessment kind list");
  assert(composeTopicCapabilityModelForTopicId("missing/topic") === undefined, "absent identity has no capability model");

  const studyAsk = askTopicCapability(rotationId, { ask: "availability", kind: "study" });
  assert(studyAsk.ok === true && studyAsk.data.ask === "availability", "engine answers study availability");
  assert(studyAsk.ok && studyAsk.data.ask === "availability" && studyAsk.data.availability === "available", "Earth's Rotation study is available");
  const assessmentAvailAsk = askTopicCapability(rotationId, { ask: "availability", kind: "assessment" });
  assert(
    assessmentAvailAsk.ok &&
      assessmentAvailAsk.data.ask === "availability" &&
      assessmentAvailAsk.data.availability === "available",
    "Earth's Rotation assessment is available",
  );
  const completionAsk = askTopicCapability(rotationId, { ask: "availability", kind: "completion" });
  assert(
    completionAsk.ok && completionAsk.data.ask === "availability" && completionAsk.data.availability === "available",
    "learner completion is applicable for Earth's Rotation",
  );
  const revisionAsk = askTopicCapability(rotationId, { ask: "availability", kind: "revision" });
  assert(
    revisionAsk.ok && revisionAsk.data.ask === "availability" && revisionAsk.data.availability === "available",
    "revision is applicable for Earth's Rotation",
  );
  const searchAsk = askTopicCapability(rotationId, { ask: "availability", kind: "search" });
  assert(
    searchAsk.ok && searchAsk.data.ask === "availability" && searchAsk.data.availability === "available",
    "search indexing is applicable for Earth's Rotation",
  );
  const conceptAsk = askTopicCapability(rotationId, { ask: "concept-count" });
  assert(conceptAsk.ok && conceptAsk.data.ask === "concept-count" && conceptAsk.data.conceptCount === 4, "Earth's Rotation has four concepts");
  const assessmentAsk = askTopicCapability(rotationId, { ask: "assessment-identity" });
  assert(
    assessmentAsk.ok &&
      assessmentAsk.data.ask === "assessment-identity" &&
      assessmentAsk.data.assessmentSetCount === 1 &&
      assessmentAsk.data.assessmentSetIds[0] === "geography/earths-rotation/mcq-practice",
    "Earth's Rotation assessment identity is discoverable without MCQ arrays",
  );
  const bcsStudyAsk = askTopicCapability("bcs/english", { ask: "availability", kind: "study" });
  assert(
    bcsStudyAsk.ok && bcsStudyAsk.data.ask === "availability" && bcsStudyAsk.data.availability === "unavailable",
    "BCS stub study availability is unavailable, not a false isReady flag",
  );
  const bcsConcepts = askTopicCapability("bcs/english", { ask: "concept-count" });
  assert(bcsConcepts.ok && bcsConcepts.data.ask === "concept-count" && bcsConcepts.data.conceptCount === 0, "BCS stub concept count is zero");
  const missingAsk = askTopicCapability("missing/topic", { ask: "availability", kind: "search" });
  assert(missingAsk.ok === false && missingAsk.error.code === "not_found", "capability questions for absent identity are not_found");
  const studyContentAsk = askTopicCapability(rotationId, { ask: "study-content" });
  assert(
    studyContentAsk.ok &&
      studyContentAsk.data.ask === "study-content" &&
      studyContentAsk.data.studyContent === "present" &&
      studyContentAsk.data.contentStatus === "available",
    "Earth's Rotation has study content",
  );
  const hasConceptsAsk = askTopicCapability(rotationId, { ask: "concepts" });
  assert(
    hasConceptsAsk.ok &&
      hasConceptsAsk.data.ask === "concepts" &&
      hasConceptsAsk.data.concepts === "present" &&
      hasConceptsAsk.data.conceptCount === 4,
    "Earth's Rotation has concepts",
  );
  const hasAssessmentAsk = askTopicCapability(rotationId, { ask: "assessment-set" });
  assert(
    hasAssessmentAsk.ok &&
      hasAssessmentAsk.data.ask === "assessment-set" &&
      hasAssessmentAsk.data.assessmentSet === "present" &&
      hasAssessmentAsk.data.assessmentSetCount === 1,
    "Earth's Rotation has an assessment set",
  );
  const bcsStudyContent = askTopicCapability("bcs/english", { ask: "study-content" });
  assert(
    bcsStudyContent.ok &&
      bcsStudyContent.data.ask === "study-content" &&
      bcsStudyContent.data.studyContent === "absent" &&
      bcsStudyContent.data.contentStatus === "partial",
    "BCS stub does not have study content; partial is not present",
  );
  const bcsHasConcepts = askTopicCapability("bcs/english", { ask: "concepts" });
  assert(
    bcsHasConcepts.ok && bcsHasConcepts.data.ask === "concepts" && bcsHasConcepts.data.concepts === "absent",
    "BCS stub does not have concepts",
  );
  const bcsHasAssessment = askTopicCapability("bcs/english", { ask: "assessment-set" });
  assert(
    bcsHasAssessment.ok &&
      bcsHasAssessment.data.ask === "assessment-set" &&
      bcsHasAssessment.data.assessmentSet === "absent",
    "BCS stub does not have an assessment set",
  );
  const malformedAsk = askTopicCapability("geography/earths-rotation/rotation", { ask: "concept-count" });
  assert(malformedAsk.ok === false && malformedAsk.error.code === "invalid_request", "concept id is not a capability question target");
  assert(!("canStudy" in rotation.capabilities.content), "content capabilities do not use canStudy");
  assert(!("isReady" in rotation), "engine model does not use isReady");
  assert(!("isReady" in rotation.status), "status does not use isReady");
  assert(!("isReady" in rotation.capabilities), "capabilities do not use isReady");
  assert(!("isComplete" in rotation), "engine model does not use isComplete");
  assert(!("isComplete" in rotation.status), "status does not use isComplete");
  assert(!("isComplete" in rotation.capabilities), "capabilities do not use isComplete");
  assert(!("isActive" in rotation), "engine model does not use isActive");
  assert(!("isActive" in rotation.status), "status does not use isActive");
  assert(!("isActive" in rotation.capabilities), "capabilities do not use isActive");
  assertNoAmbiguousTopicEngineBooleans(rotation, "Earth's Rotation engine model");
  assert(rotation.navigation.parentCategoryId === "geography/physical-geography", "parent category is physical geography");
  assert(
    rotation.navigation.parentCategoryHref === "/geography/physical-geography",
    "parent category href is the live grouping route",
  );
  assert(rotation.navigation.previous === undefined, "Earth's Rotation has no previous sibling");
  assert(rotation.navigation.next?.id === "geography/earths-revolution", "next sibling is Earth's Revolution");
  assert(!("sections" in rotation.identity), "engine identity does not embed payload");
  assertJsonSafe(rotation, "Earth's Rotation engine model");
  assertNoForbiddenTopicEngineKeys(rotation, "Earth's Rotation engine model");
  assertNoImplementationPaths(rotation, "Earth's Rotation engine model");
  passed.push("Earth's Rotation engine model preserves identity and composes capabilities");

  const byHref = resolveTopic({ href: "/geography/earths-rotation" });
  assert(byHref.ok === true && byHref.data.identity.id === rotationId, "resolves by href");
  const byParts = resolveTopic({ subjectId: "geography", slug: "earths-rotation" });
  assert(byParts.ok === true && byParts.data.identity.id === rotationId, "resolves by subjectId+slug");
  const agreed = resolveTopic({
    topicId: rotationId,
    href: "/geography/earths-rotation",
    subjectId: "geography",
    slug: "earths-rotation",
  });
  assert(agreed.ok === true && agreed.data.identity.id === rotationId, "agreeing resolution fields succeed");
  passed.push("topic resolution accepts id, href, and subjectId+slug");

  const missing = resolveTopic({ topicId: "missing/topic" });
  assert(missing.ok === false && missing.error.code === "not_found", "unknown topic is not_found");
  const invalid = resolveTopic({ topicId: "   " });
  assert(invalid.ok === false && invalid.error.code === "invalid_request", "blank topicId is invalid_request");
  const conceptAsTopic = resolveTopic({ topicId: "geography/earths-rotation/rotation" });
  assert(conceptAsTopic.ok === false && conceptAsTopic.error.code === "invalid_request", "concept id is not a topic id");
  const assessmentAsTopic = resolveTopic({ topicId: "geography/earths-rotation/mcq-practice" });
  assert(
    assessmentAsTopic.ok === false && assessmentAsTopic.error.code === "invalid_request",
    "assessment-set id is not a topic id",
  );
  const absoluteUrl = resolveTopic({ href: "https://example.com/geography/earths-rotation" });
  assert(absoluteUrl.ok === false && absoluteUrl.error.code === "invalid_request", "arbitrary URLs are not canonical identity");
  const disagree = resolveTopic({ topicId: rotationId, href: "/geography/seasons" });
  assert(disagree.ok === false && disagree.error.code === "invalid_request", "disagreeing fields are invalid_request");
  const incomplete = resolveTopic({ subjectId: "geography" });
  assert(incomplete.ok === false && incomplete.error.code === "invalid_request", "subjectId without slug is invalid");
  assert(parseTopicId("geography/earths-rotation")?.slug === "earths-rotation", "parseTopicId reads subject/slug");
  assert(parseTopicId("geography/earths-rotation/rotation") === undefined, "parseTopicId rejects concept ids");
  assert(topicIdFromHref("/geography/earths-rotation") === rotationId, "href maps to canonical id");
  passed.push("resolution rejects invalid, unknown, and non-topic identities");

  const tides = resolveTopic({ topicId: "geography/tides" });
  assert(tides.ok === true, "Tides resolves");
  assert(tides.ok && tides.data.navigation.next === undefined, "Tides is the last physical-geography topic");
  assert(
    tides.ok && tides.data.navigation.previous?.id === "geography/ocean-currents",
    "Tides previous sibling is Ocean Currents",
  );
  passed.push("category navigation uses canonical-manifest order");

  const bcs = resolveTopic({ topicId: "bcs/english" });
  assert(bcs.ok === true, "BCS English stub resolves");
  const bcsModel = bcs.ok ? validateTopicEngineModel(bcs.data) : undefined;
  assert(bcsModel !== undefined, "BCS stub validates");
  assert(bcsModel.status.identityExistence === "present", "BCS stub identity exists despite partial content");
  assert(bcsModel.status.contentStatus === "partial", "BCS stub remains partial");
  assert(bcsModel.status.operationalState === "catalog-only", "partial published topic is catalog-only");
  assert(bcsModel.concepts.length === 0, "BCS stub has zero concepts");
  assert(bcsModel.capabilities.assessment.assessmentSetCount === 0, "BCS stub has zero assessment sets");
  assert(bcsModel.status.capabilityAvailability.study === "unavailable", "BCS stub study capability is unavailable");
  assert(bcsModel.status.capabilityAvailability.concepts === "unavailable", "BCS stub concepts capability is unavailable");
  assert(bcsModel.status.capabilityAvailability.assessment === "unavailable", "BCS stub assessment capability is unavailable");
  assert(bcsModel.status.capabilityAvailability.completion === "unavailable", "BCS stub completion is not applicable");
  assert(bcsModel.status.capabilityAvailability.revision === "unavailable", "BCS stub revision is not applicable");
  assert(bcsModel.status.capabilityAvailability.search === "available", "BCS stub search indexing is applicable");
  assert(
    bcsModel.status.contentStatus === "partial" && bcsModel.status.capabilityAvailability.study === "unavailable",
    "contentStatus partial is not overloaded as engine study availability",
  );
  assert(bcsModel.navigation.parentCategoryHref === undefined, "BCS core category has no grouping href");
  const english = resolveTopic({ topicId: "english/grammar" });
  assert(english.ok === true, "English grammar stub resolves");
  assert(english.ok && english.data.concepts.length === 0, "English stub has zero concepts");
  assert(english.ok && english.data.capabilities.assessment.assessmentSetCount === 0, "English stub has zero sets");
  assert(english.ok && english.data.status.operationalState === "catalog-only", "English stub is catalog-only");
  passed.push("BCS and English stubs are representable as catalog-only topics");

  assert(deriveTopicOperationalState("published", "available") === "study-ready", "published+available is study-ready");
  assert(deriveTopicOperationalState("published", "partial") === "catalog-only", "published+partial is catalog-only");
  assert(deriveTopicOperationalState("published", "planned") === "catalog-only", "published+planned is catalog-only");
  assert(deriveTopicOperationalState("draft", "available") === "unpublished", "draft is unpublished");
  assert(deriveTopicOperationalState("archived", "available") === "retired", "archived is retired");
  const unpublishedCaps = deriveTopicEngineCapabilityAvailability({
    lifecycle: "draft",
    contentStatus: "available",
    conceptCount: 0,
    assessmentSetCount: 1,
  });
  assert(unpublishedCaps.study === "unavailable", "draft publication makes study unavailable");
  assert(unpublishedCaps.assessment === "available", "assessment identity can exist while study is unpublished");
  assert(unpublishedCaps.completion === "unavailable", "draft publication makes completion inapplicable");
  assert(unpublishedCaps.revision === "available", "revision is applicable when assessment identity exists");
  assert(
    unpublishedCaps.study === "unavailable",
    "contentStatus available is not overloaded as engine study availability",
  );
  const partialPublishedCaps = deriveTopicEngineCapabilityAvailability({
    lifecycle: "published",
    contentStatus: "partial",
    conceptCount: 0,
    assessmentSetCount: 0,
  });
  assert(partialPublishedCaps.search === "available", "partial published topics remain searchable");
  assert(partialPublishedCaps.study === "unavailable", "partial payload does not make study available");
  assert(partialPublishedCaps.concepts === "unavailable", "zero concepts is concepts unavailable");
  assert(topicIdentityExists(rotationId) === true, "Earth's Rotation identity exists");
  assert(topicIdentityExists("bcs/english") === true, "BCS stub identity exists");
  assert(topicIdentityExists("missing/topic") === false, "unknown valid-shaped id is absent");
  assert(topicIdentityExists("geography/earths-rotation/rotation") === false, "concept id is not topic identity");
  assert(deriveTopicIdentityExistence(rotationId) === "present", "present is catalog membership");
  assert(deriveTopicIdentityExistence("missing/topic") === "absent", "absent is not catalog-only");
  const presentIdentity = inspectTopicIdentity({ topicId: rotationId });
  assert(
    presentIdentity.ok === true && presentIdentity.data.identityExistence === "present",
    "identity inspect reports present without requiring study payload",
  );
  const absentIdentity = inspectTopicIdentity({ topicId: "missing/topic" });
  assert(absentIdentity.ok === true, "absent identity is a state, not invalid_request");
  assert(
    absentIdentity.ok && absentIdentity.data.identityExistence === "absent",
    "unknown topic identity is absent",
  );
  const malformedIdentity = inspectTopicIdentity({ topicId: "geography/earths-rotation/rotation" });
  assert(
    malformedIdentity.ok === false && malformedIdentity.error.code === "invalid_request",
    "concept id is invalid topic identity, not absent topic identity",
  );

  const rotationLifecycle = inspectTopicLifecycle({ topicId: rotationId });
  assert(rotationLifecycle.ok === true, "Earth's Rotation lifecycle inspect succeeds");
  assert(
    rotationLifecycle.ok &&
      rotationLifecycle.data.identityExistence === "present" &&
      rotationLifecycle.data.contentAvailability === "available" &&
      rotationLifecycle.data.publicationState === "published",
    "Geography study content is available and published as independent fields",
  );
  assert(
    rotationLifecycle.ok && rotationLifecycle.data.capabilityAvailability.study === "available",
    "Geography study engine capability is available",
  );
  const bcsLifecycle = inspectTopicLifecycle({ topicId: "bcs/english" });
  assert(bcsLifecycle.ok === true, "BCS lifecycle inspect succeeds");
  assert(
    bcsLifecycle.ok &&
      bcsLifecycle.data.identityExistence === "present" &&
      bcsLifecycle.data.contentAvailability === "partial" &&
      bcsLifecycle.data.publicationState === "published",
    "BCS stub is published with partial content availability",
  );
  assert(
    bcsLifecycle.ok &&
      bcsLifecycle.data.capabilityAvailability.study === "unavailable" &&
      bcsLifecycle.data.capabilityAvailability.search === "available",
    "published partial content does not make study capability available",
  );
  assert(
    rotation.status.contentStatus === "available" && rotation.status.lifecycle === "published",
    "composed status keeps content availability and publication as separate Phase 1 fields",
  );
  assert(
    bcsModel.status.contentStatus === "partial" && bcsModel.status.lifecycle === "published",
    "partial content availability does not change published lifecycle",
  );
  const absentLifecycle = inspectTopicLifecycle({ topicId: "missing/topic" });
  assert(absentLifecycle.ok === true, "absent lifecycle inspect succeeds");
  assert(
    absentLifecycle.ok &&
      absentLifecycle.data.identityExistence === "absent" &&
      !("contentAvailability" in absentLifecycle.data) &&
      !("publicationState" in absentLifecycle.data) &&
      !("capabilityAvailability" in absentLifecycle.data),
    "absent identity does not carry content availability or publication state",
  );
  assert(
    deriveTopicOperationalState("published", "partial") !== deriveTopicOperationalState("draft", "available"),
    "publication state and content availability derive different operational states",
  );
  passed.push("identity existence, content availability, and publication state stay distinct");

  const inspected = inspectTopic(rotationId);
  assert(inspected !== undefined, "inspect returns Earth's Rotation");
  assert(inspected.diagnostics.conceptCount === 4, "inspect reports four concepts");
  assert(inspected.diagnostics.assessmentSetCount === 1, "inspect reports one assessment set");
  assert(inspected.diagnostics.identityExistence === "present", "inspect reports present identity");
  assert(inspected.diagnostics.contentAvailability === "available", "inspect reports content availability");
  assert(inspected.diagnostics.publicationState === "published", "inspect reports publication state");
  assert(inspected.diagnostics.capabilityAvailability.study === "available", "inspect reports study capability availability");
  assert(inspected.diagnostics.catalogBound === true, "inspect confirms catalog binding");
  assert(inspected.diagnostics.siblingCount === inspected.topic.navigation.siblingIds.length, "inspect sibling count matches");
  assertJsonSafe(inspected, "inspect view");
  assertNoForbiddenTopicEngineKeys(inspected, "inspect view");
  passed.push("topic inspect is diagnostic and catalog-bound");

  const geographyTopics = listTopicEngineModels({ subjectId: "geography" });
  const manifestGeography = contentManifest.filter((topic) => topic.subjectId === "geography");
  assert(geographyTopics.length === manifestGeography.length, "Geography engine list matches the manifest");
  const physical = listTopicEngineModels({ categoryId: "geography/physical-geography" });
  assert(
    physical.some((item) => item.identity.id === rotationId),
    "physical-geography list includes Earth's Rotation",
  );
  const byDiscipline = listTopicEngineModelsByDiscipline("geography");
  assert(byDiscipline.length === geographyTopics.length, "discipline list matches subject list for Geography");
  const allEngineTopics = listTopicEngineModels();
  assert(allEngineTopics.length === contentManifest.length, "engine list covers the canonical catalog");
  const engineIds = allEngineTopics.map((item) => item.identity.id);
  const manifestIds = contentManifest.map((topic) => topic.id);
  assert(JSON.stringify(engineIds) === JSON.stringify(manifestIds), "engine does not mint a second topic order");
  passed.push("engine lists project the canonical catalog and are not a second registry");

  for (const canonicalTopic of contentManifest) {
    const result = resolveTopic({ topicId: canonicalTopic.id });
    assert(result.ok === true, `missing engine model for ${canonicalTopic.id}`);
    if (!result.ok) continue;
    const model = validateTopicEngineModel(result.data);
    assert(model.identity.id === canonicalTopic.id, `id drift on ${canonicalTopic.id}`);
    assert(model.identity.href === canonicalTopic.href, `href drift on ${canonicalTopic.id}`);
    assert(getDiscipline(model.hierarchy.disciplineId) !== undefined, `unknown discipline on ${model.identity.id}`);
    assert(getSubject(model.hierarchy.subjectId) !== undefined, `unknown subject on ${model.identity.id}`);
    assert(getCategory(model.hierarchy.categoryId) !== undefined, `unknown category on ${model.identity.id}`);
    for (const concept of model.concepts) {
      assert(getConcept(concept.id) !== undefined, `missing concept ${concept.id}`);
    }
    const read = getTopicRead(canonicalTopic.id);
    assert(read !== undefined, `existing topic read missing for ${canonicalTopic.id}`);
    assert(read.id === model.identity.id, `read contract id mismatch on ${canonicalTopic.id}`);
    assert(
      model.status.lifecycle === canonicalTopic.contentMetadata.lifecycle,
      `Phase 1C lifecycle drift on ${canonicalTopic.id}`,
    );
    assert(
      model.status.version === canonicalTopic.contentMetadata.version,
      `Phase 1C version drift on ${canonicalTopic.id}`,
    );
    assertJsonSafe(model, `topic ${model.identity.id}`);
    assertNoForbiddenTopicEngineKeys(model, `topic ${model.identity.id}`);
    assertNoAmbiguousTopicEngineBooleans(model, `topic ${model.identity.id}`);
    assert(!("isReady" in model) && !("isReady" in model.status), `${model.identity.id} must not expose isReady`);
    assert(
      !("isComplete" in model) && !("isComplete" in model.status),
      `${model.identity.id} must not expose isComplete`,
    );
    assert(!("isActive" in model) && !("isActive" in model.status), `${model.identity.id} must not expose isActive`);
    assertNoImplementationPaths(model, `topic ${model.identity.id}`);
  }
  passed.push("every canonical topic has a JSON-safe engine model bound to existing catalogs");

  const read = getTopicRead(rotationId);
  assert(read !== undefined, "getTopicRead remains usable");
  assert(
    getAssessmentSetRead("geography/earths-rotation/mcq-practice")?.payload.field === "sections.mcqPractice",
    "getAssessmentSetRead remains the internal payload-pointer contract",
  );
  const access = decideAccess({ scope: "topic", targetId: rotationId }, []);
  assert(access.allowed === true && access.reason === "free", "catalog entitlement decision remains free");
  assert(!("payload" in rotation.capabilities.assessment), "engine assessment capability omits payload pointers");
  assert(!("events" in rotation) && !("analytics" in rotation), "engine model has no analytics events");
  assert(!("entitlement" in rotation) && !("entitlements" in rotation), "engine model has no entitlement records");
  assert(!("commerce" in rotation) && !("order" in rotation) && !("orders" in rotation), "engine model has no commerce records");
  assert(!("completedTopics" in rotation) && !("localStorage" in rotation), "engine model has no learner storage");
  assert(
    isTopicCompleted({ completedTopics: [rotationId], mcqResults: [] }, canonical) === true,
    "existing learner completion remains authoritative",
  );
  passed.push("existing Phase 1 read, assessment, and access contracts remain usable");
  passed.push("learner, analytics, entitlement, and commerce stay outside the engine model");

  const payload = geographyTopicsBySlug["earths-rotation"]?.sections.mcqPractice;
  assert(Array.isArray(payload) && payload.length > 0, "Earth's Rotation MCQ payload still exists");
  assert(
    payload[0]?.question === "In which direction does the Earth rotate on its axis?",
    "first MCQ question wording is unchanged",
  );
  assert(payload[0]?.answer === "West to East", "first MCQ answer is unchanged");
  assert(!("id" in (payload[0] ?? {})), "question identity remains unimplemented");
  assert(canonical.id === rotationId, "canonical topic id was not rewritten");
  passed.push("Geography payload remains in geography-data.ts");

  assert(isAnswerCorrect({ answer: "A" }, "A") === true, "correct option matches");
  assert(isAnswerCorrect({ answer: "A" }, "a") === false, "correctness is case-sensitive");
  assert(nextScore(0, true) === 1, "score increments by 1 when correct");
  assert(nextScore(4, false) === 4, "score unchanged when incorrect");
  passed.push("assessment scoring remains unchanged");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === rotationId),
    "search still matches Earth's Rotation by title/slug",
  );
  const engineHits = searchTopicEngine("rotation");
  assert(
    engineHits.some((item) => item.identity.id === rotationId),
    "topic-engine search hook composes over the existing index",
  );
  passed.push("search remains unchanged and the engine search hook is compositional");

  expectThrow("payload leak", () =>
    validateTopicEngineModel({
      ...rotation,
      sections: { overview: "leaked" },
    }),
  );
  expectThrow("mcq leak", () =>
    validateTopicEngineModel({
      ...rotation,
      capabilities: {
        ...rotation.capabilities,
        questions: [{ question: "no" }],
      },
    }),
  );
  expectThrow("absent composed identity", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, identityExistence: "absent" },
    }),
  );
  expectThrow("isReady true", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, isReady: true },
    } as unknown),
  );
  expectThrow("isReady false", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, isReady: false },
    } as unknown),
  );
  expectThrow("isComplete true", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, isComplete: true },
    } as unknown),
  );
  expectThrow("isComplete false", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, isComplete: false },
    } as unknown),
  );
  expectThrow("isActive true", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, isActive: true },
    } as unknown),
  );
  expectThrow("isActive false", () =>
    validateTopicEngineModel({
      ...rotation,
      status: { ...rotation.status, isActive: false },
    } as unknown),
  );
  expectThrow("overloaded contentStatus as engine ready", () =>
    validateTopicEngineModel({
      ...rotation,
      status: {
        ...rotation.status,
        contentStatus: "partial",
      },
    }),
  );
  passed.push("validation rejects payload, assessment, and storage leaks");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-engine.ts");

if (executedFromCli) {
  const passed = runTopicEngineVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("TOPIC_ENGINE_VERIFICATION: PASS");
}
