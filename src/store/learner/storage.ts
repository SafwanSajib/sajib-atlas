import { parseLearnerIntelligenceState } from "@/lib/learner-intelligence/adapter";
import type { LearnerState, MCQResult } from "./types";
import { normalizeCompletedTopicIds } from "./completion";

const STORAGE_KEY = "sajib_atlas_learner_state";

function emptyLearnerState(): LearnerState {
  return { mcqResults: [], completedTopics: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMCQResult(value: unknown): value is MCQResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.topicSlug === "string" &&
    typeof value.correct === "boolean" &&
    typeof value.timestamp === "number"
  );
}

export function parseLearnerState(raw: string | null): LearnerState {
  if (!raw) return emptyLearnerState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyLearnerState();

    const mcqResults = Array.isArray(parsed.mcqResults)
      ? parsed.mcqResults.filter(isMCQResult)
      : [];
    const completedTopics = Array.isArray(parsed.completedTopics)
      ? parsed.completedTopics.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [];

    const intelligence = parseLearnerIntelligenceState(parsed.intelligence);
    return {
      mcqResults,
      completedTopics: normalizeCompletedTopicIds(completedTopics),
      ...(intelligence !== undefined ? { intelligence } : {}),
    };
  } catch {
    return emptyLearnerState();
  }
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode, disabled storage, or quota — in-memory state still updates.
  }
}

export const getLearnerState = (): LearnerState => {
  return parseLearnerState(readRaw());
};

export const saveLearnerState = (state: LearnerState) => {
  writeRaw(JSON.stringify(state));
};
