import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pilotPackages } from "@/lib/content/pilot/index";
import { buildReviewProjection } from "@/lib/content/review/projection";
import { getReviewRecord } from "@/lib/content/review/registry";
import { createMemoryBatchJobStore, createPersistentBatch, recordEditorialHandoff } from "@/lib/content-studio/batch-engine/index";
import { commitEditorialSave, commitMarkReadyForApproval, commitMarkReadyForReview, createMemoryEditorialDraftStore, openEditorialDraft } from "@/lib/content-studio/editorial/index";
import { submitReadyEditorialRecord } from "./editorial-handoff";
import {
  approveProduction,
  archiveProduction,
  createProductionCorrection,
  createProductionDraft,
  deprecateProduction,
  evaluateProductionQuality,
  geographyWaterCycleProductionPackage,
  isProductionAiEligible,
  isProductionDeliveryEligible,
  projectProductionDelivery,
  publishProduction,
  recordProductionReview,
  submitProductionForReview,
} from "./index";

const base = pilotPackages[0];
const draft = createProductionDraft(base);
assert.equal(draft.workflowState, "draft");
assert.equal(draft.content.topic.lifecycle, "draft");
assert.equal(isProductionDeliveryEligible(draft), false);
assert.equal(isProductionAiEligible(draft), false);

let review = submitProductionForReview(draft);
assert.equal(review.workflowState, "review");
assert.throws(() => submitProductionForReview(review));
review = recordProductionReview(review, {
  type: "editorial",
  outcome: "passed",
  reviewerId: "reviewer/editorial-1",
  reviewedAt: "2026-09-03T00:00:00.000Z",
});
review = recordProductionReview(review, {
  type: "academic-source",
  outcome: "passed",
  reviewerId: "reviewer/academic-1",
  reviewedAt: "2026-09-03T00:01:00.000Z",
});
const evaluated = evaluateProductionQuality(review);
assert.equal(evaluated.qualityReport?.overall, "pass");

const approved = approveProduction(evaluated);
assert.equal(approved.workflowState, "approved");
assert.throws(() => approveProduction(approved));
const published = publishProduction(approved, "2026-09-03T00:02:00.000Z");
assert.equal(published.workflowState, "published");
assert.equal(published.content.topic.lifecycle, "published");
assert.equal(isProductionDeliveryEligible(published), true);
assert.equal(isProductionAiEligible(published), true);
assert.equal(isProductionDeliveryEligible({ ...published, qualityReport: undefined, qualitySnapshot: undefined }), false);

const originalSnapshot = JSON.stringify(published.content);
const corrected = {
  ...base,
  topic: { ...base.topic, contentVersion: 2 },
  knowledgeUnits: base.knowledgeUnits.map((unit) => ({ ...unit, contentVersion: 2 })),
};
const correction = createProductionCorrection(published, corrected);
assert.equal(correction.workflowState, "draft");
assert.equal(correction.supersedesVersion, 1);
assert.equal(correction.content.topic.contentVersion, 2);
assert.equal(JSON.stringify(published.content), originalSnapshot);

const deprecated = deprecateProduction(published);
assert.equal(deprecated.workflowState, "deprecated");
assert.equal(isProductionDeliveryEligible(deprecated), false);
assert.equal(deprecated.content.topic.lifecycle, "deprecated");
const archived = archiveProduction(deprecated);
assert.equal(archived.workflowState, "archived");
assert.equal(archived.content.topic.lifecycle, "archived");

const blocked = evaluateProductionQuality({
  ...review,
  content: {
    ...review.content,
    topic: { ...review.content.topic, contentVersion: 0 },
  },
});
assert.equal(blocked.qualityReport?.overall, "blocked");
assert.throws(() => approveProduction(blocked));

const legacyLike = { sections: { study: "legacy" }, modules: ["geography-data"] };
assert.throws(() => createProductionDraft(legacyLike as never));

function waterCycleDraft() {
  return evaluateProductionQuality(createProductionDraft(structuredClone(geographyWaterCycleProductionPackage)));
}

