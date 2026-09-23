import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AiProvider, AiProviderOutput } from "@/lib/ai-intelligence/provider";
import { pilotPackages } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import { approveProduction, publishProduction } from "@/lib/content/production/index";
import { getReviewRecords } from "@/lib/content/review/index";
import { resolveStudioIdentity, runStudioBatch } from "./index";
import type { StudioTopicIdentity, StudioTopicIdentityInput } from "./types";
import {
  BATCH_EXECUTION_BOUNDARY,
  BATCH_RATE_LIMIT_AUTOMATIC_RETRIES,
  BATCH_RUNTIME_LIMITATION,
  BATCH_SCHEMA_VERSION,
  BATCH_WORKER_CONCURRENCY,
  createFileBatchJobStore,
  createMemoryBatchJobStore,
  createPersistentBatch,
  listProductionInbox,
  pauseBatch,
  queueBatch,
  recordEditorialHandoff,
  resumeBatch,
  tickBatchWorker,
  updateBatchItemSource,
} from "./batch-engine/index";
import type { BatchJobStore } from "./batch-engine/index";

const T0 = "2026-09-23T00:00:00.000Z";
const reviewBefore = getReviewRecords().map((record) => record.content.topic.id).slice().sort();

function stamp(step: number): string {
  return `2026-09-23T00:${String(step).padStart(2, "0")}:00.000Z`;
}

function topic(slug: string, title = slug): StudioTopicIdentityInput {
  return {
    subjectSlug: "studio",
    topicSlug: slug,
    title,
    summary: `Draft ${slug}`,
  };
}

function remapPackage(pkg: PilotPackage, identity: StudioTopicIdentity): PilotPackage {
  return {
    ...pkg,
    disciplineId: identity.disciplineId,
    subjectId: identity.subjectId,
    topic: {
      ...pkg.topic,
      id: identity.topicId,
      disciplineId: identity.disciplineId,
      subjectId: identity.subjectId,
      title: identity.title,
      summary: identity.summary,
    },
  };
}

const sampleIdentity = resolveStudioIdentity(topic("sample-draft", "Studio Sample Draft"));
const successText = JSON.stringify(remapPackage(pilotPackages[2], sampleIdentity));
const blockedPackage = remapPackage(pilotPackages[2], sampleIdentity);
const blockedText = JSON.stringify({
  ...blockedPackage,
  knowledgeUnits: [...blockedPackage.knowledgeUnits, blockedPackage.knowledgeUnits[0]],
});

function successOutput(): AiProviderOutput {
  return { status: "success", text: successText };
}

function rateLimitedOutput(): AiProviderOutput {
  return {
    status: "failed",
    text: "The AI provider rate-limited the request.",
    callTrace: {
      provider: "gemini",
      attempts: 2,
      retryOccurred: true,
      authorization: "Bearer SUPERSECRET",
      attemptsDetail: [
        { attempt: 1, outcome: "rate_limited", status: 429 },
        { attempt: 2, outcome: "rate_limited Bearer sk-live-SECRETVALUE", status: 429, apiKey: "AIzaSySECRETVALUE" },
      ],
    },
  } as AiProviderOutput;
}

function countingProvider(decide: (call: number) => AiProviderOutput, store: BatchJobStore, batchId: string, seen: { calls: number; running: string[] }): AiProvider {
  return {
    async complete() {
      seen.calls += 1;
      const job = store.load(batchId);
      const running = job?.items.filter((item) => item.state === "running") ?? [];
      assert.equal(running.length, 1, "worker keeps one active item");
      seen.running.push(running[0]?.itemId ?? "");
      return decide(seen.calls);
    },
  };
}

async function tick(store: BatchJobStore, batchId: string, provider: AiProvider, step: number) {
  return tickBatchWorker({ store, batchId, provider, now: stamp(step) });
}

