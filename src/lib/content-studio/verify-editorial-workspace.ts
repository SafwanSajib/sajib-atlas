import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pilotPackages } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import { createProductionDraft, evaluateProductionQuality } from "@/lib/content/production/workflow";
import { getReviewRecords } from "@/lib/content/review/index";
import type { ProductionRecord } from "@/lib/content/production/types";
import {
  createFileBatchJobStore,
  createMemoryBatchJobStore,
  createPersistentBatch,
  recordEditorialHandoff,
} from "./batch-engine/index";
import type { BatchItemState, BatchJobStore } from "./batch-engine/index";
import { resolveStudioIdentity } from "./identity";
import {
  EDITORIAL_SCHEMA_VERSION,
  EDITORIAL_TRANSITIONS,
  applyEditorialPatch,
  assertActorLabel,
  assertEditablePackage,
  assertEditorialTransition,
  commitEditorialSave,
  commitMarkReadyForApproval,
  commitMarkReadyForReview,
  commitRequestChanges,
  commitReturnToEditing,
  createMemoryEditorialDraftStore,
  noteIdFor,
  openEditorialDraft,
  previewEditorialAdvance,
  replayEditorialWriteThrough,
  resolveEditorialRoute,
} from "./editorial/index";
import { createFileEditorialDraftStore } from "./editorial/file-store";
import type { EditorialDraftRecord, EditorialStatus } from "./editorial/index";

const reviewTopicIds = getReviewRecords().map((record) => record.content.topic.id).slice().sort();
const T0 = "2026-09-23T00:00:00.000Z";
const STATUSES: readonly EditorialStatus[] = ["needs_editing", "ready_for_review", "changes_requested", "ready_for_approval"];

function envelope(revision: number, marker: string): EditorialDraftRecord {
  return {
    schemaVersion: EDITORIAL_SCHEMA_VERSION,
    batchId: "studio-batch/001",
    itemId: "studio-batch/001/item/001/sample",
    editorialStatus: "needs_editing",
    revision,
    updatedAt: T0,
    sourceCompletedAt: T0,
    contentVersion: 1,
    production: { marker } as unknown as EditorialDraftRecord["production"],
    notes: [],
    changes: [],
  };
}

assert.equal(EDITORIAL_SCHEMA_VERSION, "studio-editorial-draft/v1");
assert.deepEqual([...STATUSES].sort(), Object.keys(EDITORIAL_TRANSITIONS).sort());
assert.equal(Object.hasOwn(EDITORIAL_TRANSITIONS, "generated"), false);
assert.equal(STATUSES.includes("generated" as EditorialStatus), false);

const legal: readonly (readonly [EditorialStatus, EditorialStatus])[] = [
  ["needs_editing", "ready_for_review"],
  ["ready_for_review", "ready_for_approval"],
  ["ready_for_review", "changes_requested"],
  ["ready_for_approval", "changes_requested"],
  ["changes_requested", "needs_editing"],
  ["ready_for_review", "needs_editing"],
  ["ready_for_approval", "needs_editing"],
];
for (const [from, to] of legal) assertEditorialTransition(from, to);

assert.throws(() => assertEditorialTransition("needs_editing", "ready_for_approval"), /Editorial workspace: invalid editorial transition/);
assert.throws(() => assertEditorialTransition("needs_editing", "changes_requested"), /Editorial workspace: invalid editorial transition/);
assert.throws(() => assertEditorialTransition("changes_requested", "ready_for_review"), /Editorial workspace: invalid editorial transition/);
assert.throws(() => assertEditorialTransition("needs_editing", "needs_editing"), /Editorial workspace: invalid editorial transition/);

const store = createMemoryEditorialDraftStore();
store.save(envelope(1, "first"), 0);
const stored = store.load("studio-batch/001", "studio-batch/001/item/001/sample");
assert.equal(stored?.revision, 1);
assert.equal((stored?.production as { marker?: string }).marker, "first");
assert.throws(() => store.save(envelope(1, "second"), 0), /Editorial workspace: stale edit/);
const afterStale = store.load("studio-batch/001", "studio-batch/001/item/001/sample");
assert.equal(afterStale?.revision, 1);
assert.equal((afterStale?.production as { marker?: string }).marker, "first");

const raced = createMemoryEditorialDraftStore();
const outcomes = await Promise.allSettled([
  Promise.resolve().then(() => raced.save(envelope(1, "winner"), 0)),
  Promise.resolve().then(() => raced.save(envelope(1, "loser"), 0)),
]);
assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
const rejected = outcomes.find((outcome) => outcome.status === "rejected");
assert.equal(rejected?.status, "rejected");
if (rejected?.status === "rejected") assert.match(String(rejected.reason), /Editorial workspace: stale edit/);
const racedStored = raced.load("studio-batch/001", "studio-batch/001/item/001/sample");
assert.equal(racedStored?.revision, 1);
assert.equal((racedStored?.production as { marker?: string }).marker, "winner");

store.save(envelope(2, "third"), 1);
assert.equal(store.load("studio-batch/001", "studio-batch/001/item/001/sample")?.revision, 2);

const EVALUATED_AT = "2026-09-23T00:00:00.000Z";
const sampleIdentity = resolveStudioIdentity({
  subjectSlug: "studio",
  topicSlug: "sample-draft",
  title: "Studio Sample Draft",
  summary: "Draft sample-draft",
});

function remapPackage(pkg: PilotPackage): PilotPackage {
  return {
    ...pkg,
    disciplineId: sampleIdentity.disciplineId,
    subjectId: sampleIdentity.subjectId,
    topic: {
      ...pkg.topic,
      id: sampleIdentity.topicId,
      disciplineId: sampleIdentity.disciplineId,
      subjectId: sampleIdentity.subjectId,
      title: sampleIdentity.title,
      summary: sampleIdentity.summary,
    },
  };
}

function baselinePackage(): PilotPackage {
  return structuredClone(remapPackage(pilotPackages[2]));
}

function baselineRecord(): ProductionRecord {
  return evaluateProductionQuality(createProductionDraft(baselinePackage()), EVALUATED_AT);
}