function passedReviews(record: ReturnType<typeof submitProductionForReview>) {
  const editorial = recordProductionReview(record, {
    type: "editorial",
    outcome: "passed",
    reviewerId: "reviewer/editorial-1",
    reviewedAt: "2026-09-23T00:00:00.000Z",
  });
  return recordProductionReview(editorial, {
    type: "academic-source",
    outcome: "passed",
    reviewerId: "reviewer/academic-1",
    reviewedAt: "2026-09-23T00:01:00.000Z",
  });
}

const cycleDraft = waterCycleDraft();
assert.equal(projectProductionDelivery(cycleDraft), undefined, "delivery draft");
const cycleReview = submitProductionForReview(cycleDraft);
assert.equal(projectProductionDelivery(cycleReview), undefined, "delivery review");
const cycleApproved = approveProduction(passedReviews(cycleReview));
assert.equal(projectProductionDelivery(cycleApproved), undefined, "delivery approved");
assert.equal(isProductionDeliveryEligible(cycleApproved), false);
assert.equal(cycleApproved.content.topic.contentVersion, 1);
const cyclePublished = publishProduction(cycleApproved, "2026-09-23T00:02:00.000Z");
assert.equal(projectProductionDelivery(cyclePublished), cyclePublished, "delivery published");
assert.equal(cyclePublished.workflowState, "published");
assert.equal(cyclePublished.content.topic.contentVersion, 1);
const blockedDelivery = {
  ...cyclePublished,
  qualitySnapshot: {
    ...cyclePublished.qualitySnapshot!,
    report: { ...cyclePublished.qualitySnapshot!.report, overall: "blocked" as const },
  },
};
assert.equal(projectProductionDelivery(blockedDelivery), undefined, "delivery blocked");
const mismatchedVersion = {
  ...cyclePublished,
  qualitySnapshot: { ...cyclePublished.qualitySnapshot!, contentVersion: 2 },
};
assert.equal(projectProductionDelivery(mismatchedVersion), undefined, "delivery mismatched version");
const mismatchedId = {
  ...cyclePublished,
  qualitySnapshot: { ...cyclePublished.qualitySnapshot!, contentId: "topic/other" },
};
assert.equal(projectProductionDelivery(mismatchedId), undefined, "delivery mismatched id");
const editorialStatus = "ready_for_approval";
assert.equal(cycleApproved.workflowState, "approved");
assert.equal(editorialStatus, "ready_for_approval");
assert.equal(projectProductionDelivery(cycleApproved), undefined);

function assertUnchanged(record: ReturnType<typeof waterCycleDraft>, run: () => void): void {
  const before = JSON.stringify(record);
  assert.throws(run);
  assert.equal(JSON.stringify(record), before);
}

const oneReview = recordProductionReview(submitProductionForReview(waterCycleDraft()), {
  type: "editorial",
  outcome: "passed",
  reviewerId: "reviewer/editorial-1",
  reviewedAt: "2026-09-23T00:00:00.000Z",
});
assertUnchanged(oneReview, () => approveProduction(oneReview));
assert.throws(() => approveProduction(oneReview), /editorial and academic-source reviews must pass before approval/);

const academicOnly = recordProductionReview(submitProductionForReview(waterCycleDraft()), {
  type: "academic-source",
  outcome: "passed",
  reviewerId: "reviewer/academic-1",
  reviewedAt: "2026-09-23T00:01:00.000Z",
});
assertUnchanged(academicOnly, () => approveProduction(academicOnly));

const failedEditorial = recordProductionReview(recordProductionReview(submitProductionForReview(waterCycleDraft()), {
  type: "editorial",
  outcome: "failed",
  reviewerId: "reviewer/editorial-1",
  reviewedAt: "2026-09-23T00:00:00.000Z",
}), {
  type: "academic-source",
  outcome: "passed",
  reviewerId: "reviewer/academic-1",
  reviewedAt: "2026-09-23T00:01:00.000Z",
});
assertUnchanged(failedEditorial, () => approveProduction(failedEditorial));

