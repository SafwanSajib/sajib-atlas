export type MCQResult = {
  topicSlug: string;
  correct: boolean;
  timestamp: number;
};

export type LearnerState = {
  mcqResults: MCQResult[];
  completedTopics: string[];
};

