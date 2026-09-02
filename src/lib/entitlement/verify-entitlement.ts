import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { searchTopics } from "@/lib/search-data";
import { parseLearnerState } from "@/store/learner/storage";
import { decideAccess, hasEntitlement, isPublicCatalogResource } from "./access";
import { entitlementId } from "./identity";
import { validateEntitlement } from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Entitlement verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Entitlement verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
}

export function runEntitlementVerification(): string[] {
  const passed: string[] = [];

  assert(
    isPublicCatalogResource("topic", "geography/earths-rotation"),
    "Earth's Rotation is a public catalog topic",
  );
  assert(isPublicCatalogResource("subject", "bcs"), "BCS subject remains public");
  assert(
    isPublicCatalogResource("assessment_set", "geography/earths-rotation/mcq-practice"),
    "Geography MCQ practice remains public",
  );
  assert(
    !isPublicCatalogResource("feature", "future-explanations"),
    "unknown features are not public",
  );

  const freeTopic = decideAccess(
    { scope: "topic", targetId: "geography/earths-rotation" },
    [],
  );
  assert(freeTopic.allowed === true && freeTopic.reason === "free", "catalog topics stay free");
  assert(
    hasEntitlement({ scope: "subject", targetId: "english" }, []),
    "English catalog remains accessible without entitlements",
  );
  passed.push("current catalog knowledge and assessment remain free");

  const grant = validateEntitlement({
    id: entitlementId("feature", "future-explanations"),
    learnerId: LOCAL_LEARNER_ID,
    scope: "feature",
    target: { featureKey: "future-explanations" },
    status: "active",
    source: "manual",
  });
  assert(grant.id === "entitlement/feature/future-explanations", "entitlement id is deterministic");
  assert(grant.learnerId === LOCAL_LEARNER_ID, "optional learnerId uses learner/local");
  assert(!("amount" in grant), "entitlement has no payment amount");
  assert(!("transactionId" in grant), "entitlement has no transaction id");
  assertJsonSafe(grant, "feature entitlement");

  const entitled = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [grant],
  );
  assert(entitled.allowed === true && entitled.reason === "entitled", "active grant allows access");
  const missing = decideAccess({ scope: "feature", targetId: "future-explanations" }, []);
  assert(missing.allowed === false && missing.reason === "missing", "no grant means no feature access");
  passed.push("feature access requires an entitlement; catalog access does not");

  const expired = validateEntitlement({
    id: entitlementId("feature", "future-explanations"),
    scope: "feature",
    target: { featureKey: "future-explanations" },
    status: "expired",
    source: "promotional",
  });
  assert(
    decideAccess({ scope: "feature", targetId: "future-explanations" }, [expired]).reason ===
      "expired",
    "expired status denies access",
  );
  const revoked = validateEntitlement({
    id: entitlementId("feature", "future-explanations"),
    scope: "feature",
    target: { featureKey: "future-explanations" },
    status: "revoked",
    source: "manual",
  });
  assert(
    decideAccess({ scope: "feature", targetId: "future-explanations" }, [revoked]).reason ===
      "revoked",
    "revoked status denies access",
  );

  const timed = validateEntitlement({
    id: entitlementId("topic", "geography/earths-rotation"),
    scope: "topic",
    target: { topicId: "geography/earths-rotation" },
    status: "active",
    source: "free",
    grantedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-06-01T00:00:00.000Z",
  });
  assert(
    decideAccess(
      { scope: "topic", targetId: "geography/earths-rotation", asOf: "2026-07-01T00:00:00.000Z" },
      [timed],
    ).reason === "free",
    "public catalog topic stays free even with a dated entitlement record",
  );
  passed.push("status and expiry evaluation stay pure and do not paywall catalog content");

  const setGrant = validateEntitlement({
    id: entitlementId("assessment_set", "geography/earths-rotation/mcq-practice"),
    scope: "assessment_set",
    target: { assessmentSetId: "geography/earths-rotation/mcq-practice" },
    status: "active",
    source: "free",
  });
  assert(
    setGrant.target.assessmentSetId === "geography/earths-rotation/mcq-practice",
    "assessment-set target is a canonical id",
  );
  assert(!("questions" in setGrant.target), "entitlement does not embed MCQs");
  passed.push("assessment-set entitlements reference identity only");

  expectThrow("empty id", () =>
    validateEntitlement({
      id: "  ",
      scope: "feature",
      target: { featureKey: "future-explanations" },
      status: "active",
    }),
  );
  expectThrow("id mismatch", () =>
    validateEntitlement({
      id: "wrong",
      scope: "topic",
      target: { topicId: "geography/earths-rotation" },
      status: "active",
    }),
  );
  expectThrow("unknown topic", () =>
    validateEntitlement({
      id: entitlementId("topic", "geography/missing"),
      scope: "topic",
      target: { topicId: "geography/missing" },
      status: "active",
    }),
  );
  expectThrow("expires before granted", () =>
    validateEntitlement({
      id: entitlementId("feature", "future-explanations"),
      scope: "feature",
      target: { featureKey: "future-explanations" },
      status: "active",
      grantedAt: "2026-06-01T00:00:00.000Z",
      expiresAt: "2026-01-01T00:00:00.000Z",
    }),
  );
  expectThrow("foreign learner id", () =>
    validateEntitlement({
      id: entitlementId("feature", "future-explanations"),
      learnerId: "learner/other",
      scope: "feature",
      target: { featureKey: "future-explanations" },
      status: "active",
    }),
  );
  expectThrow("invalid source", () =>
    validateEntitlement({
      id: entitlementId("feature", "future-explanations"),
      scope: "feature",
      target: { featureKey: "future-explanations" },
      status: "active",
      source: "stripe",
    }),
  );
  passed.push("validation rejects malformed ids, unknown targets, and payment-like sources");

  const persisted = parseLearnerState(
    JSON.stringify({
      mcqResults: [],
      completedTopics: ["geography/earths-rotation"],
    }),
  );
  assert(persisted.completedTopics[0] === "geography/earths-rotation", "completion storage still parses");
  assert(!("entitlements" in persisted), "completion state does not include entitlements");
  passed.push("learner completion storage remains independent");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === "geography/earths-rotation"),
    "search still matches Earth's Rotation",
  );
  passed.push("search remains unchanged");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-entitlement.ts");

if (executedFromCli) {
  const passed = runEntitlementVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ENTITLEMENT_VERIFICATION: PASS");
}