const studioDir = dirname(fileURLToPath(import.meta.url));
const batchSource = readFileSync(join(studioDir, "batch.ts"), "utf8");
const actionSource = readFileSync(join(studioDir, "generate-action.ts"), "utf8");
assert.match(batchSource, /for \(const item of input\.items\)/);
assert.equal(batchSource.includes("batch-engine"), false);
assert.equal(batchSource.includes("BatchJobStore"), false);
assert.equal(actionSource.includes("batch-engine"), false);
assert.equal(BATCH_WORKER_CONCURRENCY, 1);
assert.equal(BATCH_RATE_LIMIT_AUTOMATIC_RETRIES, 1);
assert.equal(BATCH_EXECUTION_BOUNDARY.autonomous, false);
assert.equal(BATCH_EXECUTION_BOUNDARY.persistence, "BatchJobStore");
assert.equal(BATCH_EXECUTION_BOUNDARY.worker, "tickBatchWorker");
assert.equal(BATCH_EXECUTION_BOUNDARY.generation, "runStudioPipeline");
assert.match(BATCH_RUNTIME_LIMITATION, /not an autonomous worker/);
assert.match(BATCH_RUNTIME_LIMITATION, /localStorage/);
assert.match(BATCH_RUNTIME_LIMITATION, /tickBatchWorker/);
assert.match(BATCH_RUNTIME_LIMITATION, /exactly one eligible item/);
assert.match(BATCH_RUNTIME_LIMITATION, /\/content-review/);

const untouched = createMemoryBatchJobStore();
const inRequest = await runStudioBatch({
  items: [
    { id: "legacy-1", identity: topic("legacy-one", "Legacy One"), sourceText: "First legacy source." },
    { id: "legacy-2", identity: topic("legacy-two", "Legacy Two"), sourceText: "Second legacy source." },
  ],
  provider: { async complete() { return successOutput(); } },
});
assert.equal(inRequest.length, 2);
assert.equal(untouched.list().length, 0);

const ids = createMemoryBatchJobStore();
const created = createPersistentBatch({
  store: ids,
  batchNumber: 1,
  createdAt: T0,
  topics: [topic("zeta"), topic("alpha"), topic("middle")].map((identity) => ({ identity, sourceText: `Notes for ${identity.topicSlug}.` })),
});
assert.equal(created.schemaVersion, BATCH_SCHEMA_VERSION);
assert.equal(created.batchId, "studio-batch/001");
assert.equal(created.batchNumber, "001");
assert.equal(created.state, "draft");
assert.deepEqual(created.items.map((item) => item.itemId), [
  "studio-batch/001/item/001/zeta",
  "studio-batch/001/item/002/alpha",
  "studio-batch/001/item/003/middle",
]);
assert.deepEqual(created.items.map((item) => item.state), ["pending", "pending", "pending"]);
assert.equal(created.items[0]?.resolvedTopicId, "topic/studio/zeta");
const again = createMemoryBatchJobStore();
const createdAgain = createPersistentBatch({
  store: again,
  batchNumber: 1,
  createdAt: T0,
  topics: [topic("zeta"), topic("alpha"), topic("middle")].map((identity) => ({ identity, sourceText: `Notes for ${identity.topicSlug}.` })),
});
assert.deepEqual(createdAgain.items.map((item) => item.itemId), created.items.map((item) => item.itemId));
assert.throws(() => createPersistentBatch({
  store: ids,
  batchNumber: 1,
  createdAt: T0,
  topics: [{ identity: topic("zeta"), sourceText: "Notes for zeta." }],
}));
const loaded = ids.load("studio-batch/001");
assert.equal(loaded?.batchId, created.batchId);
assert.equal(loaded?.items.length, 3);
if (loaded) loaded.state = "completed";
assert.equal(ids.load("studio-batch/001")?.state, "draft");

const queued = queueBatch(ids, created.batchId, stamp(1));
assert.equal(queued.state, "queued");
assert.deepEqual(queued.items.map((item) => item.state), ["pending", "pending", "pending"]);

