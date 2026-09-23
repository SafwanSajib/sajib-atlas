import { BATCH_RATE_LIMIT_AUTOMATIC_RETRIES } from "./types";
import type { BatchItemRecord, BatchJobRecord, BatchJobState } from "./types";

export function isAutomaticallyEligible(item: BatchItemRecord): boolean {
  if (item.state === "pending") return true;
  return item.state === "rate_limited" && item.rateLimitedResults <= BATCH_RATE_LIMIT_AUTOMATIC_RETRIES;
}

export function settleBatch(job: BatchJobRecord, now: string): BatchJobRecord {
  if (job.state === "paused" || job.state === "draft") {
    return { ...job, updatedAt: now };
  }
  const running = job.items.filter((item) => item.state === "running").sort((left, right) => left.ordinal - right.ordinal);
  const eligible = running[0] ?? job.items.filter(isAutomaticallyEligible).sort((left, right) => left.ordinal - right.ordinal)[0];
  const state: BatchJobState = eligible
    ? "running"
    : job.items.every((item) => item.state === "succeeded")
      ? "completed"
      : "completed_with_failures";
  return { ...job, state, updatedAt: now };
}