const mismatchedApprove = passedReviews(submitProductionForReview(waterCycleDraft()));
mismatchedApprove.qualitySnapshot = { ...mismatchedApprove.qualitySnapshot!, contentVersion: 2 };
assertUnchanged(mismatchedApprove, () => approveProduction(mismatchedApprove));
assert.throws(() => approveProduction(mismatchedApprove), /quality snapshot does not match content identity/);
assert.equal(mismatchedApprove.workflowState, "review");

const mismatchedApproveId = passedReviews(submitProductionForReview(waterCycleDraft()));
mismatchedApproveId.qualitySnapshot = { ...mismatchedApproveId.qualitySnapshot!, contentId: "topic/other" };
assertUnchanged(mismatchedApproveId, () => approveProduction(mismatchedApproveId));
assert.throws(() => approveProduction(mismatchedApproveId), /quality snapshot does not match content identity/);

const missingSnapshot = passedReviews(submitProductionForReview(waterCycleDraft()));
delete missingSnapshot.qualitySnapshot;
delete missingSnapshot.qualityReport;
const approvedFromMissing = approveProduction(missingSnapshot);
assert.equal(approvedFromMissing.workflowState, "approved");
assert.equal(approvedFromMissing.content.topic.contentVersion, 1);
assert.equal(approvedFromMissing.qualitySnapshot?.contentId, "topic/geography/water-cycle");
assert.equal(approvedFromMissing.qualitySnapshot?.contentVersion, 1);
assert.equal(missingSnapshot.qualitySnapshot, undefined);

const blockedEvaluation = passedReviews(submitProductionForReview(waterCycleDraft()));
blockedEvaluation.content = {
  ...blockedEvaluation.content,
  topic: { ...blockedEvaluation.content.topic, contentVersion: 0 },
};
delete blockedEvaluation.qualitySnapshot;
delete blockedEvaluation.qualityReport;
assert.throws(() => approveProduction(blockedEvaluation), /quality blockers prevent approval/);
assert.equal(blockedEvaluation.workflowState, "review");

const approvedForPublish = approveProduction(passedReviews(submitProductionForReview(waterCycleDraft())));
const mismatchedPublish = {
  ...approvedForPublish,
  qualitySnapshot: { ...approvedForPublish.qualitySnapshot!, contentVersion: 2 },
};
assert.throws(() => publishProduction(mismatchedPublish, "2026-09-23T00:02:00.000Z"), /quality snapshot does not match content identity/);
assert.equal(mismatchedPublish.workflowState, "approved");
assert.throws(() => publishProduction(approvedForPublish, ""), /publication timestamp is required/);
assert.equal(approvedForPublish.workflowState, "approved");
assert.throws(() => publishProduction(cycleReview, "2026-09-23T00:02:00.000Z"), /only approved content can be published/);

