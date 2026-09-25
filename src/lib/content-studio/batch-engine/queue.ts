import { isAutomaticallyEligible } from "./policy";
import type { BatchItemRecord, BatchJobRecord } from "./types";

export function selectNextBatchItem(job: BatchJobRecord): BatchItemRecord | null {
  const byOrdinal = (left: BatchItemRecord, right: BatchItemRecord) => left.ordinal - right.ordinal;
  const running = job.items.filter((item) => item.state === "running").sort(byOrdinal);
  if (running.length > 0) return running[0] ?? null;
  return job.items.filter(isAutomaticallyEligible).sort(byOrdinal)[0] ?? null;
}
