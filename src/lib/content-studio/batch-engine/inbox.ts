import type { BatchItemRecord, BatchJobRecord, BatchJobStore, ProductionInboxEntry, ProductionInboxLane } from "./types";

function lanesFor(item: BatchItemRecord, handoffRecorded: boolean): readonly ProductionInboxLane[] {
  if (item.state === "succeeded") {
    if (item.result?.qualityOverall === "blocked") return ["quality_blocked"];
    return handoffRecorded ? ["generated"] : ["generated", "ready_for_editorial_review"];
  }
  if (item.state === "quality_blocked") return ["quality_blocked"];
  if (item.state === "source_insufficient") return ["source_insufficient"];
  if (item.state === "rate_limited") return ["rate_limited"];
  if (item.state === "failed") return ["failed"];
  return [];
}

export function projectBatchInbox(job: BatchJobRecord): readonly ProductionInboxEntry[] {
  const handedOff = new Set(job.handoffs.map((handoff) => handoff.itemId));
  const entries: ProductionInboxEntry[] = [];
  for (const item of job.items) {
    const handoffRecorded = handedOff.has(item.itemId);
    for (const lane of lanesFor(item, handoffRecorded)) {
      entries.push({
        batchId: job.batchId,
        batchNumber: job.batchNumber,
        itemId: item.itemId,
        ordinal: item.ordinal,
        title: item.title,
        topicSlug: item.topicSlug,
        lane,
        state: item.state,
        updatedAt: item.updatedAt,
        ...(item.result?.qualityOverall ? { qualityOverall: item.result.qualityOverall } : {}),
        handoffRecorded,
      });
    }
  }
  return entries;
}

export function listProductionInbox(store: BatchJobStore): readonly ProductionInboxEntry[] {
  return store.list().flatMap((job) => projectBatchInbox(job));
}