const batchStore = createMemoryBatchJobStore();
const createdBatch = createPersistentBatch({
  store: batchStore,
  batchNumber: 901,
  createdAt: "2026-09-23T00:00:00.000Z",
  topics: [{
    identity: {
      subjectSlug: "geography",
      topicSlug: "water-cycle",
      title: "The Water Cycle",
      summary: "Water Cycle canonical clone.",
    },
    sourceText: "Water Cycle canonical clone.",
  }],
});
const cycleItem = createdBatch.items[0];
const cycleItemDraft = waterCycleDraft();
batchStore.save({
  ...createdBatch,
  state: "completed",
  items: [{
    ...cycleItem,
    state: "succeeded",
    executions: 1,
    result: {
      completedAt: "2026-09-23T00:00:00.000Z",
      pipelineOk: true,
      qualityOverall: "pass",
      draft: cycleItemDraft,
    },
  }],
});
const editorialStore = createMemoryEditorialDraftStore();
const editorialInput = {
  editorialStore,
  batchStore,
  batchId: createdBatch.batchId,
  itemId: cycleItem.itemId,
  updatedAt: "2026-09-23T00:00:00.000Z",
  evaluatedAt: "2026-09-23T00:00:00.000Z",
};
const registryAtOpen = JSON.stringify(getReviewRecord("topic/geography/water-cycle"));
const packageBefore = readFileSync(new URL("./batches/geography-water-cycle.ts", import.meta.url), "utf8");
const legacyBefore = readFileSync(new URL("../../geography-data.ts", import.meta.url), "utf8");
const routeBefore = readFileSync(new URL("../../../app/geography/[topic]/page.tsx", import.meta.url), "utf8");
const openedCycle = openEditorialDraft(batchStore, editorialStore, createdBatch.batchId, cycleItem.itemId);
assert.equal(openedCycle.editorialStatus, "needs_editing");
assert.equal(openedCycle.persisted, false);
assert.equal(editorialStore.load(createdBatch.batchId, cycleItem.itemId), null);
const readyForReview = commitMarkReadyForReview({ ...editorialInput, expectedRevision: 0 });
const readyForApproval = commitMarkReadyForApproval({ ...editorialInput, expectedRevision: readyForReview.revision });
assert.equal(readyForApproval.editorialStatus, "ready_for_approval");
assert.equal(readyForApproval.production.content.topic.contentVersion, 1);
const registryBefore = JSON.stringify(getReviewRecord("topic/geography/water-cycle"));
const submitted = submitReadyEditorialRecord({
  editorial: readyForApproval,
  batchDraft: readyForApproval.production,
  canonical: waterCycleDraft(),
});
assert.equal(submitted.workflowState, "review", "bridge submits");
assert.equal(submitted.content.topic.lifecycle, "review");
assert.equal(JSON.stringify(getReviewRecord("topic/geography/water-cycle")), registryBefore);
const submittedProjection = buildReviewProjection(submitted);
assert.equal(submittedProjection.lifecycle.workflowState, "review");
assert.equal(submittedProjection.lifecycle.deliverable, false);
assert.equal(submittedProjection.lifecycle.aiGroundable, false);
assert.equal(buildReviewProjection(cycleDraft).lifecycle.deliverable, false);
assert.equal(buildReviewProjection(cycleDraft).lifecycle.aiGroundable, false);
assert.equal(buildReviewProjection(cycleApproved).lifecycle.deliverable, false);
assert.equal(buildReviewProjection(cycleApproved).lifecycle.aiGroundable, false);

const blockedReady = {
  ...readyForApproval,
  production: {
    ...readyForApproval.production,
    qualitySnapshot: {
      ...readyForApproval.production.qualitySnapshot!,
      report: { ...readyForApproval.production.qualitySnapshot!.report, overall: "blocked" as const },
    },
  },
};
assert.throws(() => submitReadyEditorialRecord({
  editorial: blockedReady,
  batchDraft: blockedReady.production,
  canonical: blockedReady.production,
}), /quality blockers prevent canonical submission/);
assert.equal(JSON.stringify(getReviewRecord("topic/geography/water-cycle")), registryBefore);

const dangling = structuredClone(readyForApproval.production);
dangling.content.claims[0].sourceReferenceIds = ["ref/missing"];
const danglingEvaluated = evaluateProductionQuality(dangling);
const danglingReady = { ...readyForApproval, production: danglingEvaluated };
assert.throws(() => submitReadyEditorialRecord({
  editorial: danglingReady,
  batchDraft: danglingEvaluated,
  canonical: danglingEvaluated,
}), /quality blockers prevent canonical submission/);

const mismatchedBridge = structuredClone(readyForApproval.production);
mismatchedBridge.qualitySnapshot = { ...mismatchedBridge.qualitySnapshot!, contentVersion: 2 };
const mismatchedReady = { ...readyForApproval, production: mismatchedBridge };
assert.throws(() => submitReadyEditorialRecord({
  editorial: mismatchedReady,
  batchDraft: mismatchedBridge,
  canonical: mismatchedBridge,
}), /quality snapshot does not match content identity/);

