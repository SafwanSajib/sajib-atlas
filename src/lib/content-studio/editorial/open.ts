import { buildReviewProjection } from "@/lib/content/review/projection";
import type { ProductionRecord } from "@/lib/content/production/types";
import { batchIdFor, batchItemId } from "../batch-engine/ids";
import { projectBatchInbox } from "../batch-engine/inbox";
import type { BatchJobStore } from "../batch-engine/types";
import type { EditorialDraftStore, EditorialWorkspaceView } from "./types";

const BATCH_PARAM = /^[0-9]{3,4}$/;
const ITEM_PARAM = /^[0-9]{3}--[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type EditorialRouteResolution =
  | { kind: "not-found" }
  | { kind: "workspace"; view: EditorialWorkspaceView }
  | { kind: "persistence-failure"; message: string; replayAvailable: boolean };

function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => deepEqual(item, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  if (keys.length !== Object.keys(rightRecord).length) return false;
  return keys.every((key) => Object.hasOwn(rightRecord, key) && deepEqual(leftRecord[key], rightRecord[key]));
}

function projectionFor(record: ProductionRecord): EditorialWorkspaceView["projection"] {
  try {
    return buildReviewProjection(record);
  } catch {
    return undefined;
  }
}

export function openEditorialDraft(
  batchStore: BatchJobStore,
  editorialStore: EditorialDraftStore,
  batchId: string,
  itemId: string,
): EditorialWorkspaceView {
  const job = batchStore.load(batchId);
  if (!job) fail("persistence failure");
  const item = job.items.find((candidate) => candidate.itemId === itemId);
  if (!item?.result?.draft || (item.state !== "succeeded" && item.state !== "quality_blocked")) fail("persistence failure");
  const draft = item.result.draft;
  const lanes = projectBatchInbox(job).filter((entry) => entry.itemId === itemId).map((entry) => entry.lane);
  const editorial = editorialStore.load(batchId, itemId);
  if (editorial && !deepEqual(editorial.production, draft)) fail("persistence failure");
  const production = editorial?.production ?? draft;
  const projection = projectionFor(production);
  return {
    persisted: editorial !== null,
    expectedRevision: editorial?.revision ?? 0,
    revision: editorial?.revision ?? 0,
    editorialStatus: editorial?.editorialStatus ?? "needs_editing",
    production,
    ...(production.qualitySnapshot ? { qualitySnapshot: production.qualitySnapshot } : {}),
    ...(projection ? { projection } : {}),
    notes: editorial?.notes ?? [],
    changes: editorial?.changes ?? [],
    lanes,
    canonical: false,
    publishable: false,
    batchId,
    itemId,
    updatedAt: editorial?.updatedAt ?? item.updatedAt,
    sourceCompletedAt: editorial?.sourceCompletedAt ?? item.result.completedAt,
    contentVersion: production.content.topic.contentVersion,
    generationState: item.state,
    batchNumber: job.batchNumber,
    subjectId: production.content.subjectId,
    topicTitle: production.content.topic.title,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message.startsWith("Editorial workspace: ")
    ? error.message
    : "Editorial workspace: persistence failure";
}

export function resolveEditorialRoute(input: {
  nodeEnv: string | undefined;
  batchIdParam: string;
  itemParam: string;
  batchStore: BatchJobStore;
  editorialStore: EditorialDraftStore;
}): EditorialRouteResolution {
  if (input.nodeEnv === "production") return { kind: "not-found" };
  if (!BATCH_PARAM.test(input.batchIdParam) || !ITEM_PARAM.test(input.itemParam)) return { kind: "not-found" };
  const split = input.itemParam.indexOf("--");
  const batchId = batchIdFor(input.batchIdParam);
  const itemId = batchItemId(input.batchIdParam, Number(input.itemParam.slice(0, split)), input.itemParam.slice(split + 2));
  try {
    return { kind: "workspace", view: openEditorialDraft(input.batchStore, input.editorialStore, batchId, itemId) };
  } catch (error) {
    const message = messageOf(error);
    let job: ReturnType<BatchJobStore["load"]>;
    try {
      job = input.batchStore.load(batchId);
    } catch (loadError) {
      return { kind: "persistence-failure", message: messageOf(loadError), replayAvailable: false };
    }
    const item = job?.items.find((candidate) => candidate.itemId === itemId);
    if (!job || !item?.result?.draft || (item.state !== "succeeded" && item.state !== "quality_blocked")) {
      return { kind: "not-found" };
    }
    try {
      const editorial = input.editorialStore.load(batchId, itemId);
      return {
        kind: "persistence-failure",
        message,
        replayAvailable: editorial !== null && !deepEqual(editorial.production, item.result.draft),
      };
    } catch (loadError) {
      return { kind: "persistence-failure", message: messageOf(loadError), replayAvailable: false };
    }
  }
}
