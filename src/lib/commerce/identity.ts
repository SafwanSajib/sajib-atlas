/**
 * Commerce identity helpers (Phase 1I / 7C).
 *
 * Product ids follow Phase 1I: opaque tokens, not `product/` paths.
 * Order / purchase / payment ids are namespaced and are not derived from
 * learner, topic, entitlement, or provider identifiers.
 */

export function commerceProductId(opaque: string): string {
  return opaque;
}

export function commerceOrderId(opaque: string): string {
  return `order/${opaque}`;
}

export function commercePurchaseId(opaque: string): string {
  return `purchase/${opaque}`;
}

export function commercePaymentId(opaque: string): string {
  return `payment/${opaque}`;
}

export function opaqueFromNamespacedId(id: string, namespace: string): string {
  const prefix = `${namespace}/`;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}
