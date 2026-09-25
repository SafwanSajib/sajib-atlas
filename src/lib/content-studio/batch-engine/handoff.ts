import type { BatchJobRecord, BatchJobStore } from "./types";

function fail(message: string): never {
  throw new Error(`Batch production: ${message}`);
}

/**
 * Records a human decision that a draft is ready for a later canonical
 * registration step. It does not register, approve, or publish the draft.
 */
export function recordEditorialHandoff(input: {
  store: BatchJobStore;
  batchId: string;
  itemId: string;
  reviewerId: string;
  decidedAt: string;
  note?: string;
}): BatchJobRecord {
  const job = input.store.load(input.batchId);
  if (!job) fail(`batch ${input.batchId} does not exist`);
  const item = job.items.find((candidate) => candidate.itemId === input.itemId);
  if (!item) fail(`item ${input.itemId} does not exist`);
  if (item.state !== "succeeded" || item.result?.qualityOverall === "blocked") {
    fail("only a succeeded draft without quality blockers can be handed off");
  }
  if (!input.reviewerId.trim() || Number.isNaN(Date.parse(input.decidedAt))) fail("reviewer and decision time are required");
  if (job.handoffs.some((handoff) => handoff.itemId === item.itemId)) fail("editorial handoff already recorded");
  const note = input.note?.trim();
  const next: BatchJobRecord = {
    ...job,
    updatedAt: input.decidedAt,
    handoffs: [
      ...job.handoffs,
      {
        handoffId: `${item.itemId}/handoff`,
        itemId: item.itemId,
        reviewerId: input.reviewerId.trim(),
        decidedAt: input.decidedAt,
        decision: "submit-for-canonical-registration",
        registeredInContentReview: false,
        ...(note ? { note } : {}),
      },
    ],
  };
  input.store.save(next);
  const stored = input.store.load(input.batchId);
  if (!stored) fail(`batch ${input.batchId} does not exist`);
  return stored;
}
