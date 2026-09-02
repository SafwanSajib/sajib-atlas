"use client";

import { createContext, useContext, useState } from "react";
import type { LearnerState, MCQResult } from "./types";
import { getLearnerState, saveLearnerState } from "./storage";
import { hasCompletionEntry } from "./completion";
import {
  getCanonicalTopic,
  getCanonicalTopicBySlug,
} from "@/lib/content/manifest";

type LearnerContextType = {
  state: LearnerState;
  addMCQResult: (result: MCQResult) => void;
  markTopicComplete: (topicId: string) => void;
};

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

function resolveCanonicalId(topicId: string): string {
  return (
    getCanonicalTopic(topicId)?.id ??
    getCanonicalTopicBySlug(topicId)?.id ??
    topicId
  );
}

export const LearnerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<LearnerState>(() => {
    if (typeof window === "undefined") return { mcqResults: [], completedTopics: [] };
    return getLearnerState();
  });

  const addMCQResult = (result: MCQResult) => {
    setState((current) => {
      const newState = { ...current, mcqResults: [...current.mcqResults, result] };
      saveLearnerState(newState);
      return newState;
    });
  };

  const markTopicComplete = (topicId: string) => {
    setState((current) => {
      if (hasCompletionEntry(current, topicId)) return current;
      const canonicalId = resolveCanonicalId(topicId);
      if (hasCompletionEntry(current, canonicalId)) return current;
      const newState = {
        ...current,
        completedTopics: [...current.completedTopics, canonicalId],
      };
      saveLearnerState(newState);
      return newState;
    });
  };

  return (
    <LearnerContext.Provider value={{ state, addMCQResult, markTopicComplete }}>
      {children}
    </LearnerContext.Provider>
  );
};

export const useLearner = () => {
  const context = useContext(LearnerContext);
  if (!context) throw new Error("useLearner must be used within a LearnerProvider");
  return context;
};
