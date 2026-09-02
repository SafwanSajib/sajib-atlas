import { isLocalLearnerId } from "@/lib/learner/identity";
import {
  commerceOrderId,
  commercePaymentId,
  commerceProductId,
  commercePurchaseId,
} from "./identity";
import {
  COMMERCE_ORDER_STATUSES,
  COMMERCE_PAYMENT_STATUSES,
  COMMERCE_PRODUCT_STATUSES,
  COMMERCE_PRODUCT_TYPES,
  COMMERCE_PURCHASE_STATUSES,
  FORBIDDEN_COMMERCE_FIELDS,
  type CommerceOrder,
  type CommerceOrderStatus,
  type CommercePayment,
  type CommercePaymentStatus,
  type CommerceProduct,
  type CommerceProductStatus,
  type CommerceProductType,
  type CommercePurchase,
  type CommercePurchaseStatus,
} from "./types";

function fail(message: string): never {
  throw new Error(`Commerce: ${message}`);
}

const ISO_DATE_TIME_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const OPAQUE_ID = /^[a-z][a-z0-9-]*$/;
const BANNED_ORDER_KEYS = [
  "amount",
  "currency",
  "price",
  "card",
  "cvv",
  "iban",
  "token",
  "stripe",
  "sslcommerz",
  "bkash",
  "nagad",
  "invoice",
  "transaction",
  "entitlement",
];