const orderSeen = { calls: 0, running: [] as string[] };
const ordered = countingProvider(() => successOutput(), ids, created.batchId, orderSeen);
const first = await tick(ids, created.batchId, ordered, 2);
assert.equal(first.processed, true);
assert.equal(first.itemId, "studio-batch/001/item/001/zeta");
assert.equal(ids.load(created.batchId)?.state, "running");
assert.equal(ids.load(created.batchId)?.items[0]?.state, "succeeded");
assert.equal(ids.load(created.batchId)?.items[1]?.state, "pending");
assert.equal(ids.load(created.batchId)?.items[0]?.executions, 1);
assert.equal(ids.load(created.batchId)?.items[0]?.result?.draft?.workflowState, "draft");
assert.notEqual(ids.load(created.batchId)?.items[0]?.result?.qualityOverall, "blocked");
assert.equal(orderSeen.running[0], "studio-batch/001/item/001/zeta");
const second = await tick(ids, created.batchId, ordered, 3);
const third = await tick(ids, created.batchId, ordered, 4);
assert.equal(second.itemId, "studio-batch/001/item/002/alpha");
assert.equal(third.itemId, "studio-batch/001/item/003/middle");
assert.deepEqual(orderSeen.running, created.items.map((item) => item.itemId));
assert.equal(orderSeen.calls, 3);
const drained = await tick(ids, created.batchId, ordered, 5);
assert.equal(drained.processed, false);
assert.equal(orderSeen.calls, 3);
assert.equal(ids.load(created.batchId)?.state, "completed");
assert.deepEqual(ids.load(created.batchId)?.items.map((item) => item.executions), [1, 1, 1]);

const durableDir = mkdtempSync(join(tmpdir(), "sajib-batch-"));
const files = createFileBatchJobStore(durableDir);
const fileBatch = createPersistentBatch({
  store: files,
  batchNumber: 12,
  createdAt: T0,
  topics: [{ identity: topic("durable-draft", "Durable Draft"), sourceText: "Durable source notes." }],
});
queueBatch(files, fileBatch.batchId, stamp(1));
const fileProvider = countingProvider(() => successOutput(), files, fileBatch.batchId, { calls: 0, running: [] });
await tick(files, fileBatch.batchId, fileProvider, 2);
const reopened = createFileBatchJobStore(durableDir);
const roundTrip = reopened.load(fileBatch.batchId);
assert.equal(roundTrip?.state, "completed");
assert.equal(roundTrip?.items[0]?.state, "succeeded");
assert.equal(roundTrip?.items[0]?.result?.draft?.content.topic.id, "topic/studio/durable-draft");
assert.equal(roundTrip?.items[0]?.result?.pipelineOk, true);
const persistedJson = readFileSync(join(durableDir, "012.json"), "utf8");
assert.match(persistedJson, /studio-batch\/012/);
assert.equal(persistedJson.includes("SUPERSECRET"), false);

