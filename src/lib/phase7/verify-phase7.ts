/**
 * Phase 7D — Identity, Entitlement & Commerce integration gate.
 *
 * Composes 7A/7B/7C. Does not own domain types. Does not persist.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { proposeEntitlementGrantFromPurchase } from "@/lib/commerce/grant";
import {
  commerceOrderId,
  commercePaymentId,
  commerceProductId,
  commercePurchaseId,
} from "@/lib/commerce/identity";
import { toPaymentRead } from "@/lib/commerce/read";
import {
  FORBIDDEN_COMMERCE_FIELDS,
  type CommerceOrder,
  type CommercePayment,
  type CommerceProduct,
  type CommercePurchase,
} from "@/lib/commerce/types";
import {
  validateCommerceOrder,
  validateCommercePayment,
  validateCommerceProduct,
  validateCommercePurchase,
} from "@/lib/commerce/validate";
import { runPhase7cVerification } from "@/lib/commerce/verify-phase7c";
import { decideAccess } from "@/lib/entitlement/access";
import { entitlementFromGrantProposal } from "@/lib/entitlement/grant";
import { entitlementId } from "@/lib/entitlement/identity";
import { FORBIDDEN_ENTITLEMENT_FIELDS } from "@/lib/entitlement/types";
import { runPhase7bVerification } from "@/lib/entitlement/verify-phase7b";
import { defaultIdentityRead } from "@/lib/identity/read";
import { resolveLearnerIdentity } from "@/lib/identity/resolve";
import { FORBIDDEN_PUBLIC_IDENTITY_FIELDS, LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { runIdentityVerification } from "@/lib/identity/verify-identity";
import { defaultLocalProfile } from "@/lib/learner/identity";
import { validateLearnerProfile } from "@/lib/learner/validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 7 verification failed: ${message}`);
}

function importedModules(source: string): string[] {
  const imports: string[] = [];
  const re = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    imports.push(match[1]);
    match = re.exec(source);
  }
  return imports;
}

function listFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) listFiles(full, acc);
    else acc.push(full.replace(/\\/g, "/"));
  }
  return acc;
}

function runtimeFiles(dir: string): string[] {
  return listFiles(dir).filter(
    (path) => path.endsWith(".ts") && !path.includes("verify-") && !path.endsWith(".d.ts"),
  );
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

function assertNoForbidden(value: unknown, banned: readonly string[], label: string): void {
  const keys = collectKeys(value);
  for (const field of banned) {
    assert(!keys.has(field), `${label} has no ${field}`);
  }
}

function sampleProduct(): CommerceProduct {
  return validateCommerceProduct({
    id: commerceProductId("future-bundle"),
    type: "one_time",
    title: "Future Bundle",
    status: "active",
  });
}

function sampleOrder(): CommerceOrder {
  return validateCommerceOrder({
    id: commerceOrderId("phase7-gate"),
    learnerId: LOCAL_LEARNER_ID,
    product: { productId: "future-bundle" },
    status: "confirmed",
    createdAt: "2026-09-02T12:00:00.000Z",
  });
}

function samplePurchase(): CommercePurchase {
  return validateCommercePurchase({
    id: commercePurchaseId("phase7-gate"),
    orderId: commerceOrderId("phase7-gate"),
    learnerId: LOCAL_LEARNER_ID,
    productId: "future-bundle",
    status: "completed",
    purchasedAt: "2026-09-02T12:05:00.000Z",
  });
}

function samplePayment(): CommercePayment {
  return validateCommercePayment({
    id: commercePaymentId("phase7-gate"),
    orderId: commerceOrderId("phase7-gate"),
    status: "captured",
    provider: "future-provider",
    providerReference: "opaque-ref-7d",
    amount: 499,
    currency: "USD",
    createdAt: "2026-09-02T12:04:00.000Z",
  });
}

export function runPhase7Verification(): string[] {
  const passed: string[] = [];

  const identity = runIdentityVerification();
  assert(identity.length > 0, "Phase 7A identity verifier still runs");
  passed.push("Phase 7A identity verifier remains green");

  const entitlement = runPhase7bVerification();
  assert(entitlement.length > 0, "Phase 7B entitlement verifier still runs");
  passed.push("Phase 7B entitlement verifier remains green");

  const commerce = runPhase7cVerification();
  assert(commerce.length > 0, "Phase 7C commerce verifier still runs");
  passed.push("Phase 7C commerce verifier remains green");

  const resolved = resolveLearnerIdentity();
  assert(resolved.ok === true, "identity resolution succeeds");
  assert(resolved.ok && resolved.identity.learnerId === "learner/local", "canonical learner is learner/local");
  const profile = validateLearnerProfile(defaultLocalProfile());
  assert(profile.learnerId === LOCAL_LEARNER_ID, "learner profile consumes identity");
  const identityRead = defaultIdentityRead();
  assert(identityRead.learnerId === profile.learnerId, "Identity → Learner");
  passed.push("IDENTITY canonical learner/local and deterministic resolution");

  const publicTopic = decideAccess({ scope: "topic", targetId: "geography/earths-rotation" }, []);
  assert(publicTopic.allowed === true && publicTopic.classification === "public", "public topic allowed");
  const protectedMissing = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(protectedMissing.allowed === false, "protected resource fails closed");
  passed.push("ENTITLEMENT public access and fail-closed protected access");

  const product = sampleProduct();
  const order = sampleOrder();
  const purchase = samplePurchase();
  const payment = samplePayment();
  assert(product.id !== order.id, "product ≠ order");
  assert(purchase.id.startsWith("purchase/"), "purchase namespace");
  assert(payment.id.startsWith("payment/"), "payment namespace");

  const proposal = proposeEntitlementGrantFromPurchase({
    purchase,
    order,
    product,
    scope: "feature",
    targetId: "future-explanations",
  });
  const granted = entitlementFromGrantProposal(proposal);
  assert(granted.id === entitlementId("feature", "future-explanations"), "proposal materializes canonical entitlement");
  assert(granted.source === "purchase", "entitlement source is purchase");
  assert(granted.learnerId === LOCAL_LEARNER_ID, "entitlement learner is learner/local");
  const entitled = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [granted],
  );
  assert(entitled.allowed === true && entitled.reason === "entitled", "Purchase → Proposal → Entitlement → Access");
  passed.push("INTEGRATION commercial path goes through Entitlement");

  let cancelledThrew = false;
  try {
    proposeEntitlementGrantFromPurchase({
      purchase: validateCommercePurchase({
        id: commercePurchaseId("phase7-cancelled"),
        orderId: order.id,
        learnerId: LOCAL_LEARNER_ID,
        productId: product.id,
        status: "cancelled",
      }),
      order,
      product,
      scope: "feature",
      targetId: "future-explanations",
    });
  } catch {
    cancelledThrew = true;
  }
  assert(cancelledThrew, "invalid purchase cannot produce proposal");
  passed.push("COMMERCE valid purchase proposes; invalid purchase does not");

  const payDecision = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [payment as unknown as never],
  );
  const purchaseDecision = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [purchase as unknown as never],
  );
  assert(payDecision.allowed === false, "payment does not grant access");
  assert(purchaseDecision.allowed === false, "purchase does not grant access");
  passed.push("SECURITY payment and purchase are not access authorities");

  assertNoForbidden(identityRead, FORBIDDEN_PUBLIC_IDENTITY_FIELDS, "identity read");
  assertNoForbidden(publicTopic, FORBIDDEN_ENTITLEMENT_FIELDS, "access decision");
  assertNoForbidden(toPaymentRead(payment), FORBIDDEN_COMMERCE_FIELDS, "payment read");
  assertNoForbidden(proposal, FORBIDDEN_ENTITLEMENT_FIELDS, "grant proposal");
  passed.push("SECURITY public contracts expose no sensitive fields");

  const identityRuntime = runtimeFiles("src/lib/identity");
  for (const path of identityRuntime) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/entitlement"), `${path} does not import entitlement`);
      assert(!specifier.includes("/commerce"), `${path} does not import commerce`);
      assert(!specifier.includes("/learner/"), `${path} does not import learner domain`);
    }
  }
  const entitlementRuntime = runtimeFiles("src/lib/entitlement");
  for (const path of entitlementRuntime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("/commerce"), `${path} does not import commerce`);
      assert(!specifier.includes("ai-intelligence"), `${path} does not import AI`);
      assert(!specifier.includes("/search/"), `${path} does not import search`);
    }
    assert(!source.includes("localStorage"), `${path} does not write storage`);
    assert(!source.includes("fetch("), `${path} does not call network`);
  }
  const commerceRuntime = runtimeFiles("src/lib/commerce");
  for (const path of commerceRuntime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("entitlement/access"), `${path} does not import access evaluation`);
      assert(!specifier.includes("ai-intelligence"), `${path} does not import AI`);
      assert(!specifier.includes("/search/"), `${path} does not import search`);
    }
    if (path.endsWith("grant.ts")) {
      assert(!source.includes("decideAccess"), "commerce grant does not decide access");
    }
    assert(!source.includes("localStorage"), `${path} does not write storage`);
  }
  passed.push("Cross-domain dependency direction holds");

  const topicRuntime = runtimeFiles("src/lib/topic-engine");
  for (const path of topicRuntime) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("entitlement/access"), `${path} is not an authorization authority`);
      assert(!specifier.includes("/commerce/"), `${path} does not own commerce`);
    }
  }
  const assessmentRuntime = runtimeFiles("src/lib/assessment-engine");
  for (const path of assessmentRuntime) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/entitlement/"), `${path} is not an authorization authority`);
      assert(!specifier.includes("/commerce/"), `${path} does not own commerce`);
    }
  }
  const searchRuntime = runtimeFiles("src/lib/search");
  for (const path of searchRuntime) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/entitlement/"), `${path} is not an authorization authority`);
    }
  }
  const aiRuntime = runtimeFiles("src/lib/ai-intelligence");
  for (const path of aiRuntime) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/entitlement/"), `${path} is not an authorization authority`);
      assert(!specifier.includes("/commerce/"), `${path} does not own commerce`);
    }
  }
  passed.push("Topic Engine, Assessment, Search, and AI are not authorization authorities");

  const clientFiles = [...listFiles("src/components"), ...listFiles("src/app")].filter(
    (path) => path.endsWith(".ts") || path.endsWith(".tsx"),
  );
  for (const path of clientFiles) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("/commerce/"), `${path} is not commerce authority`);
      assert(!specifier.includes("entitlement/access"), `${path} is not access authority`);
      assert(!specifier.includes("entitlement/grant"), `${path} is not grant authority`);
    }
    assert(!source.includes("NEXT_PUBLIC_") || !source.toLowerCase().includes("secret"), `${path} has no public secrets`);
  }
  passed.push("Client surfaces are not identity/entitlement/commerce authorities");

  const pkg = readFileSync("package.json", "utf8").toLowerCase();
  for (const mark of [
    "supabase",
    "firebase",
    "clerk",
    "next-auth",
    "prisma",
    "drizzle-orm",
    "stripe",
    "sslcommerz",
    "mongodb",
    "jsonwebtoken",
  ]) {
    assert(!pkg.includes(mark), `package.json does not add ${mark}`);
  }
  const appFiles = listFiles("src/app");
  for (const path of appFiles) {
    const lower = path.toLowerCase();
    assert(!lower.includes("/login"), "no /login route");
    assert(!lower.includes("/checkout"), "no /checkout route");
    assert(!lower.includes("/api/products"), "no /api/products");
    assert(!lower.includes("/api/orders"), "no /api/orders");
    assert(!lower.includes("/api/payments"), "no /api/payments");
    assert(!lower.includes("/api/auth"), "no /api/auth");
  }
  passed.push("Scope audit: no auth, database, checkout, or commerce API");

  const learnerTypes = readFileSync("src/lib/learner/types.ts", "utf8");
  const identityTypes = readFileSync("src/lib/identity/types.ts", "utf8");
  assert(identityTypes.includes("export type LearnerIdentity"), "one LearnerIdentity");
  assert(!learnerTypes.includes("LearnerIdentity"), "learner does not define LearnerIdentity");
  assert(identityTypes.includes('export const LOCAL_LEARNER_ID = "learner/local"'), "one LOCAL_LEARNER_ID definition");
  assert(!existsSync("src/lib/entitlement/types-v2.ts"), "no Entitlement V2");
  assert(!existsSync("src/lib/commerce/types-v2.ts"), "no Commerce V2");
  passed.push("Duplicate model audit: one canonical authority per concept");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase7.ts");

if (executedFromCli) {
  const passed = runPhase7Verification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE7_VERIFICATION: PASS");
}