function throwsMessage(run: () => void): string {
  try {
    run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  assert.fail("expected Editorial workspace error");
}

function duplicateOrderRecord(): ProductionRecord {
  const content = baselinePackage();
  const [first, ...rest] = content.knowledgeUnits;
  const block = first.blocks[0];
  return createProductionDraft({
    ...content,
    knowledgeUnits: [{ ...first, blocks: [...first.blocks, { ...block, id: `${block.id}-twin` }] }, ...rest],
  });
}

const passed = baselineRecord();
assert.equal(passed.qualitySnapshot?.report.overall, "pass");
const titled = applyEditorialPatch(passed, { topic: { title: "Edited studio title" } });
assert.equal(titled.content.topic.title, "Edited studio title");
assert.equal(titled.content.topic.id, passed.content.topic.id);
assert.equal(titled.content.topic.contentVersion, passed.content.topic.contentVersion);

// case 1: malformed draft
{
  const unknown = throwsMessage(() => applyEditorialPatch(passed, { notAField: true } as never));
  assert.match(unknown, /Editorial workspace: malformed draft/);
  const reviewed = throwsMessage(() => assertEditablePackage({ ...passed, workflowState: "review" }));
  assert.match(reviewed, /Editorial workspace: malformed draft/);
  const patchedState = throwsMessage(() => applyEditorialPatch(passed, { workflowState: "review" } as never));
  assert.match(patchedState, /Editorial workspace: malformed draft/);
}

// case 2: missing knowledge unit
{
  const empty = structuredClone(passed);
  empty.content = { ...empty.content, knowledgeUnits: [] };
  assert.match(throwsMessage(() => assertEditablePackage(empty)), /Editorial workspace: missing knowledge unit/);
  assert.match(throwsMessage(() => previewEditorialAdvance(empty, EVALUATED_AT)), /Editorial workspace: missing knowledge unit/);
  const missing = throwsMessage(() => applyEditorialPatch(passed, { knowledgeUnits: { "unit/missing": { title: "Missing" } } }));
  assert.match(missing, /Editorial workspace: missing knowledge unit/);
}

// case 3: missing required block
{
  const [first, ...rest] = passed.content.knowledgeUnits;
  const emptied = structuredClone(passed);
  emptied.content = { ...emptied.content, knowledgeUnits: [{ ...first, blocks: [] }, ...rest] };
  assert.match(throwsMessage(() => assertEditablePackage(emptied)), /Editorial workspace: missing required block/);
  const payload = applyEditorialPatch(passed, {
    knowledgeUnits: { [first.id]: { blocks: { [first.blocks[0].id]: { payload: {} } } } },
  });
  assert.match(throwsMessage(() => assertEditablePackage(payload)), /Editorial workspace: missing required block/);
}

// case 4: invalid block type
{
  const unit = passed.content.knowledgeUnits[0];
  const blockId = unit.blocks[0].id;
  assert.match(throwsMessage(() => applyEditorialPatch(passed, {
    knowledgeUnits: { [unit.id]: { blocks: { [blockId]: { type: "exam-note" as never } } } },
  })), /Editorial workspace: invalid block type/);
  assert.match(throwsMessage(() => applyEditorialPatch(passed, {
    knowledgeUnits: { [unit.id]: { blocks: { [blockId]: { type: "classification" as never } } } },
  })), /Editorial workspace: invalid block type/);
}

// case 5: missing source
{
  const reference = passed.content.sourceReferences[0];
  const unknownSource = throwsMessage(() => applyEditorialPatch(passed, {
    sourceReferences: { [reference.id]: { sourceId: "source/not-on-package" } },
  }));
  assert.match(unknownSource, /Editorial workspace: missing source/);
  assert.doesNotMatch(unknownSource, /invalid source reference/);
  const unknownPatch = throwsMessage(() => applyEditorialPatch(passed, {
    sources: { "source/not-on-package": { title: "Invented" } },
  }));
  assert.match(unknownPatch, /Editorial workspace: missing source/);
  assert.doesNotMatch(unknownPatch, /invalid source reference/);
  const absent = structuredClone(passed);
  absent.content = {
    ...absent.content,
    sourceReferences: absent.content.sourceReferences.map((item, index) => index === 0 ? { ...item, sourceId: undefined as never } : item),
  };
  const absentMessage = throwsMessage(() => assertEditablePackage(absent));
  assert.match(absentMessage, /Editorial workspace: missing source/);
  assert.doesNotMatch(absentMessage, /invalid source reference/);
}

// case 6: invalid source reference
{
  const reference = passed.content.sourceReferences[0];
  const unknownRef = throwsMessage(() => applyEditorialPatch(passed, {
    sourceReferences: { "ref/not-on-package": { citation: "A citation" } },
  }));
  assert.match(unknownRef, /Editorial workspace: invalid source reference/);
  assert.doesNotMatch(unknownRef, /missing source/);
  const blank = throwsMessage(() => applyEditorialPatch(passed, {
    sourceReferences: { [reference.id]: { citation: "   " } },
  }));
  assert.match(blank, /Editorial workspace: invalid source reference/);
  assert.doesNotMatch(blank, /missing source/);
  const support = throwsMessage(() => applyEditorialPatch(passed, {
    sourceReferences: { [reference.id]: { supportType: "quoted" as never } },
  }));
  assert.match(support, /Editorial workspace: invalid source reference/);
  assert.doesNotMatch(support, /missing source/);
}

// case 7: broken claim relationship
{
  const claim = passed.content.claims[0];
  const emptied = throwsMessage(() => applyEditorialPatch(passed, {
    claims: { [claim.id]: { sourceReferenceIds: [] } },
  }));
  assert.match(emptied, /Editorial workspace: broken claim relationship/);
  const disputed = throwsMessage(() => applyEditorialPatch(passed, {
    claims: { [claim.id]: { interpretationStatus: "disputed", conflictGroupId: "" } },
  }));
  assert.match(disputed, /Editorial workspace: broken claim relationship/);
}

// case 8: quality gate failure
{
  const blocked = duplicateOrderRecord();
  const evaluated = evaluateProductionQuality(blocked, EVALUATED_AT);
  assert.equal(evaluated.qualitySnapshot?.report.overall, "blocked");
  const snapshot = structuredClone(evaluated);
  assert.match(throwsMessage(() => previewEditorialAdvance(evaluated, EVALUATED_AT)), /Editorial workspace: editorial_quality_blocked/);
  assert.deepEqual(evaluated, snapshot);
  assert.equal(evaluated.qualitySnapshot?.report.overall, "blocked");
  assert.equal("qualityOverride" in evaluated, false);
  assert.equal("override" in evaluated, false);
}

// case 9: warning versus pass
{
  const mustNotBeBlocked = new Set([
    "identity-structure",
    "knowledge-unit",
    "content-block",
    "objective",
    "claim",
    "provenance",
    "classification",
    "time-scope",
    "version-lifecycle",
    "assessment-alignment",
    "universal-core",
  ]);
  const advanced = previewEditorialAdvance(passed, EVALUATED_AT);
  assert.equal(advanced.qualitySnapshot?.report.overall, "pass");
  assert.equal(advanced.workflowState, "draft");
  assert.equal(advanced.content.topic.lifecycle, "draft");
  const identityRows = advanced.qualitySnapshot?.report.dimensions.filter((row) => row.dimension === "identity-structure") ?? [];
  assert.ok(identityRows.length >= 2);
  assert.ok(advanced.qualitySnapshot?.report.dimensions.filter((row) => mustNotBeBlocked.has(row.dimension)).every((row) => row.status !== "blocked"));
  let editorialStatus: EditorialStatus = "needs_editing";
  assert.equal(editorialStatus, "needs_editing");
  const warned = evaluateProductionQuality(createProductionDraft({
    ...baselinePackage(),
    concepts: baselinePackage().concepts.map((concept) => ({ ...concept, aliases: [] })),
  }), EVALUATED_AT);
  assert.equal(warned.qualitySnapshot?.report.overall, "warning");
  assert.ok(warned.qualitySnapshot?.report.dimensions.filter((row) => mustNotBeBlocked.has(row.dimension)).every((row) => row.status !== "blocked"));
  const warnedAdvance = previewEditorialAdvance(warned, EVALUATED_AT);
  assert.equal(warnedAdvance.qualitySnapshot?.report.overall, "warning");
  assertEditorialTransition("needs_editing", "ready_for_review");
  assertEditorialTransition("ready_for_review", "ready_for_approval");
  editorialStatus = "needs_editing";
  assert.equal(editorialStatus, "needs_editing");
}

// case 13: invalid editorial transition
{
  assert.match(throwsMessage(() => assertEditorialTransition("needs_editing", "ready_for_approval")), /Editorial workspace: invalid editorial transition/);
  const editorialDir = join(dirname(fileURLToPath(import.meta.url)), "editorial");
  const source = readdirSync(editorialDir).filter((name) => name.endsWith(".ts")).map((name) => readFileSync(join(editorialDir, name), "utf8")).join("\n");
  assert.equal(source.includes("approveProduction"), false);
  assert.equal(source.includes("publishProduction"), false);
  const advanced = previewEditorialAdvance(passed, EVALUATED_AT);
  assert.equal(advanced.workflowState, "draft");
  assert.equal(advanced.reviews.length, 0);
  assert.equal(advanced.publishedAt, undefined);
}

// case 20: source-backed provenance
{
  const backed = structuredClone(passed);
  backed.content = { ...backed.content, topic: { ...backed.content.topic, provenanceStatus: "source-backed" as never } };
  const message = throwsMessage(() => assertEditablePackage(backed));
  assert.match(message, /Editorial workspace: malformed draft/);
  assert.equal(message.includes("immutable field"), false);
}

// case 23: forbidden payload key
{
  const unit = passed.content.knowledgeUnits[0];
  const block = unit.blocks[0];
  assert.equal(Object.hasOwn(block.payload, "body"), false);
  const message = throwsMessage(() => applyEditorialPatch(passed, {
    knowledgeUnits: { [unit.id]: { blocks: { [block.id]: { payload: { ...block.payload, body: "added" } } } } },
  }));
  assert.match(message, /Editorial workspace: malformed draft/);
}

// case 24: concept membership
{
  const concept = passed.content.concepts[0];
  const message = throwsMessage(() => applyEditorialPatch(passed, {
    concepts: { [concept.id]: { knowledgeUnitIds: [concept.knowledgeUnitIds[0]] } as never },
  }));
  assert.match(message, /Editorial workspace: malformed draft/);
}

// case 25: actorLabel and internal version
{
  const actor = throwsMessage(() => assertActorLabel("x".repeat(81)));
  assert.match(actor, /Editorial workspace: malformed draft/);
  assert.equal(actor.includes("immutable field"), false);
  const mismatched = structuredClone(passed);
  const [first, ...rest] = mismatched.content.knowledgeUnits;
  mismatched.content = {
    ...mismatched.content,
    knowledgeUnits: [{ ...first, contentVersion: first.contentVersion + 4 }, ...rest],
  };
  const version = throwsMessage(() => assertEditablePackage(mismatched));
  assert.match(version, /Editorial workspace: malformed draft/);
  assert.equal(version.includes("immutable field"), false);
  const actorSeed = seedBatch(passed);
  const actorCommit = throwsMessage(() => commitEditorialSave({ ...saveInput(actorSeed, 0, { topic: { title: "Too long" } }), actorLabel: "y".repeat(81) }));
  assert.match(actorCommit, /Editorial workspace: malformed draft/);
  assert.equal(actorCommit.includes("immutable field"), false);
  assert.equal(actorSeed.editorialStore.load(actorSeed.batchId, actorSeed.itemId), null);
  const mismatchSeed = seedBatch(mismatched);
  const mismatchBefore = JSON.stringify(mismatchSeed.batchStore.load(mismatchSeed.batchId));
  const openedMismatch = openEditorialDraft(mismatchSeed.batchStore, mismatchSeed.editorialStore, mismatchSeed.batchId, mismatchSeed.itemId);
  assert.equal(openedMismatch.persisted, false);
  assert.equal(openedMismatch.production.content.knowledgeUnits[0].contentVersion, first.contentVersion + 4);
  assert.equal(mismatchSeed.editorialStore.load(mismatchSeed.batchId, mismatchSeed.itemId), null);
  assert.equal(JSON.stringify(mismatchSeed.batchStore.load(mismatchSeed.batchId)), mismatchBefore);
}

function withBody(record: ProductionRecord, body: string): ProductionRecord {
  const [first, ...rest] = record.content.knowledgeUnits;
  const [block, ...blocks] = first.blocks;
  return {
    ...record,
    content: {
      ...record.content,
      knowledgeUnits: [{ ...first, blocks: [{ ...block, payload: { ...block.payload, body } }, ...blocks] }, ...rest],
    },
  };
}

function seedBatch(draft: ProductionRecord, state: BatchItemState = "succeeded") {
  const batchStore = createMemoryBatchJobStore();
  const created = createPersistentBatch({
    store: batchStore,
    batchNumber: 1,
    createdAt: T0,
    topics: [{
      identity: {
        subjectSlug: "studio",
        topicSlug: "sample-draft",
        title: "Studio Sample Draft",
        summary: "Draft sample-draft",
      },
      sourceText: "Notes for sample-draft.",
    }],
  });
  const item = created.items[0];
  batchStore.save({
    ...created,
    state: "completed",
    items: [{
      ...item,
      state,
      executions: 1,
      result: {
        completedAt: T0,
        pipelineOk: true,
        ...(draft.qualitySnapshot ? { qualityOverall: draft.qualitySnapshot.report.overall } : {}),
        draft,
      },
    }],
  });
  return {
    batchStore,
    editorialStore: createMemoryEditorialDraftStore(),
    batchId: created.batchId,
    itemId: item.itemId,
  };
}

function saveInput(seed: ReturnType<typeof seedBatch>, expectedRevision: number, patch?: Parameters<typeof commitEditorialSave>[0]["patch"]) {
  return {
    editorialStore: seed.editorialStore,
    batchStore: seed.batchStore,
    batchId: seed.batchId,
    itemId: seed.itemId,
    expectedRevision,
    ...(patch ? { patch } : {}),
    updatedAt: T0,
    evaluatedAt: EVALUATED_AT,
  };
}

// case 10: stale content version
{
  const seed = seedBatch(passed);
  const saved = commitEditorialSave(saveInput(seed, 0, { topic: { title: "Baseline title" } }));
  assert.equal(saved.revision, 1);
  const job = seed.batchStore.load(seed.batchId);
  assert.ok(job);
  seed.batchStore.save({
    ...job,
    items: job.items.map((item) => item.itemId !== seed.itemId || !item.result?.draft ? item : {
      ...item,
      result: {
        ...item.result,
        draft: {
          ...item.result.draft,
          content: {
            ...item.result.draft.content,
            topic: { ...item.result.draft.content.topic, contentVersion: item.result.draft.content.topic.contentVersion + 1 },
          },
        },
      },
    }),
  });
  assert.match(throwsMessage(() => commitEditorialSave(saveInput(seed, 1, { topic: { title: "Too late" } }))), /Editorial workspace: stale content version/);
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId)?.revision, 1);
  const completed = seedBatch(passed);
  commitEditorialSave(saveInput(completed, 0, { topic: { title: "Completed baseline" } }));
  const completedJob = completed.batchStore.load(completed.batchId);
  assert.ok(completedJob);
  completed.batchStore.save({
    ...completedJob,
    items: completedJob.items.map((item) => item.itemId !== completed.itemId || !item.result ? item : {
      ...item,
      result: { ...item.result, completedAt: "2026-09-23T00:09:00.000Z" },
    }),
  });
  assert.match(throwsMessage(() => commitEditorialSave(saveInput(completed, 1, { topic: { title: "Stale clock" } }))), /Editorial workspace: stale content version/);
  assert.equal(completed.editorialStore.load(completed.batchId, completed.itemId)?.revision, 1);
}

