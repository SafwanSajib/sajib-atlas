/**
 * Web client integration (Phase 9D).
 *
 * Web surface over the shared client adapter. Legacy navbar search stays
 * search-data. Geography study/MCQ stay in-process. Not Android/iOS.
 */

import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import type { LearnerIntelligenceState } from "@/lib/learner-intelligence/types";
import { searchTopics } from "@/lib/search-data";
import { createClientRequest, createClientRequestHeaders } from "./request";
import { clientLocalLearnerWrite, emptyClientLocalLearner, type ClientLocalLearnerRecord } from "./local";
import { clientStateWriteLocal, createClientState, type ClientState } from "./session";

export const WEB_CLIENT_SURFACE = "web" as const;

/** Navbar search. Same title/slug substring behavior as search-data. */
export const webSearchTopics = searchTopics;

export function createWebClientHeaders(requestId?: string): Record<string, string> {
  return createClientRequestHeaders({
    surface: WEB_CLIENT_SURFACE,
    ...(requestId !== undefined ? { requestId } : {}),
  });
}

export function createWebClientRequest(url: string, requestId?: string): Request {
  return createClientRequest({
    surface: WEB_CLIENT_SURFACE,
    url,
    ...(requestId !== undefined ? { requestId } : {}),
  });
}

export function createWebClientState(online: boolean = true): ClientState {
  return createClientState(online);
}

export function projectWebLearnerToClient(input: {
  completedTopics?: readonly string[];
  intelligence?: LearnerIntelligenceState;
}): ClientLocalLearnerRecord {
  const written = clientLocalLearnerWrite(emptyClientLocalLearner(), {
    learnerId: LOCAL_LEARNER_ID,
    completedTopicIds: input.completedTopics ?? [],
    ...(input.intelligence !== undefined ? { intelligence: input.intelligence } : {}),
  });
  if (!written.success) return emptyClientLocalLearner();
  return written.data;
}

export function applyWebLearnerToClientState(
  state: ClientState,
  input: {
    completedTopics?: readonly string[];
    intelligence?: LearnerIntelligenceState;
  },
): ClientState {
  const written = clientStateWriteLocal(state, {
    learnerId: LOCAL_LEARNER_ID,
    completedTopicIds: input.completedTopics ?? [],
    ...(input.intelligence !== undefined ? { intelligence: input.intelligence } : {}),
  });
  return written.success ? written.data : state;
}
