/**
 * In-memory local learner record. Not server cache and not persistence.
 * Web storage remains src/store/learner/. This layer does not upload.
 */

import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { emptyLearnerIntelligenceState } from "@/lib/learner-intelligence/derive";
import type { LearnerIntelligenceState } from "@/lib/learner-intelligence/types";
import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";
import { CLIENT_LOCAL_STORE_KIND } from "./types";

export type ClientLocalLearnerRecord = {
  kind: typeof CLIENT_LOCAL_STORE_KIND;
  learnerId: typeof LOCAL_LEARNER_ID;
  completedTopicIds: readonly string[];
  intelligence: LearnerIntelligenceState;
};

export function emptyClientLocalLearner(): ClientLocalLearnerRecord {
  return {
    kind: CLIENT_LOCAL_STORE_KIND,
    learnerId: LOCAL_LEARNER_ID,
    completedTopicIds: [],
    intelligence: emptyLearnerIntelligenceState(),
  };
}

export function clientLocalLearnerWrite(
  current: ClientLocalLearnerRecord,
  input: {
    learnerId?: string;
    completedTopicIds?: readonly string[];
    intelligence?: LearnerIntelligenceState;
  },
): PlatformReadResult<ClientLocalLearnerRecord> {
  const learnerId = input.learnerId ?? current.learnerId;
  if (learnerId !== LOCAL_LEARNER_ID) {
    return platformFailure("invalid_request", "learnerId must be learner/local");
  }
  if (input.intelligence !== undefined && input.intelligence.learnerId !== LOCAL_LEARNER_ID) {
    return platformFailure("invalid_request", "learnerId must be learner/local");
  }
  return platformSuccess({
    kind: CLIENT_LOCAL_STORE_KIND,
    learnerId: LOCAL_LEARNER_ID,
    completedTopicIds: input.completedTopicIds ?? current.completedTopicIds,
    intelligence: input.intelligence ?? current.intelligence,
  });
}