// case 11: stale edit
{
  const seed = seedBatch(passed);
  const first = commitEditorialSave(saveInput(seed, 0, { topic: { title: "Revision one" } }));
  assert.equal(first.revision, 1);
  const outcomes = await Promise.allSettled([
    Promise.resolve().then(() => commitEditorialSave(saveInput(seed, 1, { topic: { title: "Winner title" } }))),
    Promise.resolve().then(() => commitEditorialSave(saveInput(seed, 1, { topic: { title: "Loser title" } }))),
  ]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  const rejected = outcomes.find((outcome) => outcome.status === "rejected");
  assert.equal(rejected?.status, "rejected");
  if (rejected?.status === "rejected") assert.match(String(rejected.reason), /Editorial workspace: stale edit/);
  const stored = seed.editorialStore.load(seed.batchId, seed.itemId);
  assert.equal(stored?.revision, 2);
  assert.equal(stored?.production.content.topic.title, "Winner title");
}

// case 12: persistence failure
{
  const seed = seedBatch(passed);
  const failingEditorial = {
    load: (batchId: string, itemId: string) => seed.editorialStore.load(batchId, itemId),
    list: () => seed.editorialStore.list(),
    save() {
      throw new Error("disk full");
    },
  };
  assert.match(throwsMessage(() => commitEditorialSave({ ...saveInput(seed, 0, { topic: { title: "Nope" } }), editorialStore: failingEditorial })), /Editorial workspace: persistence failure/);
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId), null);
  let failSave = false;
  const batchStore: BatchJobStore = {
    load: (batchId) => seed.batchStore.load(batchId),
    list: () => seed.batchStore.list(),
    save(record) {
      if (failSave) throw new Error("batch write failed");
      seed.batchStore.save(record);
    },
  };
  failSave = true;
  assert.match(throwsMessage(() => commitEditorialSave({ ...saveInput(seed, 0, { topic: { title: "Editorial only" } }), batchStore })), /Editorial workspace: persistence failure/);
  const kept = seed.editorialStore.load(seed.batchId, seed.itemId);
  assert.equal(kept?.revision, 1);
  assert.equal(kept?.production.content.topic.title, "Editorial only");
  assert.notEqual(seed.batchStore.load(seed.batchId)?.items[0].result?.draft?.content.topic.title, "Editorial only");
}

