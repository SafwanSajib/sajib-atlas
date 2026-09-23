import { updateBatchItemDraft } from "../batch-engine/definition";
import type { BatchItemRecord, BatchJobRecord, BatchJobStore } from "../batch-engine/types";
import type { ProductionRecord } from "@/lib/content/production/types";
import { redactSecrets } from "../batch-engine/sanitize";
import { applyEditorialPatch, type EditorialPatch } from "./edit";
import { appendHistory } from "./history";
import { noteIdFor } from "./notes";
import { assertEditorialTransition } from "./status";
import type { EditorialDraftRecord, EditorialDraftStore, EditorialNote, EditorialStatus } from "./types";
import { EDITORIAL_LIMITS, EDITORIAL_SCHEMA_VERSION } from "./types";
import { assertActorLabel, assertEditablePackage, previewEditorialAdvance, validateEditorialDraft } from "./validate";
export { replayEditorialWriteThrough } from "./write-through";

export type EditorialCommitInput = {
  editorialStore: EditorialDraftStore;
  batchStore: BatchJobStore;
  batchId: string;
  itemId: string;
  expectedRevision: number;
  patch?: EditorialPatch;
  actorLabel?: string;
  reason?: string;
  notes?: readonly { body: string }[];
  updatedAt: string;
  evaluatedAt: string;
};

type LoadedDraft = {
  job: BatchJobRecord;
  item: BatchItemRecord & { result: NonNullable<BatchItemRecord["result"]> & { draft: ProductionRecord } };
  editorial: EditorialDraftRecord | null;
  baseline: ProductionRecord;
  status: EditorialStatus;
};

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

function loadContext(input: EditorialCommitInput): LoadedDraft {
  const job = input.batchStore.load(input.batchId);
  if (!job) fail("persistence failure");
  const item = job.items.find((candidate) => candidate.itemId === input.itemId);
  if (!item?.result?.draft || (item.state !== "succeeded" && item.state !== "quality_blocked")) fail("persistence failure");
  const editorial = input.editorialStore.load(input.batchId, input.itemId);
  if (editorial ? input.expectedRevision !== editorial.revision : input.expectedRevision !== 0) fail("stale edit");
  if (editorial && item.result.completedAt !== editorial.sourceCompletedAt) fail("stale content version");
  if (editorial && item.result.draft.content.topic.contentVersion !== editorial.contentVersion) fail("stale content version");
  const baseline = editorial?.production ?? item.result.draft;
  if (editorial && item.result.draft.content.topic.contentVersion !== baseline.content.topic.contentVersion) fail("stale content version");
  return {
    job,
    item: item as LoadedDraft["item"],
    editorial,
    baseline,
    status: editorial?.editorialStatus ?? "needs_editing",
  };
}

function notesFor(input: EditorialCommitInput, revision: number): EditorialNote[] {
  return (input.notes ?? []).map((note, index) => ({
    noteId: noteIdFor(input.batchId, input.itemId, revision, index),
    body: redactSecrets(note.body),
    createdAt: input.updatedAt,
  }));
}

function finish(
  input: EditorialCommitInput,
  loaded: LoadedDraft,
  production: ProductionRecord,
  status: EditorialStatus,
): EditorialDraftRecord {
  const revision = input.expectedRevision + 1;
  const addedNotes = notesFor(input, revision);
  const addedChanges = appendHistory({
    previous: loaded.baseline,
    next: production,
    previousStatus: loaded.status,
    nextStatus: status,
    revision,
    at: input.updatedAt,
    notes: addedNotes,
    reason: input.reason,
    actorLabel: input.actorLabel,
  });
  const notes = [...(loaded.editorial?.notes ?? []), ...addedNotes];
  const changes = [...(loaded.editorial?.changes ?? []), ...addedChanges];
  if (changes.length > EDITORIAL_LIMITS.maxChanges || notes.length > EDITORIAL_LIMITS.maxNotes) fail("persistence failure");
  return persist(input, loaded, {
    schemaVersion: EDITORIAL_SCHEMA_VERSION,
    batchId: input.batchId,
    itemId: input.itemId,
    editorialStatus: status,
    revision,
    updatedAt: input.updatedAt,
    sourceCompletedAt: loaded.item.result.completedAt,
    contentVersion: production.content.topic.contentVersion,
    production,
    notes,
    changes,
  });
}

