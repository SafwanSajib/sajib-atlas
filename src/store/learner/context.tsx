"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { LearnerState, MCQResult } from "./types";
import { getLearnerState, saveLearnerState } from "./storage";

type LearnerContextType = {
  state: LearnerState;
  addMCQResult: (result: MCQResult) => void;
  markTopicComplete: (slug: string) => void;
};

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<LearnerState>(() => {
    if (typeof window === "undefined") return { mcqResults: [], completedTopics: [] };
    return getLearnerState();
  });

  const addMCQResult = (result: MCQResult) => {
    const newState = { ...state, mcqResults: [...state.mcqResults, result] };
    setState(newState);
    saveLearnerState(newState);
  };

  const markTopicComplete = (slug: string) => {
    if (state.completedTopics.includes(slug)) return;
    const newState = { ...state, completedTopics: [...state.completedTopics, slug] };
    setState(newState);
    saveLearnerState(newState);
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