// case 15: version and lifecycle freeze
{
  const embodied = withBody(passed, "kept body");
  const seed = seedBatch(embodied);
  const versions = embodied.content.knowledgeUnits.map((unit) => unit.contentVersion);
  const alignments = embodied.content.assessmentAlignments.map((alignment) => alignment.contentVersion);
  const saved = commitEditorialSave(saveInput(seed, 0, { topic: { title: "Frozen version" } }));
  assert.equal(saved.production.content.topic.contentVersion, embodied.content.topic.contentVersion);
  assert.deepEqual(saved.production.content.knowledgeUnits.map((unit) => unit.contentVersion), versions);
  assert.deepEqual(saved.production.content.assessmentAlignments.map((alignment) => alignment.contentVersion), alignments);
  assert.equal(saved.production.workflowState, "draft");
  assert.equal(saved.production.content.topic.lifecycle, "draft");
  assert.ok(saved.production.content.knowledgeUnits.every((unit) => unit.lifecycle === "draft"));
  const reloaded = seed.batchStore.load(seed.batchId);
  assert.equal(reloaded?.items[0].state, "succeeded");
  assert.deepEqual(reloaded?.items[0].result?.draft, saved.production);
  assert.equal(reloaded?.items[0].result?.draft?.content.knowledgeUnits[0].blocks[0].payload.body, "kept body");
}