const secretStore = createMemoryBatchJobStore();
const secretBatch = createPersistentBatch({
  store: secretStore,
  batchNumber: 2,
  createdAt: T0,
  topics: [{ identity: topic("rate-limited-draft", "Rate Limited Draft"), sourceText: "Rate limit source notes." }],
});
queueBatch(secretStore, secretBatch.batchId, stamp(1));
const secretCalls = { calls: 0, running: [] as string[] };
const secretProvider = countingProvider((call) => (call === 1 ? rateLimitedOutput() : successOutput()), secretStore, secretBatch.batchId, secretCalls);
const limited = await tick(secretStore, secretBatch.batchId, secretProvider, 2);
assert.equal(limited.processed, true);
assert.equal(secretStore.load(secretBatch.batchId)?.items[0]?.state, "rate_limited");
assert.equal(secretStore.load(secretBatch.batchId)?.state, "running");
assert.equal(secretCalls.calls, 1);
assert.equal(secretStore.load(secretBatch.batchId)?.items[0]?.result?.providerTrace?.attempts, 2);
assert.equal(secretStore.load(secretBatch.batchId)?.items[0]?.result?.providerTrace?.retryOccurred, true);
assert.equal(secretStore.load(secretBatch.batchId)?.items[0]?.result?.providerTrace?.attemptsDetail[0]?.status, 429);
const secretJson = JSON.stringify(secretStore.load(secretBatch.batchId));
assert.equal(secretJson.includes("SUPERSECRET"), false);
assert.equal(secretJson.includes("SECRETVALUE"), false);
assert.equal(secretJson.includes("AIza"), false);
assert.equal(secretJson.includes("authorization"), false);
assert.equal(secretJson.includes("apiKey"), false);
resumeBatch(secretStore, secretBatch.batchId, stamp(3));
const retried = await tick(secretStore, secretBatch.batchId, secretProvider, 4);
assert.equal(retried.itemId, secretBatch.items[0]?.itemId);
assert.equal(secretStore.load(secretBatch.batchId)?.items[0]?.state, "succeeded");
assert.equal(secretCalls.calls, 2);
const afterRetry = await tick(secretStore, secretBatch.batchId, secretProvider, 5);
assert.equal(afterRetry.processed, false);
assert.equal(secretCalls.calls, 2);

const exhausted = createMemoryBatchJobStore();
const exhaustedBatch = createPersistentBatch({
  store: exhausted,
  batchNumber: 3,
  createdAt: T0,
  topics: [{ identity: topic("still-limited", "Still Limited"), sourceText: "Still limited source." }],
});
queueBatch(exhausted, exhaustedBatch.batchId, stamp(1));
const exhaustedCalls = { calls: 0, running: [] as string[] };
const exhaustedProvider = countingProvider(() => rateLimitedOutput(), exhausted, exhaustedBatch.batchId, exhaustedCalls);
await tick(exhausted, exhaustedBatch.batchId, exhaustedProvider, 2);
await tick(exhausted, exhaustedBatch.batchId, exhaustedProvider, 3);
const stopped = await tick(exhausted, exhaustedBatch.batchId, exhaustedProvider, 4);
assert.equal(exhaustedCalls.calls, 2);
assert.equal(stopped.processed, false);
assert.equal(exhausted.load(exhaustedBatch.batchId)?.items[0]?.state, "rate_limited");
assert.equal(exhausted.load(exhaustedBatch.batchId)?.state, "completed_with_failures");

const blockedStore = createMemoryBatchJobStore();
const blockedBatch = createPersistentBatch({
  store: blockedStore,
  batchNumber: 4,
  createdAt: T0,
  topics: [
    { identity: topic("blocked-draft", "Blocked Draft"), sourceText: "Blocked source notes." },
    { identity: topic("after-blocked", "After Blocked"), sourceText: "Later source notes." },
  ],
});
queueBatch(blockedStore, blockedBatch.batchId, stamp(1));
const blockedCalls = { calls: 0, running: [] as string[] };
const blockedProvider = countingProvider((call) => (call === 1 ? { status: "success", text: blockedText } : successOutput()), blockedStore, blockedBatch.batchId, blockedCalls);
const blockedTick = await tick(blockedStore, blockedBatch.batchId, blockedProvider, 2);
assert.equal(blockedTick.itemId, "studio-batch/004/item/001/blocked-draft");
assert.equal(blockedStore.load(blockedBatch.batchId)?.items[0]?.state, "quality_blocked");
assert.equal(blockedStore.load(blockedBatch.batchId)?.items[0]?.result?.qualityOverall, "blocked");
assert.equal(blockedStore.load(blockedBatch.batchId)?.items[0]?.result?.draft?.workflowState, "draft");
await tick(blockedStore, blockedBatch.batchId, blockedProvider, 3);
const blockedAgain = await tick(blockedStore, blockedBatch.batchId, blockedProvider, 4);
assert.equal(blockedAgain.processed, false);
assert.equal(blockedCalls.calls, 2);
assert.equal(blockedStore.load(blockedBatch.batchId)?.items[0]?.executions, 1);
assert.equal(blockedStore.load(blockedBatch.batchId)?.items[0]?.state, "quality_blocked");
assert.equal(blockedStore.load(blockedBatch.batchId)?.items[1]?.state, "succeeded");
assert.throws(() => recordEditorialHandoff({
  store: blockedStore,
  batchId: blockedBatch.batchId,
  itemId: "studio-batch/004/item/001/blocked-draft",
  reviewerId: "editor/local",
  decidedAt: stamp(5),
}));

