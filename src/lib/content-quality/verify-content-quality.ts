import assert from "node:assert/strict";
import { pilotPackages } from "@/lib/content/pilot/index";
import { isAiGroundingEligible, isSearchEligible, validateContentQuality } from "./index";
import type { PilotPackage } from "@/lib/content/pilot/index";

const reports = pilotPackages.map(validateContentQuality);
assert.ok(reports.every((report) => report.overall === "pass"));
assert.ok(reports.every((report) => isSearchEligible(report, pilotPackages[reports.indexOf(report)])));
assert.ok(reports.every((report) => isAiGroundingEligible(report, pilotPackages[reports.indexOf(report)])));
assert.deepEqual(reports, pilotPackages.map(validateContentQuality));

const clone = (pkg: PilotPackage, change: (copy: PilotPackage) => PilotPackage): PilotPackage => change({
  ...pkg,
  topic: { ...pkg.topic },
  concepts: [...pkg.concepts],
  objectives: [...pkg.objectives],
  knowledgeUnits: pkg.knowledgeUnits.map((unit) => ({ ...unit, blocks: unit.blocks.map((contentBlock) => ({ ...contentBlock, payload: { ...contentBlock.payload } })) })),
  claims: pkg.claims.map((claim) => ({ ...claim, sourceReferenceIds: [...claim.sourceReferenceIds] })),
  sources: pkg.sources.map((source) => ({ ...source })),
  sourceReferences: pkg.sourceReferences.map((reference) => ({ ...reference })),
  assessmentAlignments: pkg.assessmentAlignments.map((alignment) => ({ ...alignment, objectiveIds: [...alignment.objectiveIds], conceptIds: [...alignment.conceptIds], knowledgeUnitIds: [...alignment.knowledgeUnitIds] })),
});

const cases: Array<{ name: string; pkg: PilotPackage; status: "blocked" | "warning" }> = [
  { name: "missing identity", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, topic: { ...copy.topic, id: "" } })), status: "blocked" },
  { name: "duplicate KnowledgeUnit", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, knowledgeUnits: [...copy.knowledgeUnits, copy.knowledgeUnits[0]] })), status: "blocked" },
  { name: "malformed ContentBlock", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, knowledgeUnits: copy.knowledgeUnits.map((unit, index) => index === 0 ? { ...unit, blocks: [{ ...unit.blocks[0], order: 0, payload: {} }] } : unit) })), status: "blocked" },
  { name: "dangling Claim source", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, claims: copy.claims.map((claim) => ({ ...claim, sourceReferenceIds: ["ref/missing"] })) })), status: "blocked" },
  { name: "invalid lifecycle", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, topic: { ...copy.topic, lifecycle: "draft" } })), status: "blocked" },
  { name: "invalid version", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, topic: { ...copy.topic, contentVersion: 0 } })), status: "blocked" },
  { name: "invalid assessment reference", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, assessmentAlignments: copy.assessmentAlignments.map((alignment) => ({ ...alignment, assessmentSetId: "bad" })) })), status: "blocked" },
  { name: "AI-ineligible draft", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, topic: { ...copy.topic, lifecycle: "draft" } })), status: "blocked" },
  { name: "search-private-data leak", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, knowledgeUnits: copy.knowledgeUnits.map((unit, index) => index === 0 ? { ...unit, extension: { learnerId: "private" } } : unit) })), status: "blocked" },
  { name: "learner invalid reference", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, knowledgeUnits: copy.knowledgeUnits.map((unit, index) => index === 0 ? { ...unit, id: "bad" } : unit) })), status: "blocked" },
  { name: "universal-core violation", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, knowledgeUnits: copy.knowledgeUnits.map((unit, index) => index === 0 ? { ...unit, extension: { pageSection: "sidebar" } } : unit) })), status: "blocked" },
  { name: "warning-only package", pkg: clone(pilotPackages[0], (copy) => ({ ...copy, concepts: copy.concepts.map((concept, index) => index === 0 ? { ...concept, aliases: [] } : concept) })), status: "warning" },
];

for (const testCase of cases) {
  const report = validateContentQuality(testCase.pkg);
  assert.equal(report.overall, testCase.status, testCase.name);
}

const legacyLike = { sections: { study: "legacy" }, modules: ["geography-data"] };
assert.throws(() => validateContentQuality(legacyLike as unknown as PilotPackage));
console.log("Content quality gate verification passed.");