// case 20: source-backed provenance
{
  const backed = structuredClone(passed);
  backed.content = { ...backed.content, topic: { ...backed.content.topic, provenanceStatus: "source-backed" as never } };
  const seed = seedBatch(backed);
  const rejected = throwsMessage(() => commitEditorialSave(saveInput(seed, 0, { topic: { title: "Still backed" } })));
  assert.match(rejected, /Editorial workspace: malformed draft/);
  assert.equal(rejected.includes("immutable field"), false);
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId), null);
  const saved = commitEditorialSave(saveInput(seed, 0, { topic: { provenanceStatus: "synthesized" } }));
  assert.equal(saved.production.content.topic.provenanceStatus, "synthesized");
  assert.equal(saved.editorialStatus, "needs_editing");
}

// case 21: duplicate block order
{
  const blocked = duplicateOrderRecord();
  const seed = seedBatch(blocked, "quality_blocked");
  const unit = blocked.content.knowledgeUnits[0];
  const orders = unit.blocks.map((block) => block.order);
  const saved = commitEditorialSave(saveInput(seed, 0, { topic: { title: "Blocked duplicate order" } }));
  assert.equal(saved.editorialStatus, "needs_editing");
  assert.equal(saved.production.qualitySnapshot?.report.overall, "blocked");
  assert.deepEqual(saved.production.content.knowledgeUnits[0].blocks.map((block) => block.order), orders);
  assert.equal(seed.batchStore.load(seed.batchId)?.items[0].state, "quality_blocked");
  assert.match(throwsMessage(() => commitMarkReadyForReview(saveInput(seed, saved.revision))), /Editorial workspace: editorial_quality_blocked/);
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId)?.revision, saved.revision);
  assert.deepEqual(seed.editorialStore.load(seed.batchId, seed.itemId)?.production.content.knowledgeUnits[0].blocks.map((block) => block.order), orders);
}

// replayEditorialWriteThrough restores the editorial production, not an older generation. There is no shadow draft.
// case 22: write-through replay
{
  const seed = seedBatch(passed);
  let failSave = false;
  const batchStore: BatchJobStore = {
    load: (batchId) => seed.batchStore.load(batchId),
    list: () => seed.batchStore.list(),
    save(record) {
      if (failSave) throw new Error("write-through failed");
      seed.batchStore.save(record);
    },
  };
  failSave = true;
  assert.match(throwsMessage(() => commitEditorialSave({ ...saveInput(seed, 0, { topic: { title: "Kept editorial" } }), batchStore })), /Editorial workspace: persistence failure/);
  const editorial = seed.editorialStore.load(seed.batchId, seed.itemId);
  assert.equal(editorial?.production.content.topic.title, "Kept editorial");
  const beforeLoad = JSON.stringify(seed.batchStore.load(seed.batchId));
  seed.editorialStore.load(seed.batchId, seed.itemId);
  assert.equal(JSON.stringify(seed.batchStore.load(seed.batchId)), beforeLoad);
  const repaired = replayEditorialWriteThrough(seed.editorialStore, seed.batchStore, seed.batchId, seed.itemId);
  assert.equal(repaired.items.find((item) => item.itemId === seed.itemId)?.result?.draft?.content.topic.title, "Kept editorial");
  assert.deepEqual(repaired.handoffs, []);
  recordEditorialHandoff({
    store: seed.batchStore,
    batchId: seed.batchId,
    itemId: seed.itemId,
    reviewerId: "editor-1",
    decidedAt: T0,
  });
  const withHandoff = seed.batchStore.load(seed.batchId);
  assert.equal(withHandoff?.handoffs.length, 1);
  assert.equal(withHandoff?.handoffs[0].registeredInContentReview, false);
  const replayed = replayEditorialWriteThrough(seed.editorialStore, seed.batchStore, seed.batchId, seed.itemId);
  assert.deepEqual(replayed.handoffs, withHandoff?.handoffs);
  assert.equal(replayed.items[0].state, "succeeded");
  const drifted = seed.batchStore.load(seed.batchId);
  assert.ok(drifted);
  seed.batchStore.save({
    ...drifted,
    items: drifted.items.map((item) => item.result ? { ...item, result: { ...item.result, completedAt: "2026-09-23T00:08:00.000Z" } } : item),
  });
  assert.match(throwsMessage(() => replayEditorialWriteThrough(seed.editorialStore, seed.batchStore, seed.batchId, seed.itemId)), /Editorial workspace: stale content version/);
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId)?.production.content.topic.title, "Kept editorial");
  const unequal = seedBatch(passed);
  const savedUnequal = commitEditorialSave(saveInput(unequal, 0, { topic: { title: "Editorial copy" } }));
  const unequalJob = unequal.batchStore.load(unequal.batchId);
  assert.ok(unequalJob);
  unequal.batchStore.save({
    ...unequalJob,
    items: unequalJob.items.map((item) => item.result?.draft ? {
      ...item,
      result: {
        ...item.result,
        draft: {
          ...item.result.draft,
          content: { ...item.result.draft.content, topic: { ...item.result.draft.content.topic, title: "Batch copy" } },
        },
      },
    } : item),
  });
  assert.match(throwsMessage(() => openEditorialDraft(unequal.batchStore, unequal.editorialStore, unequal.batchId, unequal.itemId)), /Editorial workspace: persistence failure/);
  assert.equal(unequal.editorialStore.load(unequal.batchId, unequal.itemId)?.production.content.topic.title, savedUnequal.production.content.topic.title);
}

