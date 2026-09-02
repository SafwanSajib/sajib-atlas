/**
 * Public AI experience DTO (Phase 6D).
 * Safe for the web UI. No provider secrets, assessment answers, or learner storage.
 */

import type {
  AiAnswerStyle,
  AiGroundingState,
  AiIntent,
  AiResponseStatus,
} from "@/lib/ai-intelligence/types";

export type AiExperienceSource = {
  id: string;
  kind: string;
  title: string;
  href?: string;
  contentVersion?: number;
};

export type AiExperienceLearnerProjection = {
  topicId: string;
  performanceState: "not-started" | "active" | "developing" | "strong";
  percentage: number;
  questionsAnswered: number;
  isCompleted: boolean;
};

export type AiExperienceRequest = {
  text: string;
  intent: AiIntent;
  style: AiAnswerStyle;
  topicId?: string;
  conceptId?: string;
  learner?: AiExperienceLearnerProjection;
};

export type AiExperienceView = {
  requestId: string;
  responseId: string;
  status: AiResponseStatus;
  groundingState: AiGroundingState;
  text: string;
  sources: readonly AiExperienceSource[];
};

export type AiExperienceFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type AiExperienceSuccess = {
  ok: true;
  data: AiExperienceView;
};

export type AiExperienceResult = AiExperienceSuccess | AiExperienceFailure;

export type AiExperienceParseResult =
  | { ok: true; data: AiExperienceRequest }
  | AiExperienceFailure;
