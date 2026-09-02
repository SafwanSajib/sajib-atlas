/**
 * Commerce foundation (Phase 1I / 7C).
 *
 * Product → Order → Purchase → Entitlement proposal.
 * Payment supports orders and never grants access.
 */

export { proposeEntitlementGrantFromPurchase } from "./grant";
export type { PurchaseGrantInput } from "./grant";
export {
  commerceOrderId,
  commercePaymentId,
  commerceProductId,
  commercePurchaseId,
} from "./identity";
export { toOrderRead, toPaymentRead, toProductRead, toPurchaseRead } from "./read";
export type { CommerceStore } from "./store";
export {
  COMMERCE_ORDER_STATUSES,
  COMMERCE_PAYMENT_STATUSES,
  COMMERCE_PRODUCT_STATUSES,
  COMMERCE_PRODUCT_TYPES,
  COMMERCE_PURCHASE_STATUSES,
  FORBIDDEN_COMMERCE_FIELDS,
} from "./types";
export type {
  CommerceOrder,
  CommerceOrderStatus,
  CommercePayment,
  CommercePaymentRead,
  CommercePaymentStatus,
  CommerceProduct,
  CommerceProductRef,
  CommerceProductStatus,
  CommerceProductType,
  CommercePurchase,
  CommercePurchaseStatus,
} from "./types";
export {
  validateCommerceOrder,
  validateCommercePayment,
  validateCommerceProduct,
  validateCommercePurchase,
} from "./validate";
