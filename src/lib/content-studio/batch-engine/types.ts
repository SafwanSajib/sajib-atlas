import type { ProductionRecord } from "@/lib/content/production/index";
import type { StudioFailure, StudioSourcePacketInput, StudioTopicIdentityInput } from "../types";

export const BATCH_SCHEMA_VERSION = "studio-batch-job/v1";
export const BATCH_WORKER_CONCURRENCY = 1;
/** One automatic re-execution after a rate_limited result. Not a provider retry. */
export const BATCH_RATE_LIMIT_AUTOMATIC_RETRIES = 1;
/** A crashed `running` item may be reclaimed once. A second reclaim is failed. */
export const BATCH_RUNNING_RECLAIM_LIMIT = 1;
export const LOCAL_BATCH_STORE_DIRECTORY = ".data/content-studio/batches";

export const BATCH_EXECUTION_BOUNDARY = {
  persistence: "BatchJobStore",
  worker: "tickBatchWorker",
  generation: "runStudioPipeline",
  autonomous: false,
} as const;

export type BatchJobState =
  | "draft"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "completed_with_failures";

export type BatchItemState =
  | "pending"
  | "running"
  | "succeeded"
  | "quality_blocked"
  | "source_insufficient"
  | "rate_limited"
  | "failed";

export type SafeProviderAttempt = {
  attempt: number;
  outcome: string;
  status?: number;
  finishReason?: string;
};

export type SafeProviderTrace = {
  provider: string;
  attempts: number;
  retryOccurred: boolean;
  attemptsDetail: readonly SafeProviderAttempt[];
};

export type BatchItemResult = {
  completedAt: string;
  pipelineOk: boolean;
  pipelineErrorCode?: StudioFailure["error"]["code"];
  safeMessage?: string;
  qualityOverall?: "pass" | "warning" | "blocked";
  providerTrace?: SafeProviderTrace;
  draft?: ProductionRecord;
};

export type BatchTopicDefinition = {
  identity: StudioTopicIdentityInput;
  sourceText?: string;
  sourcePacket?: StudioSourcePacketInput;
};

export type BatchItemRecord = {
  itemId: string;
  ordinal: number;
  identity: StudioTopicIdentityInput;
  resolvedTopicId: string;
  topicSlug: string;
  title: string;
  sourceText?: string;
  sourcePacket?: StudioSourcePacketInput;
  sourceFingerprint: string;
  state: BatchItemState;
  executions: number;
  rateLimitedResults: number;
  reclaims: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  result?: BatchItemResult;
};

export type BatchEditorialHandoff = {
  handoffId: string;
  itemId: string;
  reviewerId: string;
  decidedAt: string;
  decision: "submit-for-canonical-registration";
  registeredInContentReview: false;
  note?: string;
};

export type BatchJobRecord = {
  schemaVersion: typeof BATCH_SCHEMA_VERSION;
  batchId: string;
  batchNumber: string;
  state: BatchJobState;
  createdAt: string;
  updatedAt: string;
  items: readonly BatchItemRecord[];
  handoffs: readonly BatchEditorialHandoff[];
};

export type BatchJobStore = {
  load(batchId: string): BatchJobRecord | null;
  save(record: BatchJobRecord): void;
  list(): readonly BatchJobRecord[];
};

export type BatchTickReason = "processed" | "paused" | "not_queued" | "idle" | "terminal";

export type BatchTickResult = {
  batchId: string;
  processed: boolean;
  reason: BatchTickReason;
  itemId?: string;
  itemState?: BatchItemState;
  batchState: BatchJobState;
};

export type ProductionInboxLane =
  | "generated"
  | "quality_blocked"
  | "source_insufficient"
  | "rate_limited"
  | "failed"
  | "ready_for_editorial_review";

export type ProductionInboxEntry = {
  batchId: string;
  batchNumber: string;
  itemId: string;
  ordinal: number;
  title: string;
  topicSlug: string;
  lane: ProductionInboxLane;
  state: BatchItemState;
  updatedAt: string;
  qualityOverall?: "pass" | "warning" | "blocked";
  handoffRecorded: boolean;
};