// case 23: forbidden payload key
{
  const unit = passed.content.knowledgeUnits[0];
  const block = unit.blocks[0];
  const absent = seedBatch(passed);
  assert.match(throwsMessage(() => commitEditorialSave(saveInput(absent, 0, {
    knowledgeUnits: { [unit.id]: { blocks: { [block.id]: { payload: { ...block.payload, body: "added" } } } } },
  }))), /Editorial workspace: malformed draft/);
  assert.equal(absent.editorialStore.load(absent.batchId, absent.itemId), null);
  const embodied = withBody(passed, "original body");
  const seed = seedBatch(embodied);
  const replaced = commitEditorialSave(saveInput(seed, 0, {
    knowledgeUnits: { [unit.id]: { blocks: { [block.id]: { payload: { ...block.payload, body: "revised body" } } } } },
  }));
  assert.equal(replaced.production.content.knowledgeUnits[0].blocks[0].payload.body, "revised body");
  const titled = commitEditorialSave(saveInput(seed, replaced.revision, { topic: { title: "Title keeps body" } }));
  const reloaded = seed.batchStore.load(seed.batchId);
  assert.equal(reloaded?.items[0].result?.draft?.content.knowledgeUnits[0].blocks[0].payload.body, "revised body");
  assert.equal(titled.production.content.knowledgeUnits[0].blocks[0].payload.body, "revised body");
  const textBlock = titled.production.content.knowledgeUnits.map((item) => item.blocks).flat().find((item) => typeof item.payload.text === "string");
  assert.ok(textBlock);
  const fileSeed = seedBatch(withBody(passed, "original body"));
  const directory = mkdtempSync(join(tmpdir(), "editorial-workspace-"));
  const fileStore = createFileEditorialDraftStore(directory);
  const fileSaved = commitEditorialSave({ ...saveInput(fileSeed, 0, { topic: { title: "File round trip" } }), editorialStore: fileStore });
  const fileLoaded = fileStore.load(fileSeed.batchId, fileSeed.itemId);
  assert.equal(fileLoaded?.production.content.knowledgeUnits[0].blocks[0].payload.body, "original body");
  assert.equal(fileLoaded?.production.content.knowledgeUnits.some((item) => item.blocks.some((entry) => typeof entry.payload.text === "string")), true);
  const raw = readFileSync(join(directory, "001", "001--sample-draft.json"), "utf8");
  assert.match(raw, /"body"/);
  assert.equal(raw.includes("\"apiKey\""), false);
  assert.equal(fileSaved.production.content.topic.title, "File round trip");
  const secretStore = createMemoryBatchJobStore();
  const created = createPersistentBatch({
    store: secretStore,
    batchNumber: 2,
    createdAt: T0,
    topics: [{ identity: { subjectSlug: "studio", topicSlug: "secret-draft", title: "Secret Draft", summary: "Draft secret" }, sourceText: "secret source" }],
  });
  const secretItem = created.items[0];
  const dirty = {
    ...created,
    items: [{
      ...secretItem,
      state: "succeeded" as const,
      executions: 1,
      result: {
        completedAt: T0,
        pipelineOk: true,
        qualityOverall: "pass" as const,
        draft: withBody(passed, "secret body"),
        providerTrace: {
          provider: "gemini",
          attempts: 1,
          retryOccurred: false,
          attemptsDetail: [{ attempt: 1, outcome: "ok", apiKey: "AIzaSySECRETVALUE" } as never],
        },
      },
    }],
  };
  secretStore.save(dirty);
  const secretLoaded = secretStore.load(created.batchId);
  assert.equal(secretLoaded?.items[0].result?.draft?.content.knowledgeUnits[0].blocks[0].payload.body, "secret body");
  assert.equal(JSON.stringify(secretLoaded).includes("apiKey"), false);
  assert.equal(JSON.stringify(secretLoaded).includes("AIzaSySECRETVALUE"), false);
  const fileBatchDir = mkdtempSync(join(tmpdir(), "editorial-batch-"));
  const fileBatch = createFileBatchJobStore(fileBatchDir);
  fileBatch.save(dirty);
  const fileBatchLoaded = fileBatch.load(created.batchId);
  assert.equal(fileBatchLoaded?.items[0].result?.draft?.content.knowledgeUnits[0].blocks[0].payload.body, "secret body");
  assert.equal(JSON.stringify(fileBatchLoaded).includes("apiKey"), false);
}

// case 24: concept membership
{
  const seed = seedBatch(passed);
  const unit = passed.content.knowledgeUnits[0];
  const extra = passed.content.concepts[1];
  const beforeIds = passed.content.concepts.map((concept) => concept.id);
  const saved = commitEditorialSave(saveInput(seed, 0, {
    knowledgeUnits: { [unit.id]: { conceptIds: [...unit.conceptIds, extra.id] } },
  }));
  assert.deepEqual(saved.production.content.concepts.map((concept) => concept.id), beforeIds);
  const updated = saved.production.content.concepts.find((concept) => concept.id === extra.id);
  assert.ok(updated?.knowledgeUnitIds.includes(unit.id));
  assert.deepEqual(updated?.knowledgeUnitIds.slice(0, -1), extra.knowledgeUnitIds);
  assert.ok(saved.production.content.knowledgeUnits[0].conceptIds.includes(extra.id));
}

// case 14: open is pure
{
  const seed = seedBatch(passed);
  const before = JSON.stringify(seed.batchStore.load(seed.batchId));
  const opened = openEditorialDraft(seed.batchStore, seed.editorialStore, seed.batchId, seed.itemId);
  assert.equal(opened.persisted, false);
  assert.equal(opened.revision, 0);
  assert.equal(opened.expectedRevision, 0);
  assert.equal(opened.editorialStatus, "needs_editing");
  assert.equal(opened.canonical, false);
  assert.equal(opened.publishable, false);
  assert.equal(JSON.stringify(seed.batchStore.load(seed.batchId)), before);
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId), null);
  const backed = structuredClone(passed);
  backed.content = { ...backed.content, topic: { ...backed.content.topic, provenanceStatus: "source-backed" as never } };
  const backedSeed = seedBatch(backed);
  const backedBefore = JSON.stringify(backedSeed.batchStore.load(backedSeed.batchId));
  const backedOpen = openEditorialDraft(backedSeed.batchStore, backedSeed.editorialStore, backedSeed.batchId, backedSeed.itemId);
  assert.equal(backedOpen.production.content.topic.provenanceStatus, "source-backed");
  assert.equal(backedOpen.persisted, false);
  assert.equal(JSON.stringify(backedSeed.batchStore.load(backedSeed.batchId)), backedBefore);
  assert.equal(backedSeed.editorialStore.load(backedSeed.batchId, backedSeed.itemId), null);
}