const sourceStore = createMemoryBatchJobStore();
const sourceBatch = createPersistentBatch({
  store: sourceStore,
  batchNumber: 5,
  createdAt: T0,
  topics: [{ identity: topic("thin-source", "Thin Source"), sourceText: "   " }],
});
queueBatch(sourceStore, sourceBatch.batchId, stamp(1));
const sourceCalls = { calls: 0, running: [] as string[] };
const sourceProvider = countingProvider(() => successOutput(), sourceStore, sourceBatch.batchId, sourceCalls);
await tick(sourceStore, sourceBatch.batchId, sourceProvider, 2);
assert.equal(sourceCalls.calls, 0);
assert.equal(sourceStore.load(sourceBatch.batchId)?.items[0]?.state, "source_insufficient");
assert.equal(sourceStore.load(sourceBatch.batchId)?.items[0]?.result?.pipelineErrorCode, "invalid_source");
await tick(sourceStore, sourceBatch.batchId, sourceProvider, 3);
assert.equal(sourceCalls.calls, 0);
assert.equal(sourceStore.load(sourceBatch.batchId)?.state, "completed_with_failures");
const previousFingerprint = sourceStore.load(sourceBatch.batchId)?.items[0]?.sourceFingerprint;
updateBatchItemSource({
  store: sourceStore,
  batchId: sourceBatch.batchId,
  itemId: "studio-batch/005/item/001/thin-source",
  sourceText: "Replaced source notes that are specific enough to draft from.",
  now: stamp(4),
});
assert.equal(sourceStore.load(sourceBatch.batchId)?.items[0]?.state, "pending");
assert.notEqual(sourceStore.load(sourceBatch.batchId)?.items[0]?.sourceFingerprint, previousFingerprint);
assert.equal(sourceStore.load(sourceBatch.batchId)?.state, "running");
await tick(sourceStore, sourceBatch.batchId, sourceProvider, 5);
assert.equal(sourceCalls.calls, 1);
assert.equal(sourceStore.load(sourceBatch.batchId)?.items[0]?.state, "succeeded");

