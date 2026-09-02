import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import { searchTopics } from "@/lib/search-data";
import { parseLearnerState } from "@/store/learner/storage";
import { commerceOrderId } from "./identity";
import { validateCommerceOrder } from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Commerce order verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Commerce order verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
}

export function runCommerceOrderVerification(): string[] {
  const passed: string[] = [];

  const order = validateCommerceOrder({
    id: commerceOrderId("local-sample"),
    learnerId: LOCAL_LEARNER_ID,
    product: { productId: "future-bundle" },
    status: "pending",
    createdAt: "2026-09-02T12:00:00.000Z",
  });
  assert(order.id === "order/local-sample", "order id is namespaced and opaque");
  assert(order.id.startsWith("order/"), "order id uses the order namespace");
  assert(!order.id.startsWith("entitlement/"), "order id is not an entitlement id");
  assert(!order.id.startsWith("geography/"), "order id is not a topic id");
  assert(order.product.productId === "future-bundle", "product is a reference only");
  assert(order.status === "pending", "pending is a valid order status");
  assert(!("amount" in order), "order has no amount");
  assert(!("currency" in order), "order has no currency");
  assert(!("payment" in order), "order has no payment object");
  assert(!("entitlement" in order), "order does not embed an entitlement");
  assertJsonSafe(order, "commerce order");
  passed.push("order identity is separate from entitlement, payment, and topic ids");

  const confirmed = validateCommerceOrder({
    id: commerceOrderId("local-confirmed"),
    product: { productId: "future-bundle" },
    status: "confirmed",
    createdAt: "2026-09-02T12:00:00.000Z",
    updatedAt: "2026-09-02T12:05:00.000Z",
  });
  assert(confirmed.status === "confirmed", "confirmed is not a payment status");
  passed.push("order lifecycle does not include paid");

  const free = decideAccess({ scope: "topic", targetId: "geography/earths-rotation" }, []);
  assert(free.allowed === true && free.reason === "free", "catalog access is unchanged by orders");
  passed.push("orders do not grant entitlement or change access decisions");

  expectThrow("empty id", () =>
    validateCommerceOrder({
      id: "  ",
      product: { productId: "future-bundle" },
      status: "pending",
    }),
  );
  expectThrow("topic id as order id", () =>
    validateCommerceOrder({
      id: "geography/earths-rotation",
      product: { productId: "future-bundle" },
      status: "pending",
    }),
  );
  expectThrow("paid status", () =>
    validateCommerceOrder({
      id: commerceOrderId("local-paid"),
      product: { productId: "future-bundle" },
      status: "paid",
    }),
  );
  expectThrow("knowledge id as productId", () =>
    validateCommerceOrder({
      id: commerceOrderId("local-topic-product"),
      product: { productId: "geography/earths-rotation" },
      status: "pending",
    }),
  );
  expectThrow("foreign learner", () =>
    validateCommerceOrder({
      id: commerceOrderId("local-other"),
      learnerId: "learner/other",
      product: { productId: "future-bundle" },
      status: "pending",
    }),
  );
  expectThrow("updated before created", () =>
    validateCommerceOrder({
      id: commerceOrderId("local-dates"),
      product: { productId: "future-bundle" },
      status: "pending",
      createdAt: "2026-09-02T12:05:00.000Z",
      updatedAt: "2026-09-02T12:00:00.000Z",
    }),
  );
  passed.push("validation rejects paid status, domain ids, and malformed records");

  const persisted = parseLearnerState(
    JSON.stringify({ mcqResults: [], completedTopics: ["geography/earths-rotation"] }),
  );
  assert(!("orders" in persisted), "completion state does not include orders");
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
  process.argv[1].replace(/\\/g, "/").endsWith("verify-commerce.ts");

if (executedFromCli) {
  const passed = runCommerceOrderVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("COMMERCE_ORDER_VERIFICATION: PASS");
}
