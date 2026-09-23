import { updateBatchItemDraft } from "../batch-engine/definition";
import type { BatchJobRecord, BatchJobStore } from "../batch-engine/types";
import type { EditorialDraftStore } from "./types";

function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

export function replayEditorialWriteThrough(
  editorialStore: EditorialDraftStore,
  batchStore: BatchJobStore,
  batchId: string,
  itemId: string,
): BatchJobRecord {
  const editorial = editorialStore.load(batchId, itemId);
  if (!editorial) fail("persistence failure");
  const job = batchStore.load(batchId);
  if (!job) fail("persistence failure");
  const item = job.items.find((candidate) => candidate.itemId === itemId);
  if (!item?.result?.draft || (item.state !== "succeeded" && item.state !== "quality_blocked")) fail("persistence failure");
  if (item.result.completedAt !== editorial.sourceCompletedAt) fail("stale content version");
  if (item.result.draft.content.topic.contentVersion !== editorial.contentVersion) fail("stale content version");
  if (editorial.production.content.topic.contentVersion !== editorial.contentVersion) fail("stale content version");
  return updateBatchItemDraft(batchStore, {
    batchId,
    itemId,
    draft: editorial.production,
    qualityOverall: editorial.production.qualitySnapshot?.report.overall,
    expectedState: item.state,
    expectedCompletedAt: item.result.completedAt,
    expectedHandoffs: job.handoffs,
  });
}