const unequalDraft = structuredClone(readyForApproval.production);
unequalDraft.content.topic.title = "Diverged title";
assert.throws(() => submitReadyEditorialRecord({
  editorial: readyForApproval,
  batchDraft: unequalDraft,
  canonical: readyForApproval.production,
}), /Editorial workspace: persistence failure/);
assert.equal(editorialStore.load(createdBatch.batchId, cycleItem.itemId)?.editorialStatus, "ready_for_approval");

const handed = recordEditorialHandoff({
  store: batchStore,
  batchId: createdBatch.batchId,
  itemId: cycleItem.itemId,
  reviewerId: "reviewer/editorial-1",
  decidedAt: "2026-09-23T00:00:00.000Z",
});
submitReadyEditorialRecord({
  editorial: readyForApproval,
  batchDraft: readyForApproval.production,
  canonical: waterCycleDraft(),
});
assert.equal(handed.handoffs[0]?.registeredInContentReview, false);
assert.equal(batchStore.load(createdBatch.batchId)?.handoffs[0]?.registeredInContentReview, false);

const publishBefore = JSON.stringify(approvedForPublish);
assert.throws(() => publishProduction(approvedForPublish, ""));
assert.equal(JSON.stringify(approvedForPublish), publishBefore);
let slot = approvedForPublish;
try {
  const next = publishProduction(slot, "");
  slot = next;
} catch {
  // assignment happens only after a successful return
}
assert.equal(slot.workflowState, "approved");

const publishedCycle = publishProduction(approveProduction(passedReviews(submitProductionForReview(waterCycleDraft()))), "2026-09-23T00:02:00.000Z");
const publishedBefore = JSON.stringify(publishedCycle);
const correctedContent = structuredClone(publishedCycle.content);
correctedContent.topic.contentVersion = 2;
correctedContent.knowledgeUnits = correctedContent.knowledgeUnits.map((unit) => ({ ...unit, contentVersion: 2 }));
correctedContent.assessmentAlignments = correctedContent.assessmentAlignments.map((alignment) => ({ ...alignment, contentVersion: 2 }));
const cycleCorrection = createProductionCorrection(publishedCycle, correctedContent);
assert.equal(cycleCorrection.workflowState, "draft");
assert.equal(cycleCorrection.content.topic.contentVersion, 2);
assert.equal(cycleCorrection.supersedesVersion, 1);
assert.equal(JSON.stringify(publishedCycle), publishedBefore);
assert.equal(projectProductionDelivery(publishedCycle), publishedCycle);
assert.equal(projectProductionDelivery(cycleCorrection), undefined);
const tooFar = structuredClone(correctedContent);
tooFar.topic.contentVersion = 3;
assert.throws(() => createProductionCorrection(publishedCycle, tooFar), /correction must increment content version by exactly one/);
assert.equal(JSON.stringify(publishedCycle), publishedBefore);

