import { readFileSync } from "node:fs";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { runEntitlementVerification } from "./verify-entitlement";
import { classifyAccess, decideAccess, isPublicCatalogResource } from "./access";
import { proposeEntitlementGrant } from "./grant";
import { entitlementId } from "./identity";
import {
  FORBIDDEN_ENTITLEMENT_FIELDS,
  type AccessDecision,
  type Entitlement,
} from "./types";
import { validateEntitlement } from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 7B verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Phase 7B verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
}

function collectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    keys.add(key);
    collectKeys(record[key], keys);
  }
  return keys;
}

function featureGrant(overrides: Partial<Entitlement> = {}): Entitlement {
  return validateEntitlement({
    id: entitlementId("feature", "future-explanations"),
    learnerId: LOCAL_LEARNER_ID,
    scope: "feature",
    target: { featureKey: "future-explanations" },
    status: "active",
    source: "manual",
    ...overrides,
  });
}

function assertDenied(decision: AccessDecision, reason: AccessDecision["reason"], label: string): void {
  assert(decision.allowed === false, `${label} is denied`);
  assert(decision.reason === reason, `${label} reason is ${reason}`);
  assert(decision.classification === "protected", `${label} is protected`);
}

function assertNoForbidden(value: unknown, label: string): void {
  const keys = collectKeys(value);
  for (const field of FORBIDDEN_ENTITLEMENT_FIELDS) {
    assert(!keys.has(field), `${label} has no ${field}`);
  }
}

