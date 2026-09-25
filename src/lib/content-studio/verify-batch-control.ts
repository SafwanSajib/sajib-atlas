import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AiProvider, AiProviderOutput } from "@/lib/ai-intelligence/provider";
import { GEMINI_DEFAULT_MODEL, readGeminiProviderConfig } from "@/lib/ai-providers/gemini/config";
import { DEFAULT_GEMINI_FALLBACK, DEFAULT_PRIMARY_PROVIDER } from "@/lib/ai-providers/registry";
import { pilotPackages } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import {
  geographyAtmosphereProductionPackage,
  geographyPlateTectonicsProductionPackage,
  geographyWaterCycleProductionPackage,
} from "@/lib/content/production/index";
import { getReviewRecords } from "@/lib/content/review/index";
import { createFileBatchJobStore, createMemoryBatchJobStore } from "./batch-engine/index";
import { resolveStudioIdentity } from "./index";
import type { StudioTopicIdentity, StudioTopicIdentityInput } from "./types";
import {
  createControlledBatch,
  handoffControlledItem,
  inspectThreeTopicLiveGate,
  loadControlledBatch,
  pauseControlledBatch,
  replaceControlledItemSource,
  resumeControlledBatch,
  startControlledBatch,
  tickControlledBatch,
} from "./batch-control/index";

const T0 = "2026-09-23T01:00:00.000Z";
const reviewBefore = getReviewRecords().map((record) => record.content.topic.id).slice().sort();

function stamp(step: number): string {
  return `2026-09-23T01:${String(step).padStart(2, "0")}:00.000Z`;
}

