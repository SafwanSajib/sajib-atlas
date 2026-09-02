/**
 * Commerce foundation (Phase 1I / 7C).
 *
 * Product → Order → Purchase → Entitlement → Access
 * Order → Payment (supports the order; never grants access)
 *
 * JSON-safe primitives only. No Date, Map, functions, card data, or secrets.
 */

export const COMMERCE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "failed",
] as const;
export type CommerceOrderStatus = (typeof COMMERCE_ORDER_STATUSES)[number];

export const COMMERCE_PRODUCT_TYPES = ["one_time", "subscription"] as const;
export type CommerceProductType = (typeof COMMERCE_PRODUCT_TYPES)[number];

export const COMMERCE_PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type CommerceProductStatus = (typeof COMMERCE_PRODUCT_STATUSES)[number];

export const COMMERCE_PURCHASE_STATUSES = ["completed", "cancelled", "failed"] as const;
export type CommercePurchaseStatus = (typeof COMMERCE_PURCHASE_STATUSES)[number];

export const COMMERCE_PAYMENT_STATUSES = [
  "initiated",
  "authorized",
  "captured",
  "failed",
  "cancelled",
  "refunded",
] as const;
export type CommercePaymentStatus = (typeof COMMERCE_PAYMENT_STATUSES)[number];

/**
 * Reference to a product. productId is opaque and is not a topic,
 * entitlement, payment, or learner id.
 */
export type CommerceProductRef = {
  productId: string;
};

/**
 * Commercial offer identity. No price and no learner binding.
 * Subscription type is structural; recurring billing is not implemented.
 */
export type CommerceProduct = {
  id: string;
  type: CommerceProductType;
  title: string;
  status: CommerceProductStatus;
  metadata?: { readonly [key: string]: string | number | boolean };
};

/**
 * Commercial intent/container. Not a purchase, payment, or entitlement.
 * Phase 1I: no amount, currency, or price on the order.
 */
export type CommerceOrder = {
  id: string;
  learnerId?: string;
  product: CommerceProductRef;
  status: CommerceOrderStatus;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Successful acquisition record. Not an order and not an access grant.
 */
export type CommercePurchase = {
  id: string;
  orderId: string;
  learnerId: string;
  productId: string;
  status: CommercePurchaseStatus;
  purchasedAt?: string;
};

/**
 * Payment-processing record. Supports an order. Never grants access.
 */
export type CommercePayment = {
  id: string;
  orderId: string;
  status: CommercePaymentStatus;
  provider?: string;
  providerReference?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
};

/** Public payment read. Omits provider internals, amounts, and secrets. */
export type CommercePaymentRead = {
  id: string;
  orderId: string;
  status: CommercePaymentStatus;
  createdAt?: string;
};

export const FORBIDDEN_COMMERCE_FIELDS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "credential",
  "privateKey",
  "cardNumber",
  "cvv",
  "rawPaymentPayload",
  "rawProviderResponse",
  "internalPath",
  "filesystemPath",
  "providerPayload",
] as const;
