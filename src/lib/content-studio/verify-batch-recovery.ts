import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AiProvider, AiProviderOutput } from "@/lib/ai-intelligence/provider";
import { pilotPackages } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import { getReviewRecords } from "@/lib/content/review/index";
import { resolveStudioIdentity } from "./index";
import type { StudioTopicIdentity, StudioTopicIdentityInput } from "./types";
import {
  createFileBatchJobStore,
  createMemoryBatchJobStore,
  createPersistentBatch,
  isAutomaticallyEligible,
  projectBatchInbox,
  queueBatch,
  selectNextBatchItem,
  tickBatchWorker,
} from "./batch-engine/index";
import * as batchEngine from "./batch-engine/index";
import type { BatchItemState, BatchJobRecord, BatchJobStore } from "./batch-engine/index";

const recoverFailedBatchItem = batchEngine.recoverFailedBatchItem;
assert.equal(typeof recoverFailedBatchItem, "function", "explicit failed-item recovery is missing");

const T0 = "2026-09-23T03:00:00.000Z";
const reviewBefore = getReviewRecords().map((record) => record.content.topic.id).slice().sort();

function topic(slug: string, title = slug): StudioTopicIdentityInput {
  return { subjectSlug: "geography", topicSlug: slug, title, summary: `Draft ${title}` };
}

function remapPackage(pkg: PilotPackage, identity: StudioTopicIdentity): PilotPackage {
  return {
    ...pkg,
    disciplineId: identity.disciplineId,
    subjectId: identity.subjectId,
    topic: { ...pkg.topic, id: identity.topicId, disciplineId: identity.disciplineId, subjectId: identity.subjectId, title: identity.title, summary: identity.summary },
  };
}

const sampleIdentity = resolveStudioIdentity(topic("sample-draft", "Studio Sample Draft"));
const successText = JSON.stringify(remapPackage(pilotPackages[2], sampleIdentity));

function successProvider(seen: { calls: number; running: string[] }, store: BatchJobStore, batchId: string): AiProvider {
  return {
    async complete(): Promise<AiProviderOutput> {
      seen.calls += 1;
      const running = store.load(batchId)?.items.filter((item) => item.state === "running") ?? [];
      assert.equal(running.length, 1);
      seen.running.push(running[0]?.itemId ?? "");
      return { status: "success", text: successText };
    },
  };
}

function failingProvider(seen: { calls: number }): AiProvider {
  return {
    async complete(): Promise<AiProviderOutput> {
      seen.calls += 1;
      return { status: "failed", text: "The AI provider is unavailable." };
    },
  };
}

function mark(job: BatchJobRecord, states: Readonly<Record<string, { state: BatchItemState; executions: number }>>): BatchJobRecord {
  const items = job.items.map((item) => {
    const next = states[item.topicSlug];
    if (!next) return item;
    return {
      ...item,
      state: next.state,
      executions: next.executions,
      updatedAt: T0,
      ...(next.state === "succeeded" || next.state === "pending" || next.state === "running"
        ? {}
        : {
            result: {
              completedAt: T0,
              pipelineOk: false,
              pipelineErrorCode: "provider_failure" as const,
              safeMessage: "The AI provider is unavailable.",
            },
          }),
    };
  });
  const allSucceeded = items.every((item) => item.state === "succeeded");
  const anyOpen = items.some((item) => item.state === "pending" || item.state === "running" || isAutomaticallyEligible(item));
  return {
    ...job,
    items,
    state: anyOpen ? "running" : allSucceeded ? "completed" : "completed_with_failures",
    updatedAt: T0,
  };
}

function persist(store: BatchJobStore, batchNumber: number, topics: readonly ReturnType<typeof topic>[], states: Readonly<Record<string, { state: BatchItemState; executions: number }>>) {
  const created = createPersistentBatch({
    store,
    batchNumber,
    createdAt: T0,
    topics: topics.map((identity) => ({ identity, sourceText: `Existing notes for ${identity.topicSlug}.` })),
  });
  const queued = queueBatch(store, created.batchId, T0);
  const saved = mark(queued, states);
  store.save(saved);
  return store.load(created.batchId);
}