const failureStore = createMemoryBatchJobStore();
const failureBatch = createPersistentBatch({
  store: failureStore,
  batchNumber: 6,
  createdAt: T0,
  topics: [
    { identity: topic("bad-output", "Bad Output"), sourceText: "Bad output source." },
    { identity: topic("good-output", "Good Output"), sourceText: "Good output source." },
  ],
});
queueBatch(failureStore, failureBatch.batchId, stamp(1));
const failureCalls = { calls: 0, running: [] as string[] };
const rawSentinel = "RAW_PROVIDER_BODY_SHOULD_NOT_PERSIST";
const failureProvider = countingProvider((call) => {
  if (call === 1) {
    return { status: "success", text: `Leading prose ${rawSentinel}` } as AiProviderOutput;
  }
  return successOutput();
}, failureStore, failureBatch.batchId, failureCalls);
await tick(failureStore, failureBatch.batchId, failureProvider, 2);
await tick(failureStore, failureBatch.batchId, failureProvider, 3);
assert.equal(failureStore.load(failureBatch.batchId)?.items[0]?.state, "failed");
assert.equal(failureStore.load(failureBatch.batchId)?.items[1]?.state, "succeeded");
assert.equal(failureStore.load(failureBatch.batchId)?.state, "completed_with_failures");
assert.equal(failureCalls.calls, 2);
const failureJson = JSON.stringify(failureStore.load(failureBatch.batchId));
assert.equal(failureJson.includes(rawSentinel), false);
assert.equal(failureJson.includes("rawText"), false);
const thrown = createMemoryBatchJobStore();
const thrownBatch = createPersistentBatch({
  store: thrown,
  batchNumber: 7,
  createdAt: T0,
  topics: [
    { identity: topic("throws", "Throws"), sourceText: "Throwing source." },
    { identity: topic("continues", "Continues"), sourceText: "Continuing source." },
  ],
});
queueBatch(thrown, thrownBatch.batchId, stamp(1));
let thrownCalls = 0;
const throwingProvider: AiProvider = {
  async complete() {
    thrownCalls += 1;
    if (thrownCalls === 1) throw new Error("provider process failed Bearer SUPERSECRET");
    return successOutput();
  },
};
await tick(thrown, thrownBatch.batchId, throwingProvider, 2);
await tick(thrown, thrownBatch.batchId, throwingProvider, 3);
assert.equal(thrown.load(thrownBatch.batchId)?.items[0]?.state, "failed");
assert.equal(thrown.load(thrownBatch.batchId)?.items[1]?.state, "succeeded");
assert.equal(JSON.stringify(thrown.load(thrownBatch.batchId)).includes("SUPERSECRET"), false);

const resumeStore = createMemoryBatchJobStore();
const resumeBatchJob = createPersistentBatch({
  store: resumeStore,
  batchNumber: 8,
  createdAt: T0,
  topics: [
    { identity: topic("done-one", "Done One"), sourceText: "Done one source." },
    { identity: topic("limited-two", "Limited Two"), sourceText: "Limited two source." },
    { identity: topic("done-three", "Done Three"), sourceText: "Done three source." },
  ],
});
queueBatch(resumeStore, resumeBatchJob.batchId, stamp(1));
const resumeCalls = { calls: 0, running: [] as string[] };
const resumeProvider = countingProvider((call) => (call === 2 ? rateLimitedOutput() : successOutput()), resumeStore, resumeBatchJob.batchId, resumeCalls);
await tick(resumeStore, resumeBatchJob.batchId, resumeProvider, 2);
await tick(resumeStore, resumeBatchJob.batchId, resumeProvider, 3);
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[0]?.state, "succeeded");
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[1]?.state, "rate_limited");
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[2]?.state, "pending");
resumeBatch(resumeStore, resumeBatchJob.batchId, stamp(4));
await tick(resumeStore, resumeBatchJob.batchId, resumeProvider, 5);
assert.equal(resumeCalls.running[2], "studio-batch/008/item/002/limited-two");
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[0]?.executions, 1);
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[1]?.state, "succeeded");
await tick(resumeStore, resumeBatchJob.batchId, resumeProvider, 6);
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[2]?.state, "succeeded");
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.items[0]?.executions, 1);
assert.equal(resumeCalls.calls, 4);
assert.equal(resumeStore.load(resumeBatchJob.batchId)?.state, "completed");

const pauseStore = createMemoryBatchJobStore();
const pauseJob = createPersistentBatch({
  store: pauseStore,
  batchNumber: 9,
  createdAt: T0,
  topics: [{ identity: topic("paused-topic", "Paused Topic"), sourceText: "Paused source." }],
});
assert.equal((await tick(pauseStore, pauseJob.batchId, { async complete() { return successOutput(); } }, 1)).processed, false);
assert.equal(pauseStore.load(pauseJob.batchId)?.state, "draft");
queueBatch(pauseStore, pauseJob.batchId, stamp(1));
pauseBatch(pauseStore, pauseJob.batchId, stamp(2));
const pauseCalls = { calls: 0 };
const pauseProvider: AiProvider = {
  async complete() {
    pauseCalls.calls += 1;
    return successOutput();
  },
};
assert.equal((await tick(pauseStore, pauseJob.batchId, pauseProvider, 3)).processed, false);
assert.equal(pauseCalls.calls, 0);
assert.equal(pauseStore.load(pauseJob.batchId)?.items[0]?.state, "pending");
resumeBatch(pauseStore, pauseJob.batchId, stamp(4));
await tick(pauseStore, pauseJob.batchId, pauseProvider, 5);
assert.equal(pauseCalls.calls, 1);
assert.equal(pauseStore.load(pauseJob.batchId)?.items[0]?.state, "succeeded");