function topic(slug: string, title = slug): StudioTopicIdentityInput {
  return { subjectSlug: "studio", topicSlug: slug, title, summary: `Draft ${slug}` };
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

function provider(decide: (call: number) => AiProviderOutput, calls: { n: number }): AiProvider {
  return {
    async complete() {
      calls.n += 1;
      return decide(calls.n);
    },
  };
}

const studioDir = dirname(fileURLToPath(import.meta.url));
const synchronousBatch = readFileSync(join(studioDir, "batch.ts"), "utf8");
assert.match(synchronousBatch, /for \(const item of input\.items\)/);
assert.equal(synchronousBatch.includes("batch-control"), false);

const calls = { n: 0 };
const store = createMemoryBatchJobStore();
const created = createControlledBatch({
  store,
  batchNumber: 1,
  createdAt: T0,
  topics: [topic("zeta", "Zeta"), topic("alpha", "Alpha")].map((identity) => ({
    identity,
    sourceText: `Notes for ${identity.topicSlug}.`,
  })),
});
assert.equal(calls.n, 0);
assert.equal(created.state, "draft");
assert.equal(created.itemCount, 2);
assert.equal(created.backgroundExecution, false);
assert.equal(created.operatorTriggered, true);
assert.deepEqual(created.items.map((item) => item.state), ["pending", "pending"]);
assert.equal(created.batchId, "studio-batch/001");

const failedStore = createMemoryBatchJobStore();
assert.throws(() => createControlledBatch({
  store: failedStore,
  batchNumber: 2,
  createdAt: T0,
  topics: [{ identity: { subjectSlug: "", title: "" }, sourceText: "unused" }],
}));
assert.equal(failedStore.list().length, 0);
assert.equal(calls.n, 0);

const reloaded = loadControlledBatch(store, created.batchId);
assert.equal(reloaded?.batchId, created.batchId);
assert.equal(reloaded?.itemCount, 2);
assert.deepEqual(reloaded?.items.map((item) => item.state), ["pending", "pending"]);

const durableDir = mkdtempSync(join(tmpdir(), "sajib-batch-control-"));
const files = createFileBatchJobStore(durableDir);
const durable = createControlledBatch({
  store: files,
  batchNumber: 21,
  createdAt: T0,
  topics: [{ identity: topic("reloadable", "Reloadable"), sourceText: "Reloadable source notes." }],
});
const reopened = loadControlledBatch(createFileBatchJobStore(durableDir), durable.batchId);
assert.equal(reopened?.state, "draft");
assert.equal(reopened?.items[0]?.state, "pending");
assert.equal(reopened?.itemCount, 1);

const started = startControlledBatch(store, created.batchId, stamp(1));
assert.equal(calls.n, 0);
assert.equal(started.state, "queued");
assert.deepEqual(started.items.map((item) => item.state), ["pending", "pending"]);

const scripted = provider(() => successOutput(), calls);
const firstTick = await tickControlledBatch({ store, batchId: created.batchId, provider: scripted, now: stamp(2) });
assert.equal(calls.n, 1);
assert.equal(firstTick.tick.processed, true);
assert.equal(firstTick.snapshot.items.filter((item) => item.state !== "pending").length, 1);
assert.equal(firstTick.snapshot.items[0]?.state, "succeeded");
assert.equal(firstTick.snapshot.items[1]?.state, "pending");
assert.equal(firstTick.snapshot.state, store.load(created.batchId)?.state);
assert.deepEqual(
  firstTick.snapshot.items.map((item) => item.state),
  store.load(created.batchId)?.items.map((item) => item.state),
);

const resumeStore = createMemoryBatchJobStore();
const resumeCalls = { n: 0 };
const resumeBatch = createControlledBatch({
  store: resumeStore,
  batchNumber: 8,
  createdAt: T0,
  topics: [
    { identity: topic("done-one", "Done One"), sourceText: "Done one source." },
    { identity: topic("limited-two", "Limited Two"), sourceText: "Limited two source." },
    { identity: topic("pending-three", "Pending Three"), sourceText: "Pending three source." },
  ],
});
startControlledBatch(resumeStore, resumeBatch.batchId, stamp(1));
const resumeProvider = provider((call) => (call === 2 ? rateLimitedOutput() : successOutput()), resumeCalls);
await tickControlledBatch({ store: resumeStore, batchId: resumeBatch.batchId, provider: resumeProvider, now: stamp(2) });
await tickControlledBatch({ store: resumeStore, batchId: resumeBatch.batchId, provider: resumeProvider, now: stamp(3) });
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[0]?.state, "succeeded");
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[1]?.state, "rate_limited");
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[2]?.state, "pending");
const secretView = loadControlledBatch(resumeStore, resumeBatch.batchId);
const secretJson = JSON.stringify(secretView);
assert.equal(secretJson.includes("SUPERSECRET"), false);
assert.equal(secretJson.includes("SECRETVALUE"), false);
assert.equal(secretJson.includes("AIza"), false);
assert.equal(secretJson.includes("authorization"), false);
assert.equal(secretJson.includes("apiKey"), false);
assert.equal(secretJson.includes("rawText"), false);
assert.equal(secretView?.items[1]?.safeError?.provider, "gemini");
assert.equal(secretView?.items[1]?.safeError?.attempts, 2);
assert.equal(secretView?.items[1]?.safeError?.retryOccurred, true);
assert.equal(secretView?.items[1]?.safeError?.httpStatus, 429);
assert.match(secretView?.items[1]?.safeError?.outcome ?? "", /rate_limited/);
assert.equal(secretView?.items[1]?.safeError?.pipelineFailureCategory, "provider_failure");
pauseControlledBatch(resumeStore, resumeBatch.batchId, stamp(4));
const pausedTick = await tickControlledBatch({
  store: resumeStore,
  batchId: resumeBatch.batchId,
  provider: resumeProvider,
  now: stamp(5),
});
assert.equal(pausedTick.tick.processed, false);
assert.equal(resumeCalls.n, 2);
resumeControlledBatch(resumeStore, resumeBatch.batchId, stamp(6));
await tickControlledBatch({ store: resumeStore, batchId: resumeBatch.batchId, provider: resumeProvider, now: stamp(7) });
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[0]?.executions, 1);
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[1]?.state, "succeeded");
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[2]?.state, "pending");
await tickControlledBatch({ store: resumeStore, batchId: resumeBatch.batchId, provider: resumeProvider, now: stamp(8) });
assert.equal(resumeCalls.n, 4);
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[0]?.executions, 1);
assert.equal(resumeStore.load(resumeBatch.batchId)?.items[2]?.state, "succeeded");
assert.equal(loadControlledBatch(resumeStore, resumeBatch.batchId)?.state, "completed");
const resumeInbox = loadControlledBatch(resumeStore, resumeBatch.batchId);
assert.equal(resumeInbox?.inbox.filter((entry) => entry.lane === "generated").length, 3);
assert.equal(resumeInbox?.inbox.some((entry) => entry.lane === "ready_for_editorial_review"), true);