const pair = createMemoryBatchJobStore();
const paired = persist(pair, 41, [topic("water-cycle", "The Water Cycle"), topic("atmosphere", "Atmosphere")], {
  "water-cycle": { state: "succeeded", executions: 1 },
  atmosphere: { state: "failed", executions: 1 },
});
assert.ok(paired);
assert.equal(selectNextBatchItem(paired), null, "a failed item is not an automatic next item");
const seenA = { calls: 0, running: [] as string[] };
const recoveredPair = recoverFailedBatchItem(pair, paired.batchId, paired.items[1]?.itemId ?? "", T0);
assert.equal(recoveredPair.items[0]?.executions, 1);
assert.equal(recoveredPair.items[0]?.state, "succeeded");
assert.equal(selectNextBatchItem(recoveredPair)?.itemId, paired.items[1]?.itemId);
await tickBatchWorker({ store: pair, batchId: paired.batchId, provider: successProvider(seenA, pair, paired.batchId), now: T0 });
assert.equal(seenA.calls, 1);
assert.deepEqual(seenA.running, [paired.items[1]?.itemId]);
assert.equal(pair.load(paired.batchId)?.items[0]?.executions, 1);
assert.equal(pair.load(paired.batchId)?.items[0]?.state, "succeeded");

const one = createMemoryBatchJobStore();
const single = persist(one, 42, [topic("atmosphere", "Atmosphere")], { atmosphere: { state: "failed", executions: 1 } });
assert.ok(single);
recoverFailedBatchItem(one, single.batchId, single.items[0]?.itemId ?? "", T0);
const seenB = { calls: 0, running: [] as string[] };
const recoveredTick = await tickBatchWorker({ store: one, batchId: single.batchId, provider: successProvider(seenB, one, single.batchId), now: T0 });
assert.equal(recoveredTick.processed, true);
assert.equal(one.load(single.batchId)?.items[0]?.state, "succeeded");
assert.equal(one.load(single.batchId)?.items[0]?.executions, 2);
assert.equal(one.load(single.batchId)?.items[0]?.result?.draft?.workflowState, "draft");
const inbox = one.load(single.batchId);
assert.ok(inbox);
assert.notEqual(inbox.items[0]?.result?.qualityOverall, "blocked");
assert.equal(projectBatchInbox(inbox).some((entry) => entry.lane === "ready_for_editorial_review"), true);

const again = createMemoryBatchJobStore();
const againJob = persist(again, 43, [topic("plate-tectonics", "Plate Tectonics")], { "plate-tectonics": { state: "failed", executions: 1 } });
assert.ok(againJob);
recoverFailedBatchItem(again, againJob.batchId, againJob.items[0]?.itemId ?? "", T0);
const seenC = { calls: 0 };
const firstFailure = await tickBatchWorker({ store: again, batchId: againJob.batchId, provider: failingProvider(seenC), now: T0 });
assert.equal(firstFailure.processed, true);
assert.equal(seenC.calls, 1);
assert.equal(again.load(againJob.batchId)?.items[0]?.executions, 2);
assert.equal(again.load(againJob.batchId)?.items[0]?.state, "failed");
const second = await tickBatchWorker({ store: again, batchId: againJob.batchId, provider: failingProvider(seenC), now: T0 });
assert.equal(second.processed, false);
assert.equal(seenC.calls, 1);
assert.equal(again.load(againJob.batchId)?.items[0]?.executions, 2);
assert.equal(selectNextBatchItem(again.load(againJob.batchId)!), null);

for (const [number, slug, state] of [[44, "blocked-draft", "quality_blocked"], [45, "thin-source", "source_insufficient"]] as const) {
  const store = createMemoryBatchJobStore();
  const job = persist(store, number, [topic(slug, slug)], { [slug]: { state, executions: 1 } });
  assert.ok(job);
  assert.equal(isAutomaticallyEligible(job.items[0]!), false);
  assert.equal(selectNextBatchItem(job), null);
  assert.throws(() => recoverFailedBatchItem(store, job.batchId, job.items[0]?.itemId ?? "", T0));
  assert.equal(store.load(job.batchId)?.items[0]?.executions, 1);
  assert.equal(store.load(job.batchId)?.items[0]?.state, state);
}

