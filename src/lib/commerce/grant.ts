/**
 * Purchase → entitlement grant proposal (Phase 7C).
 *
 * Product → Order → Purchase → EntitlementGrantProposal → Entitlement → Access
 *
 * Pure transformation. Does not persist, process payment, authenticate,
 * mutate learner state, or decide access.
 */

import { proposeEntitlementGrant } from "@/lib/entitlement/grant";
import type { EntitlementGrantProposal, EntitlementScope, EntitlementSource } from "@/lib/entitlement/types";
import { opaqueFromNamespacedId } from "./identity";
import type { CommerceOrder, CommerceProduct, CommercePurchase } from "./types";
import { validateCommerceOrder, validateCommerceProduct, validateCommercePurchase } from "./validate";

function fail(message: string): never {
  throw new Error(`Commerce grant: ${message}`);
}

export type PurchaseGrantInput = {
  purchase: CommercePurchase;
  order: CommerceOrder;
  product: CommerceProduct;
  scope: EntitlementScope;
  targetId: string;
  startsAt?: string;
  expiresAt?: string;
};

/**
 * Only a completed purchase of a confirmed order for an active product
 * can propose an entitlement. Payment is not an input.
 */
export function proposeEntitlementGrantFromPurchase(
  input: PurchaseGrantInput,
): EntitlementGrantProposal {
  if (!input || typeof input !== "object") fail("grant input must be an object");

  const purchase = validateCommercePurchase(input.purchase);
  const order = validateCommerceOrder(input.order);
  const product = validateCommerceProduct(input.product);

  if (purchase.status !== "completed") fail("purchase must be completed");
  if (order.status !== "confirmed") fail("order must be confirmed");
  if (product.status !== "active") fail("product must be active");
  if (purchase.orderId !== order.id) fail("purchase.orderId must equal order.id");
  if (purchase.productId !== product.id) fail("purchase.productId must equal product.id");
  if (order.product.productId !== product.id) fail("order product must equal product.id");
  if (order.learnerId !== undefined && order.learnerId !== purchase.learnerId) {
    fail("order learnerId must equal purchase learnerId");
  }

  const source: EntitlementSource = product.type === "subscription" ? "subscription" : "purchase";
  const sourceReference = `purchase-${opaqueFromNamespacedId(purchase.id, "purchase")}`;

  return proposeEntitlementGrant({
    learnerId: purchase.learnerId,
    scope: input.scope,
    targetId: input.targetId,
    source,
    sourceReference,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
  });
}
