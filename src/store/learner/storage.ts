import { LearnerState } from "./types";

const STORAGE_KEY = "sajib_atlas_learner_state";

export const getLearnerState = (): LearnerState => {
  if (typeof window === "undefined") return { mcqResults: [], completedTopics: [] };
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : { mcqResults: [], completedTopics: [] };
};

export const saveLearnerState = (state: LearnerState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

