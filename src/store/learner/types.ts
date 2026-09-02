import type { LearnerIntelligenceState } from "@/lib/learner-intelligence/types";

export type MCQResult = {
  topicSlug: string;
  correct: boolean;
  timestamp: number;
};

export type LearnerState = {
  mcqResults: MCQResult[];
  completedTopics: string[];
  /** Additive Phase 4 intelligence. Absent on pre-Phase-4 local state. */
  intelligence?: LearnerIntelligenceState;
};

