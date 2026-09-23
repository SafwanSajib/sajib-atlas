import assert from "node:assert/strict";
import { pilotPackages, validatePilotPackage } from "@/lib/content/pilot/index";
import { createProductionDraft, evaluateProductionQuality, geographyAtmosphereProductionPackage, geographyLatitudeLongitudeProductionPackage, geographyPlateTectonicsProductionPackage, geographyWaterCycleProductionPackage } from "@/lib/content/production/index";
import { buildReviewProjection } from "./index";

validatePilotPackage(geographyWaterCycleProductionPackage);
assert.equal(geographyWaterCycleProductionPackage.knowledgeUnits.length, 6);
assert.equal(JSON.stringify(geographyWaterCycleProductionPackage).includes("geography-data"), false);
const productionRecord = evaluateProductionQuality(createProductionDraft(geographyWaterCycleProductionPackage));
assert.equal(productionRecord.qualitySnapshot?.contentId, "topic/geography/water-cycle");
assert.equal(productionRecord.qualitySnapshot?.contentVersion, 1);
assert.equal(productionRecord.qualitySnapshot?.report.overall, "pass");
assert.equal(buildReviewProjection(productionRecord).content.knowledgeUnits.length, 6);
validatePilotPackage(geographyLatitudeLongitudeProductionPackage);
assert.equal(geographyLatitudeLongitudeProductionPackage.topic.id, "topic/geography/latitude-and-longitude");
assert.equal(geographyLatitudeLongitudeProductionPackage.concepts.length, 5);
assert.equal(geographyLatitudeLongitudeProductionPackage.knowledgeUnits.length, 6);
assert.equal(JSON.stringify(geographyLatitudeLongitudeProductionPackage).includes("geography-data"), false);
const coordinateRecord = evaluateProductionQuality(createProductionDraft(geographyLatitudeLongitudeProductionPackage));
assert.equal(coordinateRecord.qualitySnapshot?.report.overall, "pass");
assert.equal(coordinateRecord.workflowState, "draft");
assert.ok(buildReviewProjection(coordinateRecord).content.knowledgeUnits.some((unit) => unit.title.includes("Degrees")));
validatePilotPackage(geographyAtmosphereProductionPackage);
assert.equal(geographyAtmosphereProductionPackage.topic.id, "topic/geography/atmosphere");
assert.equal(geographyAtmosphereProductionPackage.concepts.length, 5);
assert.equal(geographyAtmosphereProductionPackage.knowledgeUnits.length, 7);
assert.equal(geographyAtmosphereProductionPackage.objectives.length, 5);
assert.equal(JSON.stringify(geographyAtmosphereProductionPackage).includes("geography-data"), false);
const atmosphereRecord = evaluateProductionQuality(createProductionDraft(geographyAtmosphereProductionPackage));
assert.equal(atmosphereRecord.qualitySnapshot?.contentId, "topic/geography/atmosphere");
assert.equal(atmosphereRecord.qualitySnapshot?.contentVersion, 1);
assert.equal(atmosphereRecord.qualitySnapshot?.report.overall, "pass");
assert.equal(atmosphereRecord.workflowState, "draft");
assert.ok(buildReviewProjection(atmosphereRecord).content.knowledgeUnits.some((unit) => unit.title.includes("layers")));
validatePilotPackage(geographyPlateTectonicsProductionPackage);
assert.equal(geographyPlateTectonicsProductionPackage.topic.id, "topic/geography/plate-tectonics");
assert.equal(geographyPlateTectonicsProductionPackage.concepts.length, 5);
assert.equal(geographyPlateTectonicsProductionPackage.knowledgeUnits.length, 7);
assert.equal(geographyPlateTectonicsProductionPackage.objectives.length, 5);
assert.equal(JSON.stringify(geographyPlateTectonicsProductionPackage).includes("geography-data"), false);
const tectonicsRecord = evaluateProductionQuality(createProductionDraft(geographyPlateTectonicsProductionPackage));
assert.equal(tectonicsRecord.qualitySnapshot?.contentId, "topic/geography/plate-tectonics");
assert.equal(tectonicsRecord.qualitySnapshot?.contentVersion, 1);
assert.equal(tectonicsRecord.qualitySnapshot?.report.overall, "pass");
assert.equal(tectonicsRecord.workflowState, "draft");
assert.ok(buildReviewProjection(tectonicsRecord).content.knowledgeUnits.some((unit) => unit.title.includes("boundaries")));
const records = [
  productionRecord,
  coordinateRecord,
  atmosphereRecord,
  tectonicsRecord,
  ...pilotPackages
    .filter((pkg) => ![geographyWaterCycleProductionPackage.topic.id, geographyLatitudeLongitudeProductionPackage.topic.id, geographyAtmosphereProductionPackage.topic.id, geographyPlateTectonicsProductionPackage.topic.id].includes(pkg.topic.id))
    .map((pkg) => evaluateProductionQuality(createProductionDraft(pkg))),
];
const first = buildReviewProjection(records[0]);
assert.equal(first.quality.status, "PASS");
assert.equal(first.quality.evaluationStatus, "evaluated");
assert.equal(first.identity.topicId, records[0].content.topic.id);
assert.equal(first.identity.contentVersion, records[0].content.topic.contentVersion);
assert.equal(first.lifecycle.workflowState, "draft");
assert.equal(first.lifecycle.deliverable, false);
assert.equal(JSON.stringify(first), JSON.stringify(buildReviewProjection(records[0])));
assert.ok(first.content.knowledgeUnits.length > 0);
assert.ok(first.evidence.claims.length > 0);
assert.ok(first.integrations.assessment.length > 0);

const missing = buildReviewProjection({ ...records[0], qualitySnapshot: undefined, qualityReport: undefined });
assert.equal(missing.quality.status, "NOT EVALUATED");
assert.equal(missing.quality.evaluationStatus, "not-evaluated");

const stale = buildReviewProjection({
  ...records[0],
  qualitySnapshot: {
    ...records[0].qualitySnapshot!,
    contentVersion: records[0].content.topic.contentVersion + 1,
  },
});
assert.equal(stale.quality.status, "NOT EVALUATED");

const serialized = JSON.stringify(first).toLowerCase();
for (const forbidden of ["answerkey", "correctanswer", "learnerid", "apikey", "credentials", "providerresponse"]) {
  assert.equal(serialized.includes(forbidden), false, `forbidden field leaked: ${forbidden}`);
}

assert.equal(records.length, 6);
assert.deepEqual(
  records.map((record) => record.content.topic.subjectId),
  ["subject/geography", "subject/geography", "subject/geography", "subject/geography", "subject/english", "subject/history"],
);
console.log("Canonical content review verification passed.");