// case 17: note-only save
{
  const seed = seedBatch(passed);
  const noted = commitEditorialSave({ ...saveInput(seed, 0), notes: [{ body: "Check the citation." }] });
  assert.equal(noted.revision, 1);
  assert.equal(noted.editorialStatus, "needs_editing");
  assert.equal(noted.production.content.topic.title, passed.content.topic.title);
  assert.equal(noted.notes.length, 1);
  const noteId = noteIdFor(seed.batchId, seed.itemId, noted.revision, 0);
  assert.equal(noted.notes[0].noteId, noteId);
  assert.equal(noteId, `note/${seed.batchId}/${seed.itemId}/${noted.revision}/0`);
  assert.equal(noted.changes.length, 1);
  assert.equal(noted.changes[0].path, `notes/${noteId}`);
  assert.equal(noted.changes[0].previousValue, JSON.stringify(null));
  const ready = commitMarkReadyForReview(saveInput(seed, noted.revision));
  assert.equal(ready.editorialStatus, "ready_for_review");
  const requested = commitRequestChanges(saveInput(seed, ready.revision));
  assert.equal(requested.editorialStatus, "changes_requested");
  assert.equal(requested.notes.length, 1);
}

// case 18: content-save demotion
{
  const seed = seedBatch(passed);
  const ready = commitMarkReadyForReview(saveInput(seed, 0));
  assert.equal(ready.editorialStatus, "ready_for_review");
  const previousTitle = ready.production.content.topic.title;
  const demoted = commitEditorialSave(saveInput(seed, ready.revision, { topic: { title: "Demoted title" } }));
  assert.equal(demoted.editorialStatus, "needs_editing");
  const rows = demoted.changes.filter((change) => change.revision === demoted.revision);
  assert.deepEqual(rows.map((change) => change.path), ["topic.title", "editorialStatus"]);
  assert.equal(rows[0].previousValue, JSON.stringify(previousTitle));
  assert.equal(rows[0].newValue, JSON.stringify("Demoted title"));
  assert.equal(rows[1].previousValue, JSON.stringify("ready_for_review"));
  assert.equal(rows[1].newValue, JSON.stringify("needs_editing"));
  const again = commitMarkReadyForReview(saveInput(seed, demoted.revision));
  const returned = commitReturnToEditing(saveInput(seed, again.revision));
  assert.equal(returned.editorialStatus, "needs_editing");
  assert.equal(returned.notes.length, 0);
  assert.match(throwsMessage(() => commitMarkReadyForApproval(saveInput(seed, returned.revision))), /Editorial workspace: invalid editorial transition/);
  const readyForApproval = commitMarkReadyForReview(saveInput(seed, returned.revision));
  const approved = commitMarkReadyForApproval(saveInput(seed, readyForApproval.revision));
  assert.equal(approved.editorialStatus, "ready_for_approval");
  assert.equal(approved.production.workflowState, "draft");
  assert.equal(approved.production.reviews.length, 0);
  assert.equal(approved.production.publishedAt, undefined);
}

// case 19: history cap
{
  const seed = seedBatch(passed);
  const changes = Array.from({ length: 200 }, (_, index) => ({
    revision: 1,
    at: T0,
    path: "topic.summary",
    previousValue: JSON.stringify("before"),
    newValue: JSON.stringify(`after-${index}`),
  }));
  seed.editorialStore.save({
    schemaVersion: EDITORIAL_SCHEMA_VERSION,
    batchId: seed.batchId,
    itemId: seed.itemId,
    editorialStatus: "needs_editing",
    revision: 1,
    updatedAt: T0,
    sourceCompletedAt: T0,
    contentVersion: passed.content.topic.contentVersion,
    production: passed,
    notes: [],
    changes,
  }, 0);
  assert.match(throwsMessage(() => commitEditorialSave(saveInput(seed, 1, { topic: { title: "One more row" } }))), /Editorial workspace: persistence failure/);
  const stored = seed.editorialStore.load(seed.batchId, seed.itemId);
  assert.equal(stored?.revision, 1);
  assert.equal(stored?.changes.length, 200);
  assert.equal(stored?.changes[199].newValue, JSON.stringify("after-199"));
}

// case 16: registry and lane identity
{
  assert.deepEqual(getReviewRecords().map((record) => record.content.topic.id).slice().sort(), reviewTopicIds);
  const blocked = duplicateOrderRecord();
  const seed = seedBatch(blocked, "quality_blocked");
  const unit = blocked.content.knowledgeUnits[0];
  const twin = unit.blocks[1];
  const saved = commitEditorialSave(saveInput(seed, 0, {
    knowledgeUnits: { [unit.id]: { blocks: { [twin.id]: { order: twin.order + 1 } } } },
  }));
  assert.notEqual(saved.production.qualitySnapshot?.report.overall, "blocked");
  const ready = commitMarkReadyForReview(saveInput(seed, saved.revision));
  assert.equal(ready.editorialStatus, "ready_for_review");
  assert.equal(seed.batchStore.load(seed.batchId)?.items[0].state, "quality_blocked");
  assert.throws(() => recordEditorialHandoff({
    store: seed.batchStore,
    batchId: seed.batchId,
    itemId: seed.itemId,
    reviewerId: "editor-1",
    decidedAt: T0,
  }), /only a succeeded draft/);
  const clean = seedBatch(passed);
  commitEditorialSave(saveInput(clean, 0, { topic: { title: "Registry handoff" } }));
  const handed = recordEditorialHandoff({
    store: clean.batchStore,
    batchId: clean.batchId,
    itemId: clean.itemId,
    reviewerId: "editor-1",
    decidedAt: T0,
  });
  assert.equal(handed.handoffs.every((handoff) => handoff.registeredInContentReview === false), true);
  const editorialDir = join(dirname(fileURLToPath(import.meta.url)), "editorial");
  const editorialSource = readdirSync(editorialDir).filter((name) => name.endsWith(".ts")).map((name) => readFileSync(join(editorialDir, name), "utf8")).join("\n");
  assert.equal(editorialSource.includes("ready_for_editorial_review"), false);
}

