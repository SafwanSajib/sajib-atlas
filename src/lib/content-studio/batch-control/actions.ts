"use server";

import { join } from "node:path";
import { createServerRoutedProvider } from "@/lib/ai-providers/server";
import { createFileBatchJobStore } from "../batch-engine/index";
import type { BatchTopicDefinition } from "../batch-engine/types";
import {
  createControlledBatch,
  handoffControlledItem,
  listControlledBatches,
  pauseControlledBatch,
  recoverFailedControlledItem,
  replaceControlledItemSource,
  resumeControlledBatch,
  startControlledBatch,
  tickControlledBatch,
} from "./surface";
import type { BatchControlSnapshot } from "./types";

function store() {
  return createFileBatchJobStore(join(process.cwd(), ".data", "content-studio", "batches"));
}

function assertDev(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Batch control is disabled in production.");
  }
}

function now(): string {
  return new Date().toISOString();
}

export async function listControlledBatchesAction(): Promise<readonly BatchControlSnapshot[]> {
  assertDev();
  return listControlledBatches(store());
}

export async function createControlledBatchAction(input: {
  batchNumber: number;
  topics: readonly BatchTopicDefinition[];
}): Promise<BatchControlSnapshot> {
  assertDev();
  return createControlledBatch({ store: store(), batchNumber: input.batchNumber, createdAt: now(), topics: input.topics });
}

export async function startControlledBatchAction(batchId: string): Promise<BatchControlSnapshot> {
  assertDev();
  return startControlledBatch(store(), batchId, now());
}

export async function tickControlledBatchAction(batchId: string): Promise<BatchControlSnapshot> {
  assertDev();
  const provider = createServerRoutedProvider();
  if (!provider.ok) throw new Error("Persistent batch tick is unavailable because the AI provider is not configured.");
  const result = await tickControlledBatch({ store: store(), batchId, provider: provider.data, now: now() });
  return result.snapshot;
}

export async function pauseControlledBatchAction(batchId: string): Promise<BatchControlSnapshot> {
  assertDev();
  return pauseControlledBatch(store(), batchId, now());
}

export async function resumeControlledBatchAction(batchId: string): Promise<BatchControlSnapshot> {
  assertDev();
  return resumeControlledBatch(store(), batchId, now());
}

export async function replaceControlledItemSourceAction(input: {
  batchId: string;
  itemId: string;
  sourceText: string;
}): Promise<BatchControlSnapshot> {
  assertDev();
  return replaceControlledItemSource({ store: store(), ...input, now: now() });
}

export async function recoverFailedBatchItemAction(input: { batchId: string; itemId: string }): Promise<BatchControlSnapshot> {
  assertDev();
  return recoverFailedControlledItem(store(), input.batchId, input.itemId, now());
}

export async function handoffControlledItemAction(input: {
  batchId: string;
  itemId: string;
  reviewerId: string;
  note?: string;
}): Promise<BatchControlSnapshot> {
  assertDev();
  const job = handoffControlledItem({ store: store(), ...input, decidedAt: now() });
  const snapshot = listControlledBatches(store()).find((batch) => batch.batchId === job.batchId);
  if (!snapshot) throw new Error("Batch control: batch disappeared after handoff.");
  return snapshot;
}