function unsaved(input: EditorialCommitInput, loaded: LoadedDraft): EditorialDraftRecord {
  return {
    schemaVersion: EDITORIAL_SCHEMA_VERSION,
    batchId: input.batchId,
    itemId: input.itemId,
    editorialStatus: "needs_editing",
    revision: 0,
    updatedAt: input.updatedAt,
    sourceCompletedAt: loaded.item.result.completedAt,
    contentVersion: loaded.baseline.content.topic.contentVersion,
    production: loaded.baseline,
    notes: [],
    changes: [],
  };
}

function persist(input: EditorialCommitInput, loaded: LoadedDraft, next: EditorialDraftRecord): EditorialDraftRecord {
  try {
    input.editorialStore.save(next, input.expectedRevision);
  } catch (error) {
    if (error instanceof Error && error.message.includes("stale edit")) throw error;
    fail("persistence failure");
  }
  try {
    updateBatchItemDraft(input.batchStore, {
      batchId: input.batchId,
      itemId: input.itemId,
      draft: next.production,
      qualityOverall: next.production.qualitySnapshot?.report.overall,
      expectedState: loaded.item.state,
      expectedCompletedAt: loaded.item.result.completedAt,
      expectedHandoffs: loaded.job.handoffs,
    });
  } catch {
    fail("persistence failure");
  }
  return next;
}

export function commitEditorialSave(input: EditorialCommitInput): EditorialDraftRecord {
  const loaded = loadContext(input);
  assertActorLabel(input.actorLabel);
  const patched = input.patch ? applyEditorialPatch(loaded.baseline, input.patch) : loaded.baseline;
  assertEditablePackage(patched);
  const contentChanged = !deepEqual(patched.content, loaded.baseline.content);
  if (!contentChanged && (input.notes ?? []).length === 0) return loaded.editorial ?? unsaved(input, loaded);
  const production = contentChanged ? validateEditorialDraft(patched, input.evaluatedAt) : loaded.baseline;
  let status = loaded.status;
  if (contentChanged && (status === "ready_for_review" || status === "ready_for_approval" || status === "changes_requested")) {
    status = "needs_editing";
  }
  return finish(input, loaded, production, status);
}

function commitAdvance(input: EditorialCommitInput, to: EditorialStatus): EditorialDraftRecord {
  const loaded = loadContext(input);
  assertActorLabel(input.actorLabel);
  const patched = input.patch ? applyEditorialPatch(loaded.baseline, input.patch) : loaded.baseline;
  assertEditablePackage(patched);
  assertEditorialTransition(loaded.status, to);
  const evaluated = previewEditorialAdvance(patched, input.evaluatedAt);
  return finish(input, loaded, evaluated, to);
}

function commitStatus(input: EditorialCommitInput, to: EditorialStatus): EditorialDraftRecord {
  const loaded = loadContext(input);
  assertActorLabel(input.actorLabel);
  assertEditablePackage(loaded.baseline);
  assertEditorialTransition(loaded.status, to);
  return finish(input, loaded, loaded.baseline, to);
}

export function commitRequestChanges(input: EditorialCommitInput): EditorialDraftRecord {
  return commitStatus(input, "changes_requested");
}

export function commitReturnToEditing(input: EditorialCommitInput): EditorialDraftRecord {
  return commitStatus(input, "needs_editing");
}

export function commitMarkReadyForReview(input: EditorialCommitInput): EditorialDraftRecord {
  return commitAdvance(input, "ready_for_review");
}

export function commitMarkReadyForApproval(input: EditorialCommitInput): EditorialDraftRecord {
  return commitAdvance(input, "ready_for_approval");
}
