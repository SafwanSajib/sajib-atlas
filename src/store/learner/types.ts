export type LearnerProgress = { topicSlug: string; viewed: boolean; correctAnswers: number; attemptedQuestions: number };
export type LearnerState = { progress: Record<string, LearnerProgress> };
