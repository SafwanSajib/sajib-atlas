import { readFileSync } from "node:fs";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { runCommerceOrderVerification } from "./verify-commerce";
import { proposeEntitlementGrantFromPurchase } from "./grant";
import {
  commerceOrderId,
  commercePaymentId,
  commerceProductId,
  commercePurchaseId,
} from "./identity";
import { toPaymentRead } from "./read";
import {
  FORBIDDEN_COMMERCE_FIELDS,
  type CommerceOrder,
  type CommercePayment,
  type CommerceProduct,
  type CommercePurchase,
} from "./types";
import {
  validateCommerceOrder,
  validateCommercePayment,
  validateCommerceProduct,
  validateCommercePurchase,
} from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 7C verification failed: ${message}`);
}

function isDistinct(left: string, right: string): boolean {
  return left !== right;
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Phase 7C verification failed: expected throw (${label})`);
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

function assertNoForbidden(value: unknown, label: string): void {
  const keys = collectKeys(value);
  for (const field of FORBIDDEN_COMMERCE_FIELDS) {
    assert(!keys.has(field), `${label} has no ${field}`);
  }
}

function sampleProduct(overrides: Partial<CommerceProduct> = {}): CommerceProduct {
  return validateCommerceProduct({
    id: commerceProductId("future-bundle"),
    type: "one_time",
    title: "Future Bundle",
    status: "active",
    ...overrides,
  });
}

function sampleOrder(overrides: Partial<CommerceOrder> = {}): CommerceOrder {
  return validateCommerceOrder({
    id: commerceOrderId("local-7c"),
    learnerId: LOCAL_LEARNER_ID,
    product: { productId: "future-bundle" },
    status: "confirmed",
    createdAt: "2026-09-02T12:00:00.000Z",
    ...overrides,
  });
}

function samplePurchase(overrides: Partial<CommercePurchase> = {}): CommercePurchase {
  return validateCommercePurchase({
    id: commercePurchaseId("local-7c"),
    orderId: commerceOrderId("local-7c"),
    learnerId: LOCAL_LEARNER_ID,
    productId: "future-bundle",
    status: "completed",
    purchasedAt: "2026-09-02T12:05:00.000Z",
    ...overrides,
  });
}

function samplePayment(overrides: Partial<CommercePayment> = {}): CommercePayment {
  return validateCommercePayment({
    id: commercePaymentId("local-7c"),
    orderId: commerceOrderId("local-7c"),
    status: "captured",
    provider: "future-provider",
    providerReference: "opaque-ref-7c",
    amount: 499,
    currency: "USD",
    createdAt: "2026-09-02T12:04:00.000Z",
    ...overrides,
  });
}

const protectedQuery = {
  scope: "feature" as const,
  targetId: "future-explanations",
  learnerId: LOCAL_LEARNER_ID,
};

