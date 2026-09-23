import { resolveStudioIdentity } from "../identity";
import { sourceFingerprint } from "./fingerprint";
import { batchIdFor, batchItemId, canonicalBatchNumber } from "./ids";
import { settleBatch } from "./policy";
import { BATCH_SCHEMA_VERSION } from "./types";
import type { ProductionRecord } from "@/lib/content/production/types";
import type { BatchEditorialHandoff, BatchItemRecord, BatchItemState, BatchJobRecord, BatchJobStore, BatchTopicDefinition } from "./types";

function fail(message: string): never {
  throw new Error(`Batch production: ${message}`);
}

function requireJob(store: BatchJobStore, batchId: string): BatchJobRecord {
  const job = store.load(batchId);
  if (!job) fail(`batch ${batchId} does not exist`);
  return job;
}

function save(store: BatchJobStore, job: BatchJobRecord): BatchJobRecord {
  store.save(job);
  return requireJob(store, job.batchId);
}

export function createPersistentBatch(input: {
  store: BatchJobStore;
  batchNumber: number | string;
  createdAt: string;
  topics: readonly BatchTopicDefinition[];
}): BatchJobRecord {
  if (Number.isNaN(Date.parse(input.createdAt))) fail("createdAt is invalid");
  if (!Array.isArray(input.topics) || input.topics.length === 0 || input.topics.length > 500) {
    fail("a batch requires 1 to 500 topics");
  }
  const batchNumber = canonicalBatchNumber(input.batchNumber);
  const batchId = batchIdFor(batchNumber);
  if (input.store.load(batchId)) fail(`batch ${batchId} already exists`);
  const items: BatchItemRecord[] = input.topics.map((topic, index) => {
    const identity = resolveStudioIdentity(topic.identity);
    const ordinal = index + 1;
    return {
      itemId: batchItemId(batchNumber, ordinal, identity.topicSlug),
      ordinal,
      identity: { ...topic.identity },
      resolvedTopicId: identity.topicId,
      topicSlug: identity.topicSlug,
      title: identity.title,
      ...(topic.sourceText !== undefined ? { sourceText: topic.sourceText } : {}),
      ...(topic.sourcePacket ? { sourcePacket: topic.sourcePacket } : {}),
      sourceFingerprint: sourceFingerprint(topic),
      state: "pending",
      executions: 0,
      rateLimitedResults: 0,
      reclaims: 0,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
  });
  return save(input.store, {
    schemaVersion: BATCH_SCHEMA_VERSION,
    batchId,
    batchNumber,
    state: "draft",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    items,
    handoffs: [],
  });
}

export function queueBatch(store: BatchJobStore, batchId: string, now: string): BatchJobRecord {
  const job = requireJob(store, batchId);
  if (job.state === "queued") return job;
  if (job.state !== "draft") fail(`cannot queue a batch in ${job.state}`);
  return save(store, { ...job, state: "queued", updatedAt: now });
}

export function pauseBatch(store: BatchJobStore, batchId: string, now: string): BatchJobRecord {
  const job = requireJob(store, batchId);
  if (job.state === "paused") return job;
  if (job.state !== "queued" && job.state !== "running") fail(`cannot pause a batch in ${job.state}`);
  return save(store, { ...job, state: "paused", updatedAt: now });
}

export function resumeBatch(store: BatchJobStore, batchId: string, now: string): BatchJobRecord {
  const job = requireJob(store, batchId);
  if (job.state !== "paused") return job;
  return save(store, settleBatch({ ...job, state: "queued" }, now));
}

export function updateBatchItemSource(input: {
  store: BatchJobStore;
  batchId: string;
  itemId: string;
  sourceText: string;
  now: string;
}): BatchJobRecord {
  const job = requireJob(input.store, input.batchId);
  const current = job.items.find((item) => item.itemId === input.itemId);
  if (!current) fail(`item ${input.itemId} does not exist`);
  if (current.state !== "source_insufficient") fail("only a source_insufficient item can receive a replacement source");
  const sourceText = input.sourceText.trim();
  if (!sourceText) fail("replacement source text is empty");
  const replaced: BatchItemRecord = {
    ...current,
    sourceText,
    sourceFingerprint: sourceFingerprint({ sourceText }),
    state: "pending",
    updatedAt: input.now,
  };
  delete replaced.sourcePacket;
  delete replaced.result;
  const items = job.items.map((item) => (item.itemId === replaced.itemId ? replaced : item));
  const next = job.state === "paused"
    ? { ...job, items, updatedAt: input.now }
    : settleBatch({ ...job, state: "queued", items }, input.now);
  return save(input.store, next);
}

/**
 * Explicit operator recovery. Requeues one failed item for a later single tick.
 * It does not call the provider and does not touch succeeded, quality-blocked,
 * or source-insufficient items.
 */
export function recoverFailedBatchItem(store: BatchJobStore, batchId: string, itemId: string, now: string): BatchJobRecord {
  const job = requireJob(store, batchId);
  const current = job.items.find((item) => item.itemId === itemId);
  if (!current) fail(`item ${itemId} does not exist`);
  if (current.state !== "failed") fail("only a failed item can be explicitly recovered");
  const requeued: BatchItemRecord = { ...current, state: "pending", updatedAt: now };
  delete requeued.result;
  const items = job.items.map((item) => (item.itemId === requeued.itemId ? requeued : item));
  const next = job.state === "paused" || job.state === "draft"
    ? { ...job, items, updatedAt: now }
    : settleBatch({ ...job, state: "queued", items }, now);
  return save(store, next);
}

function editorialFail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function updateBatchItemDraft(
  store: BatchJobStore,
  input: {
    batchId: string;
    itemId: string;
    draft: ProductionRecord;
    qualityOverall: "pass" | "warning" | "blocked" | undefined;
    expectedState: BatchItemState;
    expectedCompletedAt: string;
    expectedHandoffs: readonly BatchEditorialHandoff[];
  },
): BatchJobRecord {
  const job = store.load(input.batchId);
  if (!job) editorialFail("persistence failure");
  const item = job.items.find((candidate) => candidate.itemId === input.itemId);
  if (!item?.result?.draft) editorialFail("persistence failure");
  if (item.state !== "succeeded" && item.state !== "quality_blocked") editorialFail("persistence failure");
  if (item.state !== input.expectedState) editorialFail("persistence failure");
  if (item.result.completedAt !== input.expectedCompletedAt) editorialFail("stale content version");
  if (!sameJson(job.handoffs, input.expectedHandoffs)) editorialFail("persistence failure");
  const items = job.items.map((candidate) => {
    if (candidate.itemId !== input.itemId || !candidate.result) return candidate;
    const result = { ...candidate.result, draft: input.draft };
    if (input.qualityOverall) result.qualityOverall = input.qualityOverall;
    else delete result.qualityOverall;
    return { ...candidate, result };
  });
  store.save({ ...job, items });
  const stored = store.load(input.batchId);
  if (!stored) editorialFail("persistence failure");
  return stored;
}
