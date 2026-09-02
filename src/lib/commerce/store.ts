/**
 * Commerce storage interface only. No persistence in Phase 7C.
 */

import type { CommerceOrder, CommercePayment, CommerceProduct, CommercePurchase } from "./types";

export type CommerceStore = {
  getProduct(id: string): CommerceProduct | undefined;
  getOrder(id: string): CommerceOrder | undefined;
  getPurchase(id: string): CommercePurchase | undefined;
  getPayment(id: string): CommercePayment | undefined;
};