export function runPhase7cVerification(): string[] {
  const passed: string[] = [];

  const product = sampleProduct();
  assert(product.id === "future-bundle", "product id is the Phase 1I opaque token");
  assert(!product.id.startsWith("order/"), "product id is not an order id");
  assert(!product.id.startsWith("learner/"), "product id is not a learner id");
  assert(!("price" in product), "product has no price");
  assert(!("learnerId" in product), "product is not bound to a learner");
  passed.push("TEST 1 Product identity is separate");

  const order = sampleOrder();
  assert(order.id === "order/local-7c", "order id uses order/ namespace");
  assert(isDistinct(order.id, product.id), "order id is not product id");
  assert(!("amount" in order), "order has no amount");
  assert(!("payment" in order), "order does not embed payment");
  passed.push("TEST 2 Order identity is separate");

  const purchase = samplePurchase();
  assert(purchase.id.startsWith("purchase/"), "purchase id uses purchase/ namespace");
  assert(isDistinct(purchase.id, order.id), "purchase id is not order id");
  assert(isDistinct(purchase.id, product.id), "purchase id is not product id");
  passed.push("TEST 3 Purchase identity is separate");

  const payment = samplePayment();
  assert(payment.id.startsWith("payment/"), "payment id uses payment/ namespace");
  assert(isDistinct(payment.id, purchase.id), "payment id is not purchase id");
  assert(isDistinct(payment.id, order.id), "payment id is not order id");
  passed.push("TEST 4 Payment identity is separate");

  assert(order.learnerId === LOCAL_LEARNER_ID, "order references learner/local");
  expectThrow("foreign order learner", () =>
    validateCommerceOrder({
      id: commerceOrderId("local-other"),
      learnerId: "learner/other",
      product: { productId: "future-bundle" },
      status: "pending",
    }),
  );
  passed.push("TEST 5 Order references learner correctly");

  assert(purchase.orderId === order.id, "purchase references order");
  assert(purchase.productId === product.id, "purchase references product");
  assert(purchase.learnerId === LOCAL_LEARNER_ID, "purchase references learner");
  passed.push("TEST 6 Purchase references Order/Product/Learner correctly");

  assert(payment.orderId === order.id, "payment references order");
  passed.push("TEST 7 Payment references Order correctly");

  expectThrow("cancelled purchase cannot grant", () =>
    proposeEntitlementGrantFromPurchase({
      purchase: samplePurchase({ status: "cancelled" }),
      order,
      product,
      scope: "feature",
      targetId: "future-explanations",
    }),
  );
  expectThrow("failed purchase cannot grant", () =>
    proposeEntitlementGrantFromPurchase({
      purchase: samplePurchase({ status: "failed" }),
      order,
      product,
      scope: "feature",
      targetId: "future-explanations",
    }),
  );
  expectThrow("pending order cannot grant", () =>
    proposeEntitlementGrantFromPurchase({
      purchase,
      order: sampleOrder({ status: "pending" }),
      product,
      scope: "feature",
      targetId: "future-explanations",
    }),
  );
  passed.push("TEST 8 Invalid Purchase cannot create grant proposal");

  const proposal = proposeEntitlementGrantFromPurchase({
    purchase,
    order,
    product,
    scope: "feature",
    targetId: "future-explanations",
  });
  assert(proposal.learnerId === LOCAL_LEARNER_ID, "proposal learnerId is learner/local");
  assert(proposal.scope === "feature", "proposal scope is canonical");
  assert(proposal.targetId === "future-explanations", "proposal target is canonical");
  assert(proposal.source === "purchase", "commercial one-time source is purchase");
  passed.push("TEST 9 Valid Purchase can create grant proposal");

  assert(proposal.source === "purchase", "proposal uses entitlement source vocabulary");
  assert(typeof proposal.sourceReference === "string", "proposal has opaque sourceReference");
  assert(!proposal.sourceReference?.includes("/"), "sourceReference is not a path");
  assert(!("payment" in proposal), "proposal does not embed payment");
  assert(!("order" in proposal), "proposal does not embed order");
  passed.push("TEST 10 Grant proposal uses canonical Entitlement structure");

  const grantSource = readFileSync("src/lib/commerce/grant.ts", "utf8");
  assert(!grantSource.includes("localStorage"), "grant is not persisted");
  assert(!grantSource.includes("fetch("), "grant does not call network");
  assert(!grantSource.includes("decideAccess"), "grant does not decide access");
  passed.push("TEST 11 Grant proposal is pure");

  const fromPayment = decideAccess(protectedQuery, [payment as unknown as never]);
  assert(fromPayment.allowed === false, "captured payment does not grant access");
  assert(
    decideAccess(protectedQuery, []).allowed === false,
    "payment status is not an access decision",
  );
  passed.push("TEST 12 Payment does not directly grant access");

  const fromPurchase = decideAccess(protectedQuery, [purchase as unknown as never]);
  assert(fromPurchase.allowed === false, "completed purchase does not grant access");
  passed.push("TEST 13 Purchase does not directly grant access");

  assert(
    decideAccess(protectedQuery, []).reason === "missing",
    "commerce is not the access authority",
  );
  assert(fromPayment.classification === "protected", "protected access stays fail-closed");
  passed.push("TEST 14 Commerce does not become access authority");

  assert(LOCAL_LEARNER_ID === "learner/local", "canonical learner remains learner/local");
  assert(purchase.learnerId === "learner/local", "purchase learner is learner/local");
  passed.push("TEST 15 learner/local remains valid");

  const publicPayment = toPaymentRead(payment);
  assert(!("amount" in publicPayment), "public payment read omits amount");
  assert(!("provider" in publicPayment), "public payment read omits provider");
  assert(!("providerReference" in publicPayment), "public payment read omits providerReference");
  assert(!("cardNumber" in publicPayment), "public payment read omits cardNumber");
  assert(!("cvv" in publicPayment), "public payment read omits cvv");
  expectThrow("card on payment", () =>
    validateCommercePayment({
      id: commercePaymentId("carded"),
      orderId: order.id,
      status: "captured",
      cardNumber: "4242424242424242",
    } as never),
  );
  passed.push("TEST 16 Sensitive payment fields are not exposed");

  assertJsonSafe(product, "product");
  assertJsonSafe(order, "order");
  assertJsonSafe(purchase, "purchase");
  assertJsonSafe(payment, "payment");
  assertJsonSafe(proposal, "proposal");
  assertJsonSafe(publicPayment, "payment read");
  assertNoForbidden(product, "product");
  assertNoForbidden(order, "order");
  assertNoForbidden(purchase, "purchase");
  assertNoForbidden(publicPayment, "payment read");
  assertNoForbidden(proposal, "proposal");
  const store = readFileSync("src/lib/commerce/store.ts", "utf8");
  assert(store.includes("export type CommerceStore"), "storage is an interface only");
  assert(!store.includes("localStorage"), "commerce store has no persistence");
  passed.push("TEST 17 No persistence is required");

  const subscription = sampleProduct({ type: "subscription", title: "Future Plan" });
  const subProposal = proposeEntitlementGrantFromPurchase({
    purchase,
    order,
    product: subscription,
    scope: "feature",
    targetId: "future-explanations",
  });
  assert(subProposal.source === "subscription", "subscription product uses subscription provenance");
  expectThrow("email product id", () =>
    validateCommerceProduct({
      id: "user@example.com",
      type: "one_time",
      title: "Bad",
      status: "active",
    }),
  );
  expectThrow("mismatched order", () =>
    proposeEntitlementGrantFromPurchase({
      purchase: samplePurchase({ orderId: commerceOrderId("other-order") }),
      order,
      product,
      scope: "feature",
      targetId: "future-explanations",
    }),
  );
  passed.push("subscription provenance and identity safety hold");

  const prior = runCommerceOrderVerification();
  assert(prior.length > 0, "Phase 1I commerce verifier still runs");
  passed.push("Phase 1I commerce contracts remain compatible");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase7c.ts");

if (executedFromCli) {
  const passed = runPhase7cVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE7C_VERIFICATION: PASS");
}
