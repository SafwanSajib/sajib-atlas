import type { BatchItemState, BatchJobState, ProductionInboxEntry } from "../batch-engine/types";

export type BatchControlSafeError = {
  provider?: string;
  attempts?: number;
  retryOccurred?: boolean;
  httpStatus?: number;
  outcome?: string;
  finishReason?: string;
  pipelineFailureCategory?: string;
  safeMessage?: string;
};

export type BatchControlItemView = {
  itemId: string;
  ordinal: number;
  title: string;
  topicId: string;
  state: BatchItemState;
  executions: number;
  hasDraft: boolean;
  qualityOverall?: "pass" | "warning" | "blocked";
  safeError?: BatchControlSafeError;
};

export type BatchControlSnapshot = {
  batchId: string;
  batchNumber: string;
  state: BatchJobState;
  itemCount: number;
  operatorTriggered: true;
  backgroundExecution: false;
  items: readonly BatchControlItemView[];
  inbox: readonly ProductionInboxEntry[];
};

export type ThreeTopicLiveGate = {
  itemCount: 3;
  execution: "not-started";
  engine: "tickBatchWorker";
  notUsed: "generateStudioBatchAction";
  concurrency: 1;
  maximumGeminiHttpAttempts: 2;
  geminiModel: string;
  primaryProvider: string;
  existingFallback: string;
  autoPublish: false;
  insertsIntoContentReview: false;
  topicIds: readonly string[];
  sourceCounts: readonly number[];
  titles: readonly string[];
};
