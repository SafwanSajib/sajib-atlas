import {
  createPersistentBatch,
  pauseBatch,
  projectBatchInbox,
  queueBatch,
  recordEditorialHandoff,
  recoverFailedBatchItem,
  resumeBatch,
  tickBatchWorker,
  updateBatchItemSource,
} from "../batch-engine/index";
import type { BatchItemRecord, BatchJobRecord, BatchJobStore, BatchTickResult, BatchTopicDefinition } from "../batch-engine/types";
import type { BatchControlSafeError, BatchControlSnapshot } from "./types";

function fail(message: string): never {
  throw new Error(`Batch control: ${message}`);
}

function safeError(item: BatchItemRecord): BatchControlSafeError | undefined {
  if (!item.result || item.state === "succeeded" || item.state === "pending" || item.state === "running") return undefined;
  const trace = item.result.providerTrace;
  const last = trace?.attemptsDetail[trace.attemptsDetail.length - 1];
  return {
    ...(trace ? { provider: trace.provider, attempts: trace.attempts, retryOccurred: trace.retryOccurred } : {}),
    ...(typeof last?.status === "number" ? { httpStatus: last.status } : {}),
    ...(last?.outcome ? { outcome: last.outcome } : {}),
    ...(last?.finishReason ? { finishReason: last.finishReason } : {}),
    ...(item.result.pipelineErrorCode ? { pipelineFailureCategory: item.result.pipelineErrorCode } : {}),
    ...(item.result.safeMessage ? { safeMessage: item.result.safeMessage } : {}),
  };
}

export function projectControlledBatch(job: BatchJobRecord): BatchControlSnapshot {
  return {
    batchId: job.batchId,
    batchNumber: job.batchNumber,
    state: job.state,
    itemCount: job.items.length,
    operatorTriggered: true,
    backgroundExecution: false,
    items: job.items.map((item) => ({
      itemId: item.itemId,
      ordinal: item.ordinal,
      title: item.title,
      topicId: item.resolvedTopicId,
      state: item.state,
      executions: item.executions,
      hasDraft: item.result?.draft !== undefined,
      ...(item.result?.qualityOverall ? { qualityOverall: item.result.qualityOverall } : {}),
      ...(safeError(item) ? { safeError: safeError(item) } : {}),
    })),
    inbox: projectBatchInbox(job),
  };
}

export function createControlledBatch(input: {
  store: BatchJobStore;
  batchNumber: number | string;
  createdAt: string;
  topics: readonly BatchTopicDefinition[];
}): BatchControlSnapshot {
  return projectControlledBatch(createPersistentBatch(input));
}

export function loadControlledBatch(store: BatchJobStore, batchId: string): BatchControlSnapshot | null {
  const job = store.load(batchId);
  return job ? projectControlledBatch(job) : null;
}

export function listControlledBatches(store: BatchJobStore): readonly BatchControlSnapshot[] {
  return store.list().map((job) => projectControlledBatch(job));
}

export function startControlledBatch(store: BatchJobStore, batchId: string, now: string): BatchControlSnapshot {
  return projectControlledBatch(queueBatch(store, batchId, now));
}

export async function tickControlledBatch(input: {
  store: BatchJobStore;
  batchId: string;
  provider: Parameters<typeof tickBatchWorker>[0]["provider"];
  now: string;
}): Promise<{ tick: BatchTickResult; snapshot: BatchControlSnapshot }> {
  const tick = await tickBatchWorker(input);
  const job = input.store.load(input.batchId);
  if (!job) fail(`batch ${input.batchId} does not exist`);
  return { tick, snapshot: projectControlledBatch(job) };
}

export function pauseControlledBatch(store: BatchJobStore, batchId: string, now: string): BatchControlSnapshot {
  return projectControlledBatch(pauseBatch(store, batchId, now));
}

export function resumeControlledBatch(store: BatchJobStore, batchId: string, now: string): BatchControlSnapshot {
  return projectControlledBatch(resumeBatch(store, batchId, now));
}

export function replaceControlledItemSource(input: {
  store: BatchJobStore;
  batchId: string;
  itemId: string;
  sourceText: string;
  now: string;
}): BatchControlSnapshot {
  return projectControlledBatch(updateBatchItemSource(input));
}

export function recoverFailedControlledItem(store: BatchJobStore, batchId: string, itemId: string, now: string): BatchControlSnapshot {
  return projectControlledBatch(recoverFailedBatchItem(store, batchId, itemId, now));
}

export function handoffControlledItem(input: {
  store: BatchJobStore;
  batchId: string;
  itemId: string;
  reviewerId: string;
  decidedAt: string;
  note?: string;
}): BatchJobRecord {
  return recordEditorialHandoff(input);
}