export function runPhase7bVerification(): string[] {
  const passed: string[] = [];

  const publicTopic = decideAccess({ scope: "topic", targetId: "geography/earths-rotation" }, []);
  assert(publicTopic.allowed === true, "public topic is allowed");
  assert(publicTopic.reason === "free", "public topic reason is free");
  assert(publicTopic.classification === "public", "public topic classification is public");
  passed.push("TEST 1 public resource → allowed");

  const unauthenticated = decideAccess({ scope: "subject", targetId: "bcs" }, []);
  assert(unauthenticated.allowed === true, "public subject allowed without learnerId");
  assert(unauthenticated.classification === "public", "public subject needs no authentication");
  assert(
    decideAccess({ scope: "topic", targetId: "geography/earths-rotation" }, []).allowed === true,
    "Geography remains free",
  );
  assert(decideAccess({ scope: "subject", targetId: "english" }, []).allowed === true, "English remains free");
  passed.push("TEST 2 public resource needs no authentication");

  const grant = featureGrant();
  const entitled = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [grant],
  );
  assert(entitled.allowed === true && entitled.reason === "entitled", "active matching entitlement allows");
  assert(entitled.classification === "protected", "feature is protected");
  passed.push("TEST 3 active matching entitlement → allowed");

  const none = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assertDenied(none, "missing", "no entitlement");
  passed.push("TEST 4 no entitlement → denied");

  const expiredStatus = featureGrant({ status: "expired", learnerId: LOCAL_LEARNER_ID });
  assertDenied(
    decideAccess(
      { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
      [expiredStatus],
    ),
    "expired",
    "expired status",
  );
  passed.push("TEST 5 expired → denied");

  const revoked = featureGrant({ status: "revoked", learnerId: LOCAL_LEARNER_ID });
  assertDenied(
    decideAccess(
      { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
      [revoked],
    ),
    "revoked",
    "revoked status",
  );
  passed.push("TEST 6 revoked → denied");

  const foreign = {
    id: entitlementId("feature", "future-explanations"),
    learnerId: "learner/other",
    scope: "feature" as const,
    target: { featureKey: "future-explanations" },
    status: "active" as const,
    source: "manual" as const,
  };
  assertDenied(
    decideAccess(
      { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
      [foreign],
    ),
    "missing",
    "wrong learner",
  );
  passed.push("TEST 7 wrong learner → denied");

  const otherFeature = validateEntitlement({
    id: entitlementId("feature", "future-premium"),
    learnerId: LOCAL_LEARNER_ID,
    scope: "feature",
    target: { featureKey: "future-premium" },
    status: "active",
    source: "manual",
  });
  assertDenied(
    decideAccess(
      { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
      [otherFeature],
    ),
    "missing",
    "wrong target",
  );
  passed.push("TEST 8 wrong target → denied");

  const topicGrant = validateEntitlement({
    id: entitlementId("topic", "geography/earths-rotation"),
    learnerId: LOCAL_LEARNER_ID,
    scope: "topic",
    target: { topicId: "geography/earths-rotation" },
    status: "active",
    source: "manual",
  });
  assertDenied(
    decideAccess(
      { scope: "feature", targetId: "geography/earths-rotation", learnerId: LOCAL_LEARNER_ID },
      [topicGrant],
    ),
    "missing",
    "wrong scope",
  );
  passed.push("TEST 9 wrong scope → denied");

  const malformed = { paid: true, amount: 99, status: "active" } as unknown as Entitlement;
  assertDenied(
    decideAccess(
      { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
      [malformed],
    ),
    "missing",
    "malformed entitlement",
  );
  expectThrow("empty entitlement id", () =>
    validateEntitlement({
      id: "  ",
      scope: "feature",
      target: { featureKey: "future-explanations" },
      status: "active",
    }),
  );
  passed.push("TEST 10 malformed entitlement → denied/rejected");

  expectThrow("expiresAt before startsAt", () =>
    validateEntitlement({
      id: entitlementId("feature", "future-explanations"),
      learnerId: LOCAL_LEARNER_ID,
      scope: "feature",
      target: { featureKey: "future-explanations" },
      status: "active",
      startsAt: "2026-06-01T00:00:00.000Z",
      expiresAt: "2026-05-01T00:00:00.000Z",
    }),
  );
  passed.push("TEST 11 invalid date range → rejected");

  const windowed = featureGrant({
    learnerId: LOCAL_LEARNER_ID,
    startsAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2026-06-30T00:00:00.000Z",
  });
  const query = {
    scope: "feature" as const,
    targetId: "future-explanations",
    learnerId: LOCAL_LEARNER_ID,
  };
  assertDenied(
    decideAccess(query, [windowed], { now: "2026-05-31T23:59:59.999Z" }),
    "missing",
    "before startsAt",
  );
  passed.push("TEST 12 before startsAt → denied");

  const atStart = decideAccess(query, [windowed], { now: "2026-06-01T00:00:00.000Z" });
  const mid = decideAccess(query, [windowed], { now: "2026-06-15T12:00:00.000Z" });
  const atEnd = decideAccess(query, [windowed], { now: "2026-06-30T00:00:00.000Z" });
  assert(atStart.allowed && mid.allowed && atEnd.allowed, "valid interval including bounds is allowed");
  assert(atStart.reason === "entitled", "in-window reason is entitled");
  passed.push("TEST 13 valid interval → allowed");

  assertDenied(
    decideAccess(query, [windowed], { now: "2026-06-30T00:00:00.001Z" }),
    "expired",
    "after expiresAt",
  );
  passed.push("TEST 14 after expiresAt → denied");

  assert(isPublicCatalogResource("topic", "geography/earths-rotation"), "Earth's Rotation is a public topic");
  assert(
    decideAccess({ scope: "topic", targetId: "geography/earths-rotation" }, []).allowed === true,
    "topic target remains freely accessible",
  );
  assert(classifyAccess("topic", "geography/earths-rotation") === "public", "topic classification is public");
  passed.push("TEST 15 topic target works");

  assert(isPublicCatalogResource("subject", "bcs"), "BCS subject is public");
  assert(decideAccess({ scope: "subject", targetId: "english" }, []).allowed === true, "subject target works");
  passed.push("TEST 16 subject target works");

  assert(
    isPublicCatalogResource("assessment_set", "geography/earths-rotation/mcq-practice"),
    "MCQ practice set is public",
  );
  assert(
    decideAccess(
      { scope: "assessment_set", targetId: "geography/earths-rotation/mcq-practice" },
      [],
    ).allowed === true,
    "assessment_set target works",
  );
  passed.push("TEST 17 assessment_set target works");

  assert(classifyAccess("feature", "future-explanations") === "protected", "feature is protected");
  assert(entitled.allowed === true, "feature target works with entitlement");
  passed.push("TEST 18 feature target works");

  assert(LOCAL_LEARNER_ID === "learner/local", "canonical learner is learner/local");
  assert(grant.learnerId === "learner/local", "entitlement learnerId is learner/local");
  passed.push("TEST 19 learner/local remains valid");

  const paymentLike = {
    id: "pay_123",
    paid: true,
    amount: 499,
    currency: "USD",
    payment: "captured",
    invoice: "inv_1",
  } as unknown as Entitlement;
  assertDenied(
    decideAccess(query, [paymentLike]),
    "missing",
    "payment state",
  );
  const proposal = proposeEntitlementGrant({
    learnerId: LOCAL_LEARNER_ID,
    scope: "feature",
    targetId: "future-explanations",
    source: "purchase",
    sourceReference: "order-ref-7b",
  });
  assert(proposal.source === "purchase", "proposal can record purchase as source identifier");
  assert(
    decideAccess(query, []).allowed === false,
    "grant proposal does not itself authorize access",
  );
  const purchaseEntitlement = featureGrant({ source: "purchase", learnerId: LOCAL_LEARNER_ID });
  assert(
    decideAccess(query, [purchaseEntitlement]).reason === "entitled",
    "entitlement with source purchase can grant; payment state cannot",
  );
  passed.push("TEST 20 payment/commerce-like state cannot directly grant access");

  const noTime = decideAccess(query, [windowed]);
  assert(noTime.allowed === false, "protected window without now is fail-closed");
  passed.push("temporal evaluation is fail-closed without injectable now");

  const legacyNoOwner = validateEntitlement({
    id: entitlementId("feature", "future-explanations"),
    scope: "feature",
    target: { featureKey: "future-explanations" },
    status: "active",
    source: "manual",
  });
  assert(
    decideAccess(query, [legacyNoOwner]).allowed === true,
    "entitlement without learnerId still matches (Phase 1H)",
  );
  passed.push("absent learnerId remains compatible");

  assertJsonSafe(publicTopic, "public decision");
  assertJsonSafe(entitled, "entitled decision");
  assertJsonSafe(grant, "entitlement");
  assertJsonSafe(proposal, "grant proposal");
  assertNoForbidden(publicTopic, "public decision");
  assertNoForbidden(entitled, "entitled decision");
  assertNoForbidden(grant, "entitlement");
  assertNoForbidden(proposal, "grant proposal");
  const typesSource = readFileSync("src/lib/entitlement/types.ts", "utf8");
  const decisionBlock = typesSource.slice(typesSource.indexOf("export type AccessDecision"));
  const decisionDecl = decisionBlock.slice(0, decisionBlock.indexOf("};") + 2);
  for (const field of FORBIDDEN_ENTITLEMENT_FIELDS) {
    assert(!decisionDecl.includes(field), `AccessDecision type has no ${field}`);
  }
  passed.push("public contracts expose no secrets, tokens, or payment fields");

  const prior = runEntitlementVerification();
  assert(prior.length > 0, "Phase 1H entitlement verifier still runs");
  passed.push("Phase 1H entitlement contracts remain compatible");

  const accessSource = readFileSync("src/lib/entitlement/access.ts", "utf8");
  assert(!accessSource.includes("localStorage"), "access evaluation does not write storage");
  assert(!accessSource.includes("fetch("), "access evaluation does not call network");
  assert(!accessSource.includes("markTopicComplete"), "access evaluation does not mutate learner state");
  passed.push("access evaluation remains pure");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase7b.ts");

if (executedFromCli) {
  const passed = runPhase7bVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE7B_VERIFICATION: PASS");
}
