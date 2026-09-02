import { contentManifest } from "@/lib/content/manifest";
import { commerceOrderId } from "@/lib/commerce/identity";
import { validateCommerceOrder } from "@/lib/commerce/validate";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { validateLearnerGoal, validateLearnerProfile } from "@/lib/learner/validate";
import { searchTopics } from "@/lib/search-data";
import {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  PLATFORM_API_CONTRACT_VERSIONS,
  type CommerceOrderRead,
  type LearnerReadResponse,
  type PlatformReadResult,
} from "./api";
import {
  composeDefaultIdentityReadResponse,
  composeDefaultLearnerReadResponse,
  composeKnowledgeCollection,
  composePublicTopicAccess,
  composeTopicReadResponse,
  getAssessmentSetRead,
  getCategoriesBySubjectId,
  getConceptRead,
  getConceptReadModel,
  getDisciplines,
  getSubjectsByDisciplineId,
  getTopicRead,
  getTopicReadModel,
  getTopicsByCategoryId,
  readCategories,
  readSubjects,
  readTopic,
  readTopics,
} from "./compose";
import {
  assertJsonSafe,
  assertNoForbiddenKeys,
  assertNoImplementationPaths,
  parseGetCategoriesQuery,
  parseGetSubjectsQuery,
  parseGetTopicQuery,
  parseGetTopicsQuery,
  validatePlatformReadError,
  validateTopicReadResponse,
} from "./validate-api";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`API-contract verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`API-contract verification failed: expected throw (${label})`);
}

function isSuccess<T>(result: PlatformReadResult<T>): result is Extract<PlatformReadResult<T>, { success: true }> {
  return result.success === true;
}

export function runApiContractVerification(): string[] {
  const passed: string[] = [];

  const rotationId = "geography/earths-rotation";
  const composed = composeTopicReadResponse(rotationId);
  assert(composed !== undefined, "Earth's Rotation topic response exists");
  const response = validateTopicReadResponse(composed);
  assert(response.topic.id === rotationId, "Earth's Rotation id is unchanged");
  assert(response.topic.href === "/geography/earths-rotation", "Earth's Rotation href is unchanged");
  assert(response.concepts.length === 4, "Earth's Rotation has four concepts");
  assert(
    response.concepts[0]?.id === "geography/earths-rotation/rotation",
    "Rotation concept identity is unchanged",
  );
  assert(
    response.concepts[1]?.id === "geography/earths-rotation/axis",
    "Axis concept identity is unchanged",
  );
  assert(
    response.concepts[2]?.id === "geography/earths-rotation/day-and-night",
    "Day and Night concept identity is unchanged",
  );
  assert(
    response.concepts[3]?.id === "geography/earths-rotation/apparent-motion",
    "Apparent Motion concept identity is unchanged",
  );
  assert(response.assessmentSets.length === 1, "Earth's Rotation has one assessment set");
  const rotationSet = response.assessmentSets[0];
  assert(rotationSet !== undefined, "Earth's Rotation assessment set is present");
  assert(
    rotationSet.id === "geography/earths-rotation/mcq-practice",
    "assessment-set identity is unchanged",
  );
  assert(rotationSet.kind === "mcq-practice", "assessment-set kind is mcq-practice");
  assert(!("payload" in rotationSet), "API assessment set omits internal payload pointer");
  assert(!("sections" in response.topic), "topic response does not embed Geography payload");
  assert(!("mcqPractice" in response.topic), "topic response does not embed MCQ arrays");
  assert(!("learner" in response), "topic response does not include learner");
  assert(!("analytics" in response), "topic response does not include analytics");
  assert(!("entitlement" in response), "topic response does not include entitlement");
  assert(!("commerce" in response), "topic response does not include commerce");
  assertJsonSafe(response, "Earth's Rotation topic response");
  assertNoForbiddenKeys(response, "Earth's Rotation topic response");
  assertNoImplementationPaths(response, "Earth's Rotation topic response");
  passed.push("TopicReadResponse is a lightweight identity/navigation composition");

  const getterTopic = getTopicRead(rotationId);
  const aliasTopic = getTopicReadModel(rotationId);
  assert(getterTopic !== undefined, "getTopicRead remains usable");
  assert(aliasTopic !== undefined, "getTopicReadModel aliases getTopicRead");
  assert(getterTopic.id === aliasTopic.id, "topic read alias matches live getter");
  assert(getConceptRead("geography/earths-rotation/axis")?.title === "Axis", "getConceptRead remains usable");
  assert(
    getConceptReadModel("geography/earths-rotation/axis")?.id === "geography/earths-rotation/axis",
    "getConceptReadModel aliases getConceptRead",
  );
  assert(
    getAssessmentSetRead("geography/earths-rotation/mcq-practice")?.payload.field === "sections.mcqPractice",
    "getAssessmentSetRead remains the internal payload-pointer contract",
  );
  assert(getDisciplines().some((item) => item.id === "geography"), "getDisciplines remains usable");
  assert(
    getSubjectsByDisciplineId("geography")[0]?.id === "geography",
    "getSubjectsByDisciplineId remains usable",
  );
  assert(
    getCategoriesBySubjectId("geography").some((item) => item.id === "geography/physical-geography"),
    "getCategoriesBySubjectId remains usable",
  );
  assert(
    getTopicsByCategoryId("geography/physical-geography").some((item) => item.id === rotationId),
    "getTopicsByCategoryId remains usable",
  );
  passed.push("existing 1E getters remain usable and are not replaced");

  const topicResult = readTopic(parseGetTopicQuery({ topicId: rotationId }));
  assert(isSuccess(topicResult), "readTopic succeeds for Earth's Rotation");
  assert(topicResult.contractVersion === CURRENT_PLATFORM_API_CONTRACT_VERSION, "success envelope is v1");
  assert(topicResult.data.topic.id === rotationId, "success data reuses topic identity");
  const missing = readTopic({ topicId: "missing/topic" });
  assert(missing.success === false, "unknown topic is not found");
  if (missing.success === false) {
    assert(missing.error.code === "not_found", "unknown topic uses not_found");
    validatePlatformReadError(missing.error);
    assert(!("stack" in missing.error), "error has no stack");
    assert(!("path" in missing.error), "error has no path");
    assertJsonSafe(missing, "not_found envelope");
  }
  const invalid = readTopic({ topicId: "   " });
  assert(invalid.success === false, "blank topicId is invalid_request");
  if (invalid.success === false) {
    assert(invalid.error.code === "invalid_request", "blank topicId uses invalid_request");
  }
  expectThrow("missing topicId", () => parseGetTopicQuery({}));
  expectThrow("non-object query", () => parseGetTopicQuery("geography/earths-rotation"));
  expectThrow("invalid topic response", () =>
    validateTopicReadResponse({ topic: { id: rotationId }, concepts: [], assessmentSets: [] }),
  );
  passed.push("lookup, result envelope, and error contracts are transport-independent");

  const knowledge = composeKnowledgeCollection();
  assert(knowledge.disciplines.some((item) => item.id === "geography"), "knowledge collection includes Geography");
  const physical = readTopics(parseGetTopicsQuery({ categoryId: "geography/physical-geography" }));
  assert(isSuccess(physical), "GetTopicsQuery by category succeeds");
  if (isSuccess(physical)) {
    assert(
      physical.data.items.some((item) => item.id === rotationId),
      "category topic collection includes Earth's Rotation",
    );
  }
  const geographyTopics = readTopics(parseGetTopicsQuery({ subjectId: "geography" }));
  assert(isSuccess(geographyTopics), "GetTopicsQuery by subject succeeds");
  const allTopics = readTopics(parseGetTopicsQuery({}));
  assert(isSuccess(allTopics), "unfiltered topic collection succeeds");
  if (isSuccess(allTopics)) {
    assert(allTopics.data.items.length === contentManifest.length, "topic collection covers the manifest");
  }
  const subjects = readSubjects(parseGetSubjectsQuery({ disciplineId: "geography" }));
  assert(isSuccess(subjects), "GetSubjectsQuery succeeds");
  const categories = readCategories(parseGetCategoriesQuery({ subjectId: "bcs" }));
  assert(isSuccess(categories), "GetCategoriesQuery succeeds");
  assertJsonSafe(knowledge, "knowledge collection");
  passed.push("collection and lookup contracts have no pagination or URL parsing");

  const bcs = composeTopicReadResponse("bcs/english");
  assert(bcs !== undefined, "BCS English stub is representable");
  const bcsResponse = validateTopicReadResponse(bcs);
  assert(bcsResponse.topic.contentStatus === "partial", "BCS stub remains partial");
  assert(bcsResponse.concepts.length === 0, "BCS stub has zero concepts");
  assert(bcsResponse.assessmentSets.length === 0, "BCS stub has zero assessment sets");
  const english = composeTopicReadResponse("english/grammar");
  assert(english !== undefined, "English grammar stub is representable");
  assert(english.concepts.length === 0, "English stub has zero concepts");
  assert(english.assessmentSets.length === 0, "English stub has zero assessment sets");
  passed.push("BCS and English stubs remain partial with empty relationships");

  const learner: LearnerReadResponse = composeDefaultLearnerReadResponse();
  assert(learner.profile.learnerId === LOCAL_LEARNER_ID, "learner read uses learner/local");
  assert(learner.goals.length === 0, "default learner read has no invented goals");
  assert(!("localStorage" in learner), "learner read has no localStorage");
  assert(!("mcqResults" in learner), "learner read does not expose completion state");
  assert(!("completedTopics" in learner), "learner read does not expose completedTopics");
  validateLearnerProfile(learner.profile);
  const sampleGoal = validateLearnerGoal({
    id: "goal/study/geography",
    type: "study",
    status: "active",
    target: { subjectId: "geography" },
  });
  assert(sampleGoal.id.startsWith("goal/"), "goal ids stay in the goal namespace");
  assertJsonSafe(learner, "learner read");
  assertNoForbiddenKeys(learner, "learner read");
  passed.push("learner read boundary is profile/goals only");

  const identityRead = composeDefaultIdentityReadResponse();
  assert(identityRead.identity.learnerId === LOCAL_LEARNER_ID, "identity read uses learner/local");
  assert(identityRead.identity.mode === "local", "identity read mode is local");
  assert(identityRead.identity.status === "active", "identity read status is active");
  assert(!("email" in identityRead.identity), "identity read has no email");
  assert(!("subject" in identityRead.identity), "identity read has no provider subject");
  assertJsonSafe(identityRead, "identity read");
  assertNoForbiddenKeys(identityRead, "identity read");
  passed.push("identity read boundary is canonical learner identity only");

  const access = composePublicTopicAccess(rotationId);
  assert(access.allowed === true && access.reason === "free", "catalog access remains free");
  assert(!("amount" in access), "entitlement access has no amount");
  assert(!("payment" in access), "entitlement access has no payment");
  assertJsonSafe(access, "entitlement access read");
  passed.push("entitlement read boundary is access state, not purchase state");

  const order: CommerceOrderRead = validateCommerceOrder({
    id: commerceOrderId("api-sample"),
    learnerId: LOCAL_LEARNER_ID,
    product: { productId: "future-bundle" },
    status: "pending",
    createdAt: "2026-09-02T12:00:00.000Z",
  });
  assert(order.id.startsWith("order/"), "commerce read reuses order identity");
  assert(!("amount" in order), "commerce read has no amount");
  assert(!("currency" in order), "commerce read has no currency");
  assert(!("payment" in order), "commerce read has no payment");
  assert(!("invoice" in order), "commerce read has no invoice");
  assert(!("checkout" in order), "commerce read has no checkout");
  assertJsonSafe(order, "commerce order read");
  passed.push("commerce read boundary is order identity only");

  assert(CURRENT_PLATFORM_API_CONTRACT_VERSION === "v1", "current API contract is v1");
  assert(PLATFORM_API_CONTRACT_VERSIONS.includes("v2"), "v2 is reserved for additive evolution");
  assert(PLATFORM_API_CONTRACT_VERSIONS.includes("v3"), "v3 is reserved for additive evolution");
  const versionedId: string = response.topic.id;
  assert(!versionedId.includes("v1"), "topic ids do not embed API versions");
  assert(!rotationSet.id.includes("v1"), "assessment-set ids do not embed API versions");
  const rotationConceptId: string = response.concepts[0]?.id ?? "";
  assert(rotationConceptId.length > 0, "first concept id is present");
  assert(!rotationConceptId.includes("v1"), "concept ids do not embed API versions");
  assert(!LOCAL_LEARNER_ID.includes("v1"), "learner ids do not embed API versions");
  passed.push("v1/v2/v3 can evolve without changing domain identities");

  for (const topic of contentManifest) {
    const item = composeTopicReadResponse(topic.id);
    assert(item !== undefined, `missing topic response for ${topic.id}`);
    const validated = validateTopicReadResponse(item);
    assertJsonSafe(validated, `topic response ${topic.id}`);
    assertNoForbiddenKeys(validated, `topic response ${topic.id}`);
    assertNoImplementationPaths(validated, `topic response ${topic.id}`);
  }
  passed.push("every canonical topic has a JSON-safe composed response");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === rotationId),
    "search still matches Earth's Rotation by title/slug",
  );
  passed.push("search remains unchanged");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-api.ts");

if (executedFromCli) {
  const passed = runApiContractVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("API_CONTRACT_VERIFICATION: PASS");
}