const correctionBatch = createMemoryBatchJobStore();
const correctionCreated = createPersistentBatch({
  store: correctionBatch,
  batchNumber: 902,
  createdAt: "2026-09-23T00:00:00.000Z",
  topics: [{
    identity: {
      subjectSlug: "geography",
      topicSlug: "water-cycle-correction",
      title: "The Water Cycle",
      summary: "Water Cycle correction clone.",
    },
    sourceText: "Water Cycle correction clone.",
  }],
});
const correctionItem = correctionCreated.items[0];
correctionBatch.save({
  ...correctionCreated,
  state: "completed",
  items: [{
    ...correctionItem,
    state: "succeeded",
    executions: 1,
    result: {
      completedAt: "2026-09-23T00:00:00.000Z",
      pipelineOk: true,
      qualityOverall: "pass",
      draft: cycleCorrection,
    },
  }],
});
const correctionEditorial = createMemoryEditorialDraftStore();
const correctionSave = {
  editorialStore: correctionEditorial,
  batchStore: correctionBatch,
  batchId: correctionCreated.batchId,
  itemId: correctionItem.itemId,
  updatedAt: "2026-09-23T00:03:00.000Z",
  evaluatedAt: "2026-09-23T00:03:00.000Z",
};
assert.throws(() => commitEditorialSave({ ...correctionSave, expectedRevision: 0, patch: { topic: { title: "Water Cycle draft N+1" } } }), /malformed draft: immutable field/);
assert.equal(JSON.stringify(publishedCycle), publishedBefore);
const staleBatch = createMemoryBatchJobStore();
const staleCreated = createPersistentBatch({
  store: staleBatch,
  batchNumber: 903,
  createdAt: "2026-09-23T00:00:00.000Z",
  topics: [{
    identity: {
      subjectSlug: "geography",
      topicSlug: "water-cycle-stale",
      title: "The Water Cycle",
      summary: "Water Cycle stale clone.",
    },
    sourceText: "Water Cycle stale clone.",
  }],
});
const staleItem = staleCreated.items[0];
staleBatch.save({
  ...staleCreated,
  state: "completed",
  items: [{
    ...staleItem,
    state: "succeeded",
    executions: 1,
    result: {
      completedAt: "2026-09-23T00:00:00.000Z",
      pipelineOk: true,
      qualityOverall: "pass",
      draft: waterCycleDraft(),
    },
  }],
});
const staleEditorial = createMemoryEditorialDraftStore();
const staleSave = {
  editorialStore: staleEditorial,
  batchStore: staleBatch,
  batchId: staleCreated.batchId,
  itemId: staleItem.itemId,
  updatedAt: "2026-09-23T00:03:00.000Z",
  evaluatedAt: "2026-09-23T00:03:00.000Z",
};
commitEditorialSave({ ...staleSave, expectedRevision: 0, patch: { topic: { title: "First stale tab" } } });
assert.throws(() => commitEditorialSave({ ...staleSave, expectedRevision: 0, patch: { topic: { title: "Second stale tab" } } }), /Editorial workspace: stale edit/);
assert.equal(JSON.stringify(publishedCycle), publishedBefore);

const newerCanonical = waterCycleDraft();
newerCanonical.content = {
  ...newerCanonical.content,
  topic: { ...newerCanonical.content.topic, contentVersion: 2 },
};
assert.throws(() => submitReadyEditorialRecord({
  editorial: readyForApproval,
  batchDraft: readyForApproval.production,
  canonical: newerCanonical,
}), /stale content version/);
assert.equal(readyForApproval.editorialStatus, "ready_for_approval");
assert.equal(newerCanonical.workflowState, "draft");
assert.equal(JSON.stringify(getReviewRecord("topic/geography/water-cycle")), registryAtOpen);
assert.equal(readFileSync(new URL("./batches/geography-water-cycle.ts", import.meta.url), "utf8"), packageBefore);
assert.equal(readFileSync(new URL("../../geography-data.ts", import.meta.url), "utf8"), legacyBefore);
assert.equal(readFileSync(new URL("../../../app/geography/[topic]/page.tsx", import.meta.url), "utf8"), routeBefore);
assert.equal(publishedCycle.content.assessmentAlignments[0]?.id, "alignment/geography-production/water-cycle");
assert.equal(publishedCycle.content.assessmentAlignments[0]?.assessmentSetId, "pilot/geography/water-cycle");
const handoffSource = readFileSync(new URL("./editorial-handoff.ts", import.meta.url), "utf8");
const workflowSource = readFileSync(new URL("./workflow.ts", import.meta.url), "utf8");
for (const source of [handoffSource, workflowSource.slice(workflowSource.indexOf("export function projectProductionDelivery"), workflowSource.indexOf("export function isProductionDeliveryEligible"))]) {
  assert.equal(source.includes("src/lib/search"), false);
  assert.equal(source.includes("learner-intelligence"), false);
  assert.equal(source.includes("assessment-engine"), false);
  assert.equal(source.includes("geography-data"), false);
}
assert.equal(handoffSource.includes("approveProduction"), false);
assert.equal(handoffSource.includes("publishProduction"), false);

console.log("Canonical content production verification passed.");
