import assert from "node:assert/strict";
import { pilotPackages, projectPilotToAiGrounding, projectPilotToLearnerReferences, projectPilotToSearch, validateAllPilotPackages } from "./index";

validateAllPilotPackages(pilotPackages);
assert.equal(pilotPackages.length, 3);
assert.deepEqual(pilotPackages.map((item) => item.topic.id), [
  "topic/geography/water-cycle",
  "topic/english/subject-verb-agreement",
  "topic/history/udhr-adoption",
]);

for (const pkg of pilotPackages) {
  assert.equal(pkg.topic.lifecycle, "published");
  assert.ok(pkg.topic.contentVersion >= 1);
  assert.ok(pkg.concepts.length >= 3 && pkg.concepts.length <= 5);
  assert.ok(pkg.knowledgeUnits.length >= 4 && pkg.knowledgeUnits.length <= 8);
  assert.ok(pkg.assessmentAlignments.length >= 1);
  const search = projectPilotToSearch(pkg);
  assert.deepEqual(search, projectPilotToSearch(pkg));
  assert.ok(search.every((item) => item.contentVersion === 1 && item.lifecycle === "published"));
  assert.ok(search.every((item) => !("answer" in item) && !("learnerState" in item)));
  const grounding = projectPilotToAiGrounding(pkg);
  assert.ok(grounding.every((item) => item.lifecycle === "published" && item.contentVersion === 1));
  assert.ok(grounding.every((item) => item.sourceReferenceIds.length > 0));
  assert.deepEqual(projectPilotToLearnerReferences(pkg), projectPilotToLearnerReferences(pkg));
  assert.ok(pkg.assessmentAlignments.every((item) => !("correctness" in item) && !("score" in item)));
}

const history = pilotPackages[2];
const interpretation = history.claims.find((item) => item.id === "claim/history/significance");
assert.ok(interpretation);
assert.equal(interpretation.interpretationStatus, "interpretation");
assert.equal(interpretation.conflictGroupId, "conflict/history/significance");

console.log("Multi-subject canonical content pilot verification passed.");