const blockedStore = createMemoryBatchJobStore();
const blockedCalls = { n: 0 };
const blocked = createControlledBatch({
  store: blockedStore,
  batchNumber: 4,
  createdAt: T0,
  topics: [
    { identity: topic("blocked-draft", "Blocked Draft"), sourceText: "Blocked source notes." },
    { identity: topic("after-blocked", "After Blocked"), sourceText: "Later source notes." },
  ],
});
startControlledBatch(blockedStore, blocked.batchId, stamp(1));
await tickControlledBatch({
  store: blockedStore,
  batchId: blocked.batchId,
  provider: provider((call) => (call === 1 ? { status: "success", text: blockedText } : successOutput()), blockedCalls),
  now: stamp(2),
});
await tickControlledBatch({
  store: blockedStore,
  batchId: blocked.batchId,
  provider: provider(() => successOutput(), blockedCalls),
  now: stamp(3),
});
const blockedView = loadControlledBatch(blockedStore, blocked.batchId);
assert.equal(blockedView?.items[0]?.state, "quality_blocked");
assert.equal(blockedView?.items[0]?.executions, 1);
assert.equal(blockedView?.state, "completed_with_failures");
assert.equal(blockedView?.inbox.some((entry) => entry.lane === "quality_blocked"), true);
assert.equal(blockedView?.inbox.some((entry) => entry.lane === "generated"), true);
assert.throws(() => handoffControlledItem({
  store: blockedStore,
  batchId: blocked.batchId,
  itemId: blocked.items[0]?.itemId ?? "",
  reviewerId: "editor/local",
  decidedAt: stamp(4),
}));
const extraBlocked = await tickControlledBatch({
  store: blockedStore,
  batchId: blocked.batchId,
  provider: provider(() => successOutput(), blockedCalls),
  now: stamp(5),
});
assert.equal(extraBlocked.tick.processed, false);
assert.equal(blockedStore.load(blocked.batchId)?.items[0]?.executions, 1);

const sourceStore = createMemoryBatchJobStore();
const sourceCalls = { n: 0 };
const thin = createControlledBatch({
  store: sourceStore,
  batchNumber: 5,
  createdAt: T0,
  topics: [{ identity: topic("thin-source", "Thin Source"), sourceText: "   " }],
});
startControlledBatch(sourceStore, thin.batchId, stamp(1));
await tickControlledBatch({
  store: sourceStore,
  batchId: thin.batchId,
  provider: provider(() => successOutput(), sourceCalls),
  now: stamp(2),
});
assert.equal(sourceCalls.n, 0);
assert.equal(loadControlledBatch(sourceStore, thin.batchId)?.items[0]?.state, "source_insufficient");
assert.equal(loadControlledBatch(sourceStore, thin.batchId)?.inbox.some((entry) => entry.lane === "source_insufficient"), true);
await tickControlledBatch({
  store: sourceStore,
  batchId: thin.batchId,
  provider: provider(() => successOutput(), sourceCalls),
  now: stamp(3),
});
assert.equal(sourceCalls.n, 0);
replaceControlledItemSource({
  store: sourceStore,
  batchId: thin.batchId,
  itemId: thin.items[0]?.itemId ?? "",
  sourceText: "Replaced source notes that are specific enough to draft from.",
  now: stamp(4),
});
await tickControlledBatch({
  store: sourceStore,
  batchId: thin.batchId,
  provider: provider(() => successOutput(), sourceCalls),
  now: stamp(5),
});
assert.equal(sourceCalls.n, 1);
assert.equal(loadControlledBatch(sourceStore, thin.batchId)?.items[0]?.state, "succeeded");

