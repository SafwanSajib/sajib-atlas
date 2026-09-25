/**
 * One eligible item per call. This function returns when that item is stored.
 * It is not a daemon, a cron loop, or a long request that drains a batch.
 */
import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { runStudioPipeline } from "../pipeline";
import { classifyPipelineResult, classifyThrown } from "./classify";
import { settleBatch } from "./policy";
import { selectNextBatchItem } from "./queue";
import { BATCH_RUNNING_RECLAIM_LIMIT } from "./types";
import type { BatchItemRecord, BatchJobRecord, BatchJobStore, BatchTickResult } from "./types";

function fail(message: string): never {
  throw new Error(`Batch production: ${message}`);
}

function requireJob(store: BatchJobStore, batchId: string): BatchJobRecord {
  const job = store.load(batchId);
  if (!job) fail(`batch ${batchId} does not exist`);
  return job;
}

function replaceItem(job: BatchJobRecord, item: BatchItemRecord): BatchJobRecord {
  return { ...job, items: job.items.map((current) => (current.itemId === item.itemId ? item : current)) };
}

function idle(job: BatchJobRecord, reason: BatchTickResult["reason"]): BatchTickResult {
  return { batchId: job.batchId, processed: false, reason, batchState: job.state };
}

function done(job: BatchJobRecord, item: BatchItemRecord): BatchTickResult {
  return {
    batchId: job.batchId,
    processed: true,
    reason: "processed",
    itemId: item.itemId,
    itemState: item.state,
    batchState: job.state,
  };
}

export async function tickBatchWorker(input: {
  store: BatchJobStore;
  batchId: string;
  provider: AiProvider;
  now: string;
}): Promise<BatchTickResult> {
  const job = requireJob(input.store, input.batchId);
  if (job.state === "draft") return idle(job, "not_queued");
  if (job.state === "paused") return idle(job, "paused");
  if (job.state === "completed" || job.state === "completed_with_failures") return idle(job, "terminal");

  const selected = selectNextBatchItem(job);
  if (!selected) {
    const settled = settleBatch(job, input.now);
    input.store.save(settled);
    return idle(settled, "idle");
  }

  if (selected.state === "running" && selected.reclaims >= BATCH_RUNNING_RECLAIM_LIMIT) {
    const failed: BatchItemRecord = {
      ...selected,
      state: "failed",
      updatedAt: input.now,
      result: {
        completedAt: input.now,
        pipelineOk: false,
        safeMessage: "Interrupted batch item exceeded the single reclaim.",
      },
    };
    const settled = settleBatch(replaceItem(job, failed), input.now);
    input.store.save(settled);
    return done(settled, failed);
  }

  const started: BatchItemRecord = {
    ...selected,
    state: "running",
    startedAt: selected.startedAt ?? input.now,
    updatedAt: input.now,
    executions: selected.executions + 1,
    reclaims: selected.state === "running" ? selected.reclaims + 1 : selected.reclaims,
  };
  const runningJob: BatchJobRecord = { ...replaceItem(job, started), state: "running", updatedAt: input.now };
  input.store.save(runningJob);

  const classified = await runStudioPipeline({
    identity: started.identity,
    ...(started.sourceText !== undefined ? { sourceText: started.sourceText } : {}),
    ...(started.sourcePacket ? { sourcePacket: started.sourcePacket } : {}),
    provider: input.provider,
    evaluatedAt: input.now,
  }).then(
    (result) => classifyPipelineResult(result, input.now),
    (error: unknown) => classifyThrown(error, input.now),
  );

  const finished: BatchItemRecord = {
    ...started,
    state: classified.state,
    updatedAt: input.now,
    rateLimitedResults: started.rateLimitedResults + (classified.state === "rate_limited" ? 1 : 0),
    result: classified.result,
  };
  const settled = settleBatch(replaceItem(runningJob, finished), input.now);
  input.store.save(settled);
  return done(settled, finished);
}
