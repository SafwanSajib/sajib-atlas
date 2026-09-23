import type { PilotPackage } from "./types";

function fail(message: string): never {
  throw new Error(`Canonical content pilot: ${message}`);
}

export function validatePilotPackage(pkg: PilotPackage): PilotPackage {
  const topic = pkg.topic;
  if (topic.lifecycle !== "published" || topic.contentVersion < 1) fail(`invalid publication metadata on ${topic.id}`);
  if (pkg.concepts.length < 3 || pkg.concepts.length > 5) fail(`${topic.id} must have 3-5 concepts`);
  if (pkg.knowledgeUnits.length < 4 || pkg.knowledgeUnits.length > 8) fail(`${topic.id} must have 4-8 KnowledgeUnits`);
  if (pkg.sources.length < 3) fail(`${topic.id} must have at least 3 sources`);
  if (pkg.assessmentAlignments.length < 1) fail(`${topic.id} is missing assessment alignment`);

  const ids = new Set<string>();
  const addId = (id: string, kind: string) => {
    if (!id.trim() || ids.has(id)) fail(`duplicate or empty ${kind} id ${id}`);
    ids.add(id);
  };
  for (const item of pkg.concepts) addId(item.id, "concept");
  for (const item of pkg.objectives) addId(item.id, "objective");
  for (const item of pkg.knowledgeUnits) {
    addId(item.id, "KnowledgeUnit");
    if (item.lifecycle !== "published") fail(`${item.id} is not published`);
    if (item.blocks.length === 0) fail(`${item.id} has no semantic blocks`);
    for (const contentBlock of item.blocks) {
      if (!contentBlock.payload || Object.keys(contentBlock.payload).length === 0) fail(`${contentBlock.id} has no payload`);
      for (const claimId of contentBlock.claimIds ?? []) {
        if (!pkg.claims.some((claim) => claim.id === claimId)) fail(`${contentBlock.id} references unknown claim ${claimId}`);
      }
    }
    for (const referenceId of item.sourceReferenceIds ?? []) {
      if (!pkg.sourceReferences.some((reference) => reference.id === referenceId)) fail(`${item.id} references unknown source reference ${referenceId}`);
    }
  }
  for (const claim of pkg.claims) {
    addId(claim.id, "claim");
    if (claim.sourceReferenceIds.length === 0) fail(`${claim.id} has no evidence`);
    if (claim.interpretationStatus === "disputed" && !claim.conflictGroupId) fail(`${claim.id} is disputed without conflict group`);
  }
  for (const source of pkg.sources) addId(source.id, "source");
  for (const reference of pkg.sourceReferences) {
    addId(reference.id, "source reference");
    if (!pkg.sources.some((source) => source.id === reference.sourceId)) fail(`${reference.id} references unknown source`);
  }
  for (const alignment of pkg.assessmentAlignments) {
    addId(alignment.id, "assessment alignment");
    if (!alignment.assessmentSetId || alignment.knowledgeUnitIds.length === 0) fail(`${alignment.id} is incomplete`);
    if (alignment.contentVersion !== topic.contentVersion) fail(`${alignment.id} version does not match topic`);
  }
  for (const conceptId of topic.conceptIds) if (!pkg.concepts.some((item) => item.id === conceptId)) fail(`${topic.id} references unknown concept ${conceptId}`);
  for (const unitId of topic.knowledgeUnitIds) if (!pkg.knowledgeUnits.some((item) => item.id === unitId)) fail(`${topic.id} references unknown KnowledgeUnit ${unitId}`);
  return pkg;
}

export function validateAllPilotPackages(packages: readonly PilotPackage[]): readonly PilotPackage[] {
  const topics = new Set<string>();
  for (const pkg of packages) {
    if (topics.has(pkg.topic.id)) fail(`duplicate topic ${pkg.topic.id}`);
    topics.add(pkg.topic.id);
    validatePilotPackage(pkg);
  }
  if (packages.length !== 3) fail("pilot must contain exactly three subject packages");
  return packages;
}
