import assert from "node:assert/strict";
import { pilotPackages } from "@/lib/content/pilot/index";
import {
  approveProduction,
  archiveProduction,
  createProductionCorrection,
  createProductionDraft,
  deprecateProduction,
  evaluateProductionQuality,
  isProductionAiEligible,
  isProductionDeliveryEligible,
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

console.log("Canonical content production verification passed.");