function isOrderStatus(value: string): value is CommerceOrderStatus {
  for (const status of COMMERCE_ORDER_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function isIsoDateTimeUtc(value: string): boolean {
  if (!ISO_DATE_TIME_UTC.test(value)) return false;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  const iso = new Date(ms).toISOString();
  if (iso === value) return true;
  if (value.endsWith("Z") && !value.includes(".")) {
    return iso === `${value.slice(0, -1)}.000Z`;
  }
  return false;
}

function assertOptionalTimestamp(value: string | undefined, label: string): void {
  if (value === undefined) return;
  if (!value.trim() || !isIsoDateTimeUtc(value)) fail(`invalid ${label}`);
}

export function validateCommerceOrder(input: {
  id: string;
  learnerId?: string;
  product: { productId: string };
  status: string;
  createdAt?: string;
  updatedAt?: string;
}): CommerceOrder {
  if (!input.id?.trim()) fail("empty order id");
  if (!input.id.startsWith("order/")) fail("order id must start with order/");
  const opaque = input.id.slice("order/".length);
  if (!OPAQUE_ID.test(opaque)) fail(`malformed order id ${input.id}`);
  if (input.id !== commerceOrderId(opaque)) fail(`order id must equal ${commerceOrderId(opaque)}`);
  if (input.id.startsWith("entitlement/")) fail("order id must not be an entitlement id");

  if (!isOrderStatus(input.status)) fail(`invalid order status ${input.status}`);

  if (!input.product?.productId?.trim()) fail("empty productId");
  if (!OPAQUE_ID.test(input.product.productId)) {
    fail(`malformed productId ${input.product.productId}`);
  }
  if (input.product.productId.includes("/")) {
    fail("productId must not be a canonical knowledge id");
  }

  for (const key of Object.keys(input)) {
    const normalized = key.toLowerCase();
    for (const banned of BANNED_ORDER_KEYS) {
      if (normalized.includes(banned)) fail(`order must not include ${key}`);
    }
  }

  const order: CommerceOrder = {
    id: input.id,
    product: { productId: input.product.productId },
    status: input.status,
  };

  if (input.learnerId !== undefined) {
    if (!isLocalLearnerId(input.learnerId)) {
      fail(`unsupported learnerId ${input.learnerId}`);
    }
    order.learnerId = input.learnerId;
  }

  assertOptionalTimestamp(input.createdAt, "createdAt");
  assertOptionalTimestamp(input.updatedAt, "updatedAt");
  if (input.createdAt !== undefined && input.updatedAt !== undefined) {
    if (Date.parse(input.updatedAt) < Date.parse(input.createdAt)) {
      fail("updatedAt must not precede createdAt");
    }
  }
  if (input.createdAt !== undefined) order.createdAt = input.createdAt;
  if (input.updatedAt !== undefined) order.updatedAt = input.updatedAt;

  return order;
}

function isProductType(value: string): value is CommerceProductType {
  for (const type of COMMERCE_PRODUCT_TYPES) {
    if (type === value) return true;
  }
  return false;
}

function isProductStatus(value: string): value is CommerceProductStatus {
  for (const status of COMMERCE_PRODUCT_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function isPurchaseStatus(value: string): value is CommercePurchaseStatus {
  for (const status of COMMERCE_PURCHASE_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function isPaymentStatus(value: string): value is CommercePaymentStatus {
  for (const status of COMMERCE_PAYMENT_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function rejectForbiddenKeys(input: object, label: string): void {
  for (const key of Object.keys(input)) {
    const normalized = key.toLowerCase();
    for (const banned of FORBIDDEN_COMMERCE_FIELDS) {
      if (normalized === banned.toLowerCase() || normalized.includes(banned.toLowerCase())) {
        fail(`${label} must not include ${key}`);
      }
    }
  }
}

function assertOpaqueProductId(productId: string): void {
  if (!productId?.trim()) fail("empty productId");
  if (!OPAQUE_ID.test(productId)) fail(`malformed productId ${productId}`);
  if (productId.includes("/")) fail("productId must not be a canonical knowledge id");
  if (productId.includes("@")) fail("productId must not be an email");
  if (productId.startsWith("learner")) fail("productId must not be a learner id");
  if (productId.startsWith("order")) fail("productId must not be an order id");
  if (productId.startsWith("payment")) fail("productId must not be a payment id");
  if (productId.startsWith("entitlement")) fail("productId must not be an entitlement id");
}

export function validateCommerceProduct(input: {
  id: string;
  type: string;
  title: string;
  status: string;
  metadata?: { readonly [key: string]: string | number | boolean };
}): CommerceProduct {
  if (!input || typeof input !== "object") fail("product must be an object");
  rejectForbiddenKeys(input, "product");
  assertOpaqueProductId(input.id);
  if (commerceProductId(input.id) !== input.id) fail("product id must equal opaque product token");
  if (!isProductType(input.type)) fail(`invalid product type ${input.type}`);
  if (!isProductStatus(input.status)) fail(`invalid product status ${input.status}`);
  if (!input.title?.trim()) fail("empty product title");
  if (input.title.includes("@")) fail("product title must not be an email");

  const product: CommerceProduct = {
    id: input.id,
    type: input.type,
    title: input.title.trim(),
    status: input.status,
  };

  if (input.metadata !== undefined) {
    if (!input.metadata || typeof input.metadata !== "object" || Array.isArray(input.metadata)) {
      fail("product metadata must be a primitive object");
    }
    const metadata: { [key: string]: string | number | boolean } = {};
    for (const [key, value] of Object.entries(input.metadata)) {
      const lower = key.toLowerCase();
      if (lower.includes("email") || lower.includes("password") || lower.includes("token")) {
        fail(`product metadata must not include ${key}`);
      }
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        fail("product metadata values must be primitives");
      }
      metadata[key] = value;
    }
    product.metadata = metadata;
  }

  return product;
}

export function validateCommercePurchase(input: {
  id: string;
  orderId: string;
  learnerId: string;
  productId: string;
  status: string;
  purchasedAt?: string;
}): CommercePurchase {
  if (!input || typeof input !== "object") fail("purchase must be an object");
  rejectForbiddenKeys(input, "purchase");
  if (!input.id?.trim()) fail("empty purchase id");
  if (!input.id.startsWith("purchase/")) fail("purchase id must start with purchase/");
  const opaque = input.id.slice("purchase/".length);
  if (!OPAQUE_ID.test(opaque)) fail(`malformed purchase id ${input.id}`);
  if (input.id !== commercePurchaseId(opaque)) fail(`purchase id must equal ${commercePurchaseId(opaque)}`);
  if (!isPurchaseStatus(input.status)) fail(`invalid purchase status ${input.status}`);
  if (!isLocalLearnerId(input.learnerId)) fail(`unsupported learnerId ${input.learnerId}`);
  if (!input.orderId?.startsWith("order/")) fail("purchase orderId must be an order id");
  const orderOpaque = input.orderId.slice("order/".length);
  if (!OPAQUE_ID.test(orderOpaque)) fail(`malformed purchase orderId ${input.orderId}`);
  assertOpaqueProductId(input.productId);

  const purchase: CommercePurchase = {
    id: input.id,
    orderId: input.orderId,
    learnerId: input.learnerId,
    productId: input.productId,
    status: input.status,
  };
  assertOptionalTimestamp(input.purchasedAt, "purchasedAt");
  if (input.purchasedAt !== undefined) purchase.purchasedAt = input.purchasedAt;
  return purchase;
}

export function validateCommercePayment(input: {
  id: string;
  orderId: string;
  status: string;
  provider?: string;
  providerReference?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
}): CommercePayment {
  if (!input || typeof input !== "object") fail("payment must be an object");
  rejectForbiddenKeys(input, "payment");
  if (!input.id?.trim()) fail("empty payment id");
  if (!input.id.startsWith("payment/")) fail("payment id must start with payment/");
  const opaque = input.id.slice("payment/".length);
  if (!OPAQUE_ID.test(opaque)) fail(`malformed payment id ${input.id}`);
  if (input.id !== commercePaymentId(opaque)) fail(`payment id must equal ${commercePaymentId(opaque)}`);
  if (!isPaymentStatus(input.status)) fail(`invalid payment status ${input.status}`);
  if (!input.orderId?.startsWith("order/")) fail("payment orderId must be an order id");
  const orderOpaque = input.orderId.slice("order/".length);
  if (!OPAQUE_ID.test(orderOpaque)) fail(`malformed payment orderId ${input.orderId}`);

  const payment: CommercePayment = {
    id: input.id,
    orderId: input.orderId,
    status: input.status,
  };

  if (input.provider !== undefined) {
    if (!OPAQUE_ID.test(input.provider)) fail("invalid payment provider");
    payment.provider = input.provider;
  }
  if (input.providerReference !== undefined) {
    if (!OPAQUE_ID.test(input.providerReference)) fail("invalid providerReference");
    if (input.providerReference.includes("@") || input.providerReference.includes(".")) {
      fail("providerReference must be opaque");
    }
    payment.providerReference = input.providerReference;
  }
  if (input.amount !== undefined) {
    if (!Number.isInteger(input.amount) || input.amount < 0) fail("invalid payment amount");
    payment.amount = input.amount;
  }
  if (input.currency !== undefined) {
    if (!/^[A-Z]{3}$/.test(input.currency)) fail("invalid payment currency");
    payment.currency = input.currency;
  }
  if ((input.amount !== undefined) !== (input.currency !== undefined)) {
    fail("amount and currency must be supplied together");
  }
  assertOptionalTimestamp(input.createdAt, "createdAt");
  if (input.createdAt !== undefined) payment.createdAt = input.createdAt;
  return payment;
}
