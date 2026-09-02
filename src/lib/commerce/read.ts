/**
 * Public commerce read contracts. JSON-safe. No secrets or card data.
 */

import type {
  CommerceOrder,
  CommercePayment,
  CommercePaymentRead,
  CommerceProduct,
  CommercePurchase,
} from "./types";
import {
  validateCommerceOrder,
  validateCommercePayment,
  validateCommerceProduct,
  validateCommercePurchase,
} from "./validate";

export function toProductRead(product: CommerceProduct): CommerceProduct {
  return validateCommerceProduct(product);
}

export function toOrderRead(order: CommerceOrder): CommerceOrder {
  return validateCommerceOrder(order);
}

export function toPurchaseRead(purchase: CommercePurchase): CommercePurchase {
  return validateCommercePurchase(purchase);
}

export function toPaymentRead(payment: CommercePayment): CommercePaymentRead {
  const validated = validateCommercePayment(payment);
  const read: CommercePaymentRead = {
    id: validated.id,
    orderId: validated.orderId,
    status: validated.status,
  };
  if (validated.createdAt !== undefined) read.createdAt = validated.createdAt;
  return read;
}