// case 26: unequal open is not a 404
{
  const seed = seedBatch(passed);
  const saved = commitEditorialSave(saveInput(seed, 0, { topic: { title: "Editorial copy" } }));
  const job = seed.batchStore.load(seed.batchId);
  assert.ok(job);
  seed.batchStore.save({
    ...job,
    items: job.items.map((item) => item.result?.draft ? {
      ...item,
      result: {
        ...item.result,
        draft: {
          ...item.result.draft,
          content: { ...item.result.draft.content, topic: { ...item.result.draft.content.topic, title: "Batch copy" } },
        },
      },
    } : item),
  });
  const resolution = resolveEditorialRoute({
    nodeEnv: "development",
    batchIdParam: "001",
    itemParam: "001--sample-draft",
    batchStore: seed.batchStore,
    editorialStore: seed.editorialStore,
  });
  assert.equal(resolution.kind, "persistence-failure");
  if (resolution.kind === "persistence-failure") {
    assert.match(resolution.message, /Editorial workspace: persistence failure/);
    assert.equal(resolution.replayAvailable, true);
    assert.equal("view" in resolution, false);
    const rendered = JSON.stringify(resolution);
    assert.equal(rendered.includes("Editorial copy"), false);
    assert.equal(rendered.includes("Batch copy"), false);
  }
  assert.equal(seed.editorialStore.load(seed.batchId, seed.itemId)?.production.content.topic.title, saved.production.content.topic.title);
  assert.equal(seed.batchStore.load(seed.batchId)?.items[0].result?.draft?.content.topic.title, "Batch copy");

  const missing = resolveEditorialRoute({
    nodeEnv: "development",
    batchIdParam: "999",
    itemParam: "001--sample-draft",
    batchStore: seed.batchStore,
    editorialStore: seed.editorialStore,
  });
  assert.equal(missing.kind, "not-found");
  const invalid = resolveEditorialRoute({
    nodeEnv: "development",
    batchIdParam: "bad",
    itemParam: "001--sample-draft",
    batchStore: seed.batchStore,
    editorialStore: seed.editorialStore,
  });
  assert.equal(invalid.kind, "not-found");
  const productionMode = resolveEditorialRoute({
    nodeEnv: "production",
    batchIdParam: "001",
    itemParam: "001--sample-draft",
    batchStore: seed.batchStore,
    editorialStore: seed.editorialStore,
  });
  assert.equal(productionMode.kind, "not-found");
  const clean = seedBatch(passed);
  const opened = resolveEditorialRoute({
    nodeEnv: "development",
    batchIdParam: "001",
    itemParam: "001--sample-draft",
    batchStore: clean.batchStore,
    editorialStore: clean.editorialStore,
  });
  assert.equal(opened.kind, "workspace");
  if (opened.kind === "workspace") assert.equal(opened.view.editorialStatus, "needs_editing");
  assert.equal(clean.editorialStore.load(clean.batchId, clean.itemId), null);

  const corruptDirectory = mkdtempSync(join(tmpdir(), "editorial-route-"));
  mkdirSync(join(corruptDirectory, "001"));
  const corruptPath = join(corruptDirectory, "001", "001--sample-draft.json");
  writeFileSync(corruptPath, "{", "utf8");
  const corrupt = resolveEditorialRoute({
    nodeEnv: "development",
    batchIdParam: "001",
    itemParam: "001--sample-draft",
    batchStore: seed.batchStore,
    editorialStore: createFileEditorialDraftStore(corruptDirectory),
  });
  assert.equal(corrupt.kind, "persistence-failure");
  if (corrupt.kind === "persistence-failure") {
    assert.match(corrupt.message, /Editorial workspace: persistence failure/);
    assert.equal(corrupt.replayAvailable, false);
    assert.equal(JSON.stringify(corrupt).includes("Batch copy"), false);
    assert.equal(JSON.stringify(corrupt).includes("Editorial copy"), false);
  }
  assert.equal(readFileSync(corruptPath, "utf8"), "{");

  const routeRoot = dirname(fileURLToPath(import.meta.url));
  const routePage = readFileSync(join(routeRoot, "../../app/content-studio/editor/[batchId]/[itemId]/page.tsx"), "utf8");
  const failureSource = readFileSync(join(routeRoot, "../../components/content-studio/EditorialPersistenceFailure.tsx"), "utf8");
  assert.equal(routePage.includes(".catch(() => null)"), false);
  assert.match(routePage, /loadEditorialRouteAction/);
  assert.match(routePage, /EditorialPersistenceFailure/);
  assert.match(routePage, /notFound/);
  assert.match(failureSource, /replayEditorialWriteThroughAction/);
  assert.equal(failureSource.includes("production"), false);
}

const studioRoot = dirname(fileURLToPath(import.meta.url));
const actionsSource = readFileSync(join(studioRoot, "editorial/actions.ts"), "utf8");
const pageSource = readFileSync(join(studioRoot, "../../app/content-studio/editor/[batchId]/[itemId]/page.tsx"), "utf8");
const workspaceSource = readFileSync(join(studioRoot, "../../components/content-studio/EditorialWorkspace.tsx"), "utf8");
const controlSource = readFileSync(join(studioRoot, "../../components/content-studio/StudioBatchControl.tsx"), "utf8");
assert.match(controlSource, /hasDraft/);
assert.equal(controlSource.includes("<form"), false);
assert.match(actionsSource, /"use server"/);
assert.equal(actionsSource.includes("approveProduction"), false);
assert.equal(actionsSource.includes("publishProduction"), false);
assert.equal(actionsSource.includes("generateStudioBatchAction"), false);
assert.equal(actionsSource.includes("createServerRoutedProvider"), false);
assert.match(pageSource, /notFound/);
assert.match(workspaceSource, /aria-disabled/);
assert.match(workspaceSource, /Not available\. Approval and publication are not part of this workspace\./);
assert.equal(workspaceSource.includes("approveEditorial"), false);
assert.equal(workspaceSource.includes("publishEditorial"), false);

const verifierSource = readFileSync(fileURLToPath(import.meta.url), "utf8");
for (let number = 1; number <= 25; number += 1) {
  const marker = `// case ${number}:`;
  const start = verifierSource.indexOf(marker);
  assert.notEqual(start, -1, `missing editorial case ${number}`);
  const next = verifierSource.indexOf("\n// case ", start + marker.length);
  const block = verifierSource.slice(start, next === -1 ? verifierSource.length : next);
  assert.match(block, /assert\./, `missing editorial case ${number}`);
}

console.log("Editorial workspace verification passed.");
