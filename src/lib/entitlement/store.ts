/**
 * Entitlement storage interface only. No persistence in Phase 7B.
 */

import type { Entitlement } from "./types";

export type EntitlementStore = {
  listForLearner(learnerId: string): readonly Entitlement[];
};
