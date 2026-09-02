/**
 * Learner Intelligence read. Derives from local state input.
 * Does not persist, ingest, or change learner/local.
 */

import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import {
  deriveLearnerIntelligenceSnapshot,
  emptyLearnerIntelligenceState,
} from "@/lib/learner-intelligence/derive";
import type {
  LearnerIntelligenceSnapshot,
  LearnerIntelligenceState,
} from "@/lib/learner-intelligence/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";

export function clientReadLearnerIntelligence(
  state: LearnerIntelligenceState = emptyLearnerIntelligenceState(),
  completedTopicIds: readonly string[] = [],
): PlatformReadResult<LearnerIntelligenceSnapshot> {
  if (!state || state.learnerId !== LOCAL_LEARNER_ID) {
    return platformFailure("invalid_request", "learnerId must be learner/local");
  }
  return platformSuccess(deriveLearnerIntelligenceSnapshot(state, completedTopicIds));
}
