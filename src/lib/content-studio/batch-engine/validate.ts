import { BATCH_SCHEMA_VERSION } from "./types";
import type { BatchJobRecord } from "./types";

const BATCH_STATES = new Set(["draft", "queued", "running", "paused", "completed", "completed_with_failures"]);
const ITEM_STATES = new Set(["pending", "running", "succeeded", "quality_blocked", "source_insufficient", "rate_limited", "failed"]);

function fail(message: string): never {
  throw new Error(`Batch production: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function timestamp(value: unknown, label: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) fail(`${label} is invalid`);
  return value;
}

export function assertBatchJob(value: unknown): BatchJobRecord {
  if (!isRecord(value)) fail("batch record is invalid");
  if (value.schemaVersion !== BATCH_SCHEMA_VERSION) fail("batch schema is unsupported");
  if (typeof value.batchNumber !== "string" || !/^[0-9]{3,4}$/.test(value.batchNumber)) fail("batch number is invalid");
  if (value.batchId !== `studio-batch/${value.batchNumber}`) fail("batch id does not match its number");
  if (typeof value.state !== "string" || !BATCH_STATES.has(value.state)) fail("batch state is invalid");
  timestamp(value.createdAt, "batch createdAt");
  timestamp(value.updatedAt, "batch updatedAt");
  if (!Array.isArray(value.items) || value.items.length === 0) fail("batch requires items");
  if (!Array.isArray(value.handoffs)) fail("batch handoffs are invalid");
  const itemIds = new Set<string>();
  for (const item of value.items) {
    if (!isRecord(item)) fail("batch item is invalid");
    if (typeof item.itemId !== "string" || !item.itemId.startsWith(`${value.batchId}/item/`)) fail("item id is invalid");
    if (itemIds.has(item.itemId)) fail("item id is duplicated");
    itemIds.add(item.itemId);
    if (typeof item.ordinal !== "number" || !Number.isInteger(item.ordinal) || item.ordinal < 1) fail("item ordinal is invalid");
    if (typeof item.state !== "string" || !ITEM_STATES.has(item.state)) fail("item state is invalid");
    if (typeof item.resolvedTopicId !== "string" || typeof item.topicSlug !== "string" || typeof item.title !== "string") {
      fail("item identity is invalid");
    }
    if (typeof item.sourceFingerprint !== "string" || !item.sourceFingerprint) fail("item source fingerprint is invalid");
    for (const key of ["executions", "rateLimitedResults", "reclaims"] as const) {
      if (typeof item[key] !== "number" || !Number.isInteger(item[key]) || item[key] < 0) fail(`item ${key} is invalid`);
    }
    timestamp(item.createdAt, "item createdAt");
    timestamp(item.updatedAt, "item updatedAt");
  }
  for (const handoff of value.handoffs) {
    if (!isRecord(handoff)) fail("handoff is invalid");
    if (handoff.decision !== "submit-for-canonical-registration") fail("handoff decision is invalid");
    if (handoff.registeredInContentReview !== false) fail("handoff cannot register canonical review");
    if (typeof handoff.itemId !== "string" || !itemIds.has(handoff.itemId)) fail("handoff item is missing");
    if (typeof handoff.reviewerId !== "string" || !handoff.reviewerId.trim()) fail("handoff reviewer is invalid");
  }
  return value as BatchJobRecord;
}