const handed = handoffControlledItem({
  store: resumeStore,
  batchId: resumeBatch.batchId,
  itemId: resumeBatch.items[0]?.itemId ?? "",
  reviewerId: "editor/local",
  decidedAt: stamp(9),
  note: "Separate canonical registration decision.",
});
assert.equal(handed.handoffs[0]?.registeredInContentReview, false);
assert.equal(handed.items[0]?.state, "succeeded");
assert.equal(loadControlledBatch(resumeStore, resumeBatch.batchId)?.inbox.some((entry) => entry.itemId === resumeBatch.items[0]?.itemId && entry.lane === "ready_for_editorial_review"), false);
assert.deepEqual(getReviewRecords().map((record) => record.content.topic.id).slice().sort(), reviewBefore);

const gate = inspectThreeTopicLiveGate();
assert.equal(gate.itemCount, 3);
assert.equal(gate.execution, "not-started");
assert.equal(gate.engine, "tickBatchWorker");
assert.equal(gate.notUsed, "generateStudioBatchAction");
assert.equal(gate.concurrency, 1);
assert.equal(gate.maximumGeminiHttpAttempts, 2);
assert.equal(gate.primaryProvider, DEFAULT_PRIMARY_PROVIDER);
const configuredStudioEnv = { GEMINI_API_KEY: "not-a-live-key", GEMINI_MODEL: "gemini-3.6-flash" };
const configuredStudio = readGeminiProviderConfig(configuredStudioEnv);
assert.equal(configuredStudio.ok, true);
if (!configuredStudio.ok) throw new Error("expected Studio Gemini config");
const configuredGate = inspectThreeTopicLiveGate(configuredStudioEnv);
assert.equal(configuredGate.geminiModel, configuredStudio.data.model);
assert.notEqual(configuredGate.geminiModel, GEMINI_DEFAULT_MODEL);
const defaultStudioEnv = { GEMINI_API_KEY: "not-a-live-key" };
const defaultStudio = readGeminiProviderConfig(defaultStudioEnv);
assert.equal(defaultStudio.ok, true);
if (!defaultStudio.ok) throw new Error("expected default Studio Gemini config");
assert.equal(inspectThreeTopicLiveGate(defaultStudioEnv).geminiModel, defaultStudio.data.model);
assert.equal(defaultStudio.data.model, GEMINI_DEFAULT_MODEL);
assert.equal(gate.existingFallback, DEFAULT_GEMINI_FALLBACK);
assert.equal(gate.autoPublish, false);
assert.equal(gate.insertsIntoContentReview, false);
assert.deepEqual(gate.topicIds, [
  geographyWaterCycleProductionPackage.topic.id,
  geographyAtmosphereProductionPackage.topic.id,
  geographyPlateTectonicsProductionPackage.topic.id,
]);
assert.deepEqual(gate.sourceCounts, [
  geographyWaterCycleProductionPackage.sources.length,
  geographyAtmosphereProductionPackage.sources.length,
  geographyPlateTectonicsProductionPackage.sources.length,
]);
const adapter = readFileSync(join(studioDir, "../ai-providers/gemini/adapter.ts"), "utf8");
assert.match(adapter, /attempt <= 2/);
assert.equal(calls.n, 1);

const controlDir = join(studioDir, "batch-control");
const surface = readFileSync(join(controlDir, "surface.ts"), "utf8");
const actions = readFileSync(join(controlDir, "actions.ts"), "utf8");
const ui = readFileSync(join(studioDir, "../../components/content-studio/StudioBatchControl.tsx"), "utf8");
assert.match(surface, /tickBatchWorker/);
assert.equal(/while\s*\(/.test(surface), false);
assert.equal(surface.includes("generateStudioBatchAction"), false);
assert.match(actions, /tickControlledBatch/);
assert.equal(actions.includes("generateStudioBatchAction"), false);
assert.equal(/while\s*\(/.test(actions), false);
assert.match(ui, /Process next item/);
assert.match(ui, /operator-triggered/);
assert.match(ui, /synchronous Studio batch/i);
assert.equal(ui.includes("generateStudioBatchAction"), false);
assert.equal(ui.includes("running in the background"), false);

console.log("Three-topic live gate (not started):");
console.log(JSON.stringify(gate, null, 2));
console.log("Batch control surface verification passed.");