const dir = mkdtempSync(join(tmpdir(), "sajib-recovery-"));
const files = createFileBatchJobStore(dir);
const liveShape = persist(files, 301, [
  topic("water-cycle", "The Water Cycle"),
  topic("atmosphere", "Atmosphere"),
  topic("plate-tectonics", "Plate Tectonics"),
], {
  "water-cycle": { state: "succeeded", executions: 1 },
  atmosphere: { state: "failed", executions: 1 },
  "plate-tectonics": { state: "failed", executions: 1 },
});
assert.ok(liveShape);
const reloaded = createFileBatchJobStore(dir).load(liveShape.batchId);
assert.ok(reloaded);
assert.deepEqual(reloaded.items.map((item) => [item.state, item.executions]), [
  ["succeeded", 1],
  ["failed", 1],
  ["failed", 1],
]);
recoverFailedBatchItem(reloaded && createFileBatchJobStore(dir), reloaded.batchId, reloaded.items[1]?.itemId ?? "", T0);
const fresh = createFileBatchJobStore(dir);
const seenD = { calls: 0, running: [] as string[] };
await tickBatchWorker({ store: fresh, batchId: reloaded.batchId, provider: successProvider(seenD, fresh, reloaded.batchId), now: T0 });
const after = createFileBatchJobStore(dir).load(reloaded.batchId);
assert.ok(after);
assert.deepEqual(after.items.map((item) => [item.topicSlug, item.state, item.executions]), [
  ["water-cycle", "succeeded", 1],
  ["atmosphere", "succeeded", 2],
  ["plate-tectonics", "failed", 1],
]);
assert.equal(seenD.calls, 1);
assert.equal(after.state, "completed_with_failures");
assert.notEqual(after.state, "running");
assert.notEqual(after.state, "queued");

const both = createMemoryBatchJobStore();
const bothJob = persist(both, 46, [topic("atmosphere", "Atmosphere"), topic("plate-tectonics", "Plate Tectonics")], {
  atmosphere: { state: "failed", executions: 1 },
  "plate-tectonics": { state: "failed", executions: 1 },
});
assert.ok(bothJob);
recoverFailedBatchItem(both, bothJob.batchId, bothJob.items[0]?.itemId ?? "", T0);
recoverFailedBatchItem(both, bothJob.batchId, bothJob.items[1]?.itemId ?? "", T0);
const seenE = { calls: 0, running: [] as string[] };
await tickBatchWorker({ store: both, batchId: bothJob.batchId, provider: successProvider(seenE, both, bothJob.batchId), now: T0 });
await tickBatchWorker({ store: both, batchId: bothJob.batchId, provider: successProvider(seenE, both, bothJob.batchId), now: T0 });
assert.equal(both.load(bothJob.batchId)?.state, "completed");
assert.equal(both.load(bothJob.batchId)?.items.every((item) => item.state === "succeeded"), true);

const persisted = readFileSync(join(dir, "301.json"), "utf8");
assert.equal(persisted.includes("rawText"), false);
assert.equal(persisted.includes("authorization"), false);
assert.equal(persisted.includes("AIza"), false);
assert.equal(/Bearer\s+\S+/.test(persisted), false);
assert.deepEqual(getReviewRecords().map((record) => record.content.topic.id).slice().sort(), reviewBefore);

const studioDir = dirname(fileURLToPath(import.meta.url));
const actions = readFileSync(join(studioDir, "batch-control/actions.ts"), "utf8");
const ui = readFileSync(join(studioDir, "../../components/content-studio/StudioBatchControl.tsx"), "utf8");
assert.match(actions, /recoverFailedBatchItem/);
assert.equal(actions.includes("generateStudioBatchAction"), false);
assert.match(ui, /Recover failed item/);
assert.match(ui, /item\.state === "failed"/);
assert.equal(ui.includes("createServerRoutedProvider"), false);
assert.equal(ui.includes("generateStudioBatchAction"), false);

console.log("Failed-item recovery verification passed.");