const hundred = createMemoryBatchJobStore();
const hundredTopics = Array.from({ length: 100 }, (_, index) => {
  const slug = `topic-${String(index + 1).padStart(3, "0")}`;
  return { identity: topic(slug, `Topic ${index + 1}`), sourceText: `Source notes for ${slug}.` };
});
const hundredBatch = createPersistentBatch({ store: hundred, batchNumber: 100, createdAt: T0, topics: hundredTopics });
assert.equal(hundredBatch.items.length, 100);
assert.equal(hundredBatch.items.every((item) => item.state === "pending"), true);
assert.equal(hundredBatch.items[99]?.itemId, "studio-batch/100/item/100/topic-100");
queueBatch(hundred, hundredBatch.batchId, stamp(1));
const hundredCalls = { calls: 0, running: [] as string[] };
await tick(hundred, hundredBatch.batchId, countingProvider(() => successOutput(), hundred, hundredBatch.batchId, hundredCalls), 2);
assert.equal(hundredCalls.calls, 1);
assert.equal(hundred.load(hundredBatch.batchId)?.items[0]?.state, "succeeded");
assert.equal(hundred.load(hundredBatch.batchId)?.items.slice(1).every((item) => item.state === "pending"), true);
assert.equal(hundred.load(hundredBatch.batchId)?.state, "running");

const crashed = createMemoryBatchJobStore();
const crashedBatch = createPersistentBatch({
  store: crashed,
  batchNumber: 10,
  createdAt: T0,
  topics: [
    { identity: topic("interrupted", "Interrupted"), sourceText: "Interrupted source." },
    { identity: topic("waiting", "Waiting"), sourceText: "Waiting source." },
  ],
});
queueBatch(crashed, crashedBatch.batchId, stamp(1));
const interrupted = crashed.load(crashedBatch.batchId);
assert.ok(interrupted);
crashed.save({
  ...interrupted,
  state: "running",
  items: interrupted.items.map((item, index) => index === 0 ? { ...item, state: "running", startedAt: stamp(2), updatedAt: stamp(2) } : item),
});
const crashCalls = { calls: 0, running: [] as string[] };
await tick(crashed, crashedBatch.batchId, countingProvider(() => successOutput(), crashed, crashedBatch.batchId, crashCalls), 3);
assert.equal(crashCalls.calls, 1);
assert.equal(crashCalls.running[0], "studio-batch/010/item/001/interrupted");
assert.equal(crashed.load(crashedBatch.batchId)?.items[0]?.state, "succeeded");
assert.equal(crashed.load(crashedBatch.batchId)?.items[1]?.state, "pending");
const interruptedAgain = crashed.load(crashedBatch.batchId);
assert.ok(interruptedAgain);
crashed.save({
  ...interruptedAgain,
  state: "running",
  items: interruptedAgain.items.map((item, index) => index === 1 ? { ...item, state: "running", reclaims: 1, startedAt: stamp(4), updatedAt: stamp(4) } : item),
});
const beforeBound = crashCalls.calls;
await tick(crashed, crashedBatch.batchId, countingProvider(() => successOutput(), crashed, crashedBatch.batchId, crashCalls), 5);
assert.equal(crashCalls.calls, beforeBound);
assert.equal(crashed.load(crashedBatch.batchId)?.items[1]?.state, "failed");

