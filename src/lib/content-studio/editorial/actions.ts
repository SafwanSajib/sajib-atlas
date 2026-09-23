"use server";

import { join } from "node:path";
import { batchIdFor, batchItemId, createFileBatchJobStore } from "../batch-engine/index";
import type { ContentQualityReport } from "@/lib/content-quality/types";
import {
  applyEditorialPatch,
  commitEditorialSave,
  commitMarkReadyForApproval,
  commitMarkReadyForReview,
  commitRequestChanges,
  commitReturnToEditing,
  openEditorialDraft,
  replayEditorialWriteThrough,
  resolveEditorialRoute,
  validateEditorialDraft,
} from "./index";
import type { EditorialPatch } from "./edit";
import { createFileEditorialDraftStore } from "./file-store";
import type { EditorialRouteResolution } from "./open";
import type { EditorialDraftRecord, EditorialWorkspaceView } from "./types";

function assertDev(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Editorial workspace is disabled in production.");
  }
}

function stores() {
  return {
    editorialStore: createFileEditorialDraftStore(join(process.cwd(), ".data", "content-studio", "editorial")),
    batchStore: createFileBatchJobStore(join(process.cwd(), ".data", "content-studio", "batches")),
  };
}

function resolveIds(batchNumber: string, itemParam: string): { batchId: string; itemId: string } {
  if (!/^[0-9]{3,4}$/.test(batchNumber) || !/^[0-9]{3}--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(itemParam)) {
    throw new Error("Editorial workspace: persistence failure");
  }
  const split = itemParam.indexOf("--");
  const ordinal = Number(itemParam.slice(0, split));
  const topicSlug = itemParam.slice(split + 2);
  return { batchId: batchIdFor(batchNumber), itemId: batchItemId(batchNumber, ordinal, topicSlug) };
}

function stamp(): string {
  return new Date().toISOString();
}

export async function openEditorialAction(batchNumber: string, itemParam: string): Promise<EditorialWorkspaceView> {
  assertDev();
  const ids = resolveIds(batchNumber, itemParam);
  const { editorialStore, batchStore } = stores();
  return openEditorialDraft(batchStore, editorialStore, ids.batchId, ids.itemId);
}

export async function loadEditorialRouteAction(batchNumber: string, itemParam: string): Promise<EditorialRouteResolution> {
  assertDev();
  const { editorialStore, batchStore } = stores();
  return resolveEditorialRoute({
    nodeEnv: process.env.NODE_ENV,
    batchIdParam: batchNumber,
    itemParam,
    batchStore,
    editorialStore,
  });
}

export async function saveEditorialDraftAction(input: {
  batchNumber: string;
  itemParam: string;
  expectedRevision: number;
  patch?: EditorialPatch;
  noteBody?: string;
  actorLabel?: string;
  reason?: string;
}): Promise<EditorialDraftRecord> {
  assertDev();
  const ids = resolveIds(input.batchNumber, input.itemParam);
  const { editorialStore, batchStore } = stores();
  const now = stamp();
  return commitEditorialSave({
    editorialStore,
    batchStore,
    ...ids,
    expectedRevision: input.expectedRevision,
    ...(input.patch ? { patch: input.patch } : {}),
    ...(input.noteBody ? { notes: [{ body: input.noteBody }] } : {}),
    ...(input.actorLabel ? { actorLabel: input.actorLabel } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    updatedAt: now,
    evaluatedAt: now,
  });
}

export async function validateEditorialDraftAction(input: {
  batchNumber: string;
  itemParam: string;
  patch?: EditorialPatch;
}): Promise<ContentQualityReport> {
  assertDev();
  const ids = resolveIds(input.batchNumber, input.itemParam);
  const { editorialStore, batchStore } = stores();
  const view = openEditorialDraft(batchStore, editorialStore, ids.batchId, ids.itemId);
  const patched = input.patch ? applyEditorialPatch(view.production, input.patch) : view.production;
  const evaluated = validateEditorialDraft(patched, stamp());
  const report = evaluated.qualitySnapshot?.report ?? evaluated.qualityReport;
  if (!report) throw new Error("Editorial workspace: persistence failure");
  return report;
}

async function advance(input: {
  batchNumber: string;
  itemParam: string;
  expectedRevision: number;
  actorLabel?: string;
  reason?: string;
  noteBody?: string;
}, run: typeof commitMarkReadyForReview): Promise<EditorialDraftRecord> {
  assertDev();
  const ids = resolveIds(input.batchNumber, input.itemParam);
  const { editorialStore, batchStore } = stores();
  const now = stamp();
  return run({
    editorialStore,
    batchStore,
    ...ids,
    expectedRevision: input.expectedRevision,
    ...(input.actorLabel ? { actorLabel: input.actorLabel } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.noteBody ? { notes: [{ body: input.noteBody }] } : {}),
    updatedAt: now,
    evaluatedAt: now,
  });
}

export async function markReadyForReviewAction(input: {
  batchNumber: string;
  itemParam: string;
  expectedRevision: number;
  actorLabel?: string;
}): Promise<EditorialDraftRecord> {
  return advance(input, commitMarkReadyForReview);
}

export async function markReadyForApprovalAction(input: {
  batchNumber: string;
  itemParam: string;
  expectedRevision: number;
  actorLabel?: string;
}): Promise<EditorialDraftRecord> {
  return advance(input, commitMarkReadyForApproval);
}

export async function requestChangesAction(input: {
  batchNumber: string;
  itemParam: string;
  expectedRevision: number;
  actorLabel?: string;
  reason?: string;
  noteBody?: string;
}): Promise<EditorialDraftRecord> {
  return advance(input, commitRequestChanges);
}

export async function returnToEditingAction(input: {
  batchNumber: string;
  itemParam: string;
  expectedRevision: number;
  actorLabel?: string;
  reason?: string;
}): Promise<EditorialDraftRecord> {
  return advance(input, commitReturnToEditing);
}

export async function replayEditorialWriteThroughAction(input: {
  batchNumber: string;
  itemParam: string;
}): Promise<{ replayed: true }> {
  assertDev();
  const ids = resolveIds(input.batchNumber, input.itemParam);
  const { editorialStore, batchStore } = stores();
  replayEditorialWriteThrough(editorialStore, batchStore, ids.batchId, ids.itemId);
  return { replayed: true };
}