const inboxStore = createMemoryBatchJobStore();
const inboxBatch = createPersistentBatch({
  store: inboxStore,
  batchNumber: 11,
  createdAt: T0,
  topics: [{ identity: topic("inbox-draft", "Inbox Draft"), sourceText: "Inbox source notes." }],
});
queueBatch(inboxStore, inboxBatch.batchId, stamp(1));
await tick(inboxStore, inboxBatch.batchId, { async complete() { return successOutput(); } }, 2);
const beforeHandoff = listProductionInbox(inboxStore);
assert.equal(beforeHandoff.some((entry) => entry.lane === "generated" && entry.itemId.endsWith("/inbox-draft")), true);
assert.equal(beforeHandoff.some((entry) => entry.lane === "ready_for_editorial_review" && entry.itemId.endsWith("/inbox-draft")), true);
assert.equal(beforeHandoff.some((entry) => entry.lane === "quality_blocked"), false);
const handed = recordEditorialHandoff({
  store: inboxStore,
  batchId: inboxBatch.batchId,
  itemId: "studio-batch/011/item/001/inbox-draft",
  reviewerId: "editor/local",
  decidedAt: stamp(3),
  note: "Ready for a separate canonical registration decision.",
});
assert.equal(handed.handoffs[0]?.registeredInContentReview, false);
assert.equal(handed.handoffs[0]?.decision, "submit-for-canonical-registration");
assert.equal(handed.items[0]?.result?.draft?.workflowState, "draft");
assert.throws(() => approveProduction(handed.items[0]?.result?.draft ?? inboxBatch.items[0].result!.draft!));
const afterLanes = listProductionInbox(inboxStore);
assert.equal(afterLanes.some((entry) => entry.lane === "ready_for_editorial_review"), false);
assert.equal(afterLanes.some((entry) => entry.lane === "generated"), true);
assert.deepEqual(getReviewRecords().map((record) => record.content.topic.id).slice().sort(), reviewBefore);
assert.equal(reviewBefore.includes("topic/studio/inbox-draft"), false);

const mixedInbox = listProductionInbox(blockedStore);
assert.equal(mixedInbox.some((entry) => entry.lane === "quality_blocked"), true);
assert.equal(mixedInbox.some((entry) => entry.lane === "generated"), true);
assert.equal(listProductionInbox(sourceStore).some((entry) => entry.lane === "source_insufficient"), false);
assert.equal(listProductionInbox(exhausted).some((entry) => entry.lane === "rate_limited"), true);
assert.equal(listProductionInbox(failureStore).some((entry) => entry.lane === "failed"), true);

const engineDir = join(studioDir, "batch-engine");
const engineSources = ["worker.ts", "classify.ts", "handoff.ts", "inbox.ts", "definition.ts", "queue.ts", "store.ts", "index.ts"]
  .map((name) => readFileSync(join(engineDir, name), "utf8"))
  .join("\n");
assert.match(readFileSync(join(engineDir, "worker.ts"), "utf8"), /runStudioPipeline/);
assert.equal(engineSources.includes("generateStudioDraft"), false);
assert.equal(engineSources.includes("parseStudioPackage"), false);
assert.equal(engineSources.includes("evaluateProductionQuality"), false);
assert.equal(engineSources.includes("ai-providers/gemini"), false);
assert.equal(engineSources.includes("getReviewRecords"), false);
assert.equal(engineSources.includes("approveProduction"), false);
assert.equal(engineSources.includes("publishProduction"), false);
assert.equal(engineSources.includes("supabase"), false);
assert.equal(engineSources.includes("redis"), false);
assert.equal(/while\s*\(/.test(readFileSync(join(engineDir, "worker.ts"), "utf8")), false);

assert.throws(() => publishProduction(handed.items[0].result!.draft!, stamp(6)));

console.log("Batch production engine verification passed.");
