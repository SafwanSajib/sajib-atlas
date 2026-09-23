import assert from "node:assert/strict";
import type { AiProvider, AiProviderInput, AiProviderOutput } from "@/lib/ai-intelligence/provider";
import { isProductionAiEligible, isProductionDeliveryEligible } from "@/lib/content/production/index";
import { getReviewRecords } from "@/lib/content/review/index";
import { approveProduction, publishProduction } from "@/lib/content/production/index";
import { pilotPackages, projectPilotToAiGrounding, projectPilotToLearnerReferences } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import { validateAi, validateLearner } from "@/lib/content-quality/validators";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STUDIO_MAX_OUTPUT_TOKENS,
  STUDIO_STORAGE_KEY,
  STUDIO_TIMEOUT_MS,
  buildStudioPrompt,
  exportStudioDraftJson,
  exportStudioDraftTypeScript,
  buildStudioSourcePacket,
  isPacketVerifiedSource,
  isStudioSourcePacketThin,
  listStudioLibraryEntries,
  loadStudioDrafts,
  parseStudioPackage,
  resolveStudioIdentity,
  restoreStudioDraft,
  runStudioBatch,
  runStudioPipeline,
  saveStudioDraft,
  sourcePacketToGenerationInput,
} from "./index";
import type { StudioKeyValueStore, StudioTopicIdentity } from "./types";

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

function memoryStore(initial: Record<string, string> = {}): StudioKeyValueStore {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

function scriptedProvider(outputs: readonly AiProviderOutput[], recorder: { calls: number; inputs: AiProviderInput[] }): AiProvider {
  return {
    async complete(input) {
      recorder.calls += 1;
      recorder.inputs.push(input);
      return outputs[Math.min(recorder.calls - 1, outputs.length - 1)] ?? { status: "failed", text: "no scripted output" };
    },
  };
}

const identityInput = {
  subjectSlug: "studio",
  topicSlug: "sample-draft",
  title: "Studio Sample Draft",
  summary: "A non-canonical studio draft used only for verification.",
};

const identity = resolveStudioIdentity(identityInput);
assert.equal(identity.topicId, "topic/studio/sample-draft");
assert.equal(identity.subjectId, "subject/studio");
assert.equal(identity.disciplineId, "discipline/studio");
assert.equal(
  resolveStudioIdentity({ subjectSlug: "geography", title: "Coastal Landforms" }).topicId,
  "topic/geography/coastal-landforms",
);
assert.throws(() => resolveStudioIdentity({ ...identityInput, topicSlug: "Not Valid" }));
assert.throws(() => resolveStudioIdentity({ ...identityInput, subjectSlug: "" }));

const prompt = buildStudioPrompt(identity, "Source text about a hydrologic process.", [
  { title: "USGS Water Cycle", publisherOrOrganization: "U.S. Geological Survey", reference: "https://www.usgs.gov/special-topics/water-science-school/water-cycle" },
]);
assert.match(prompt.system, /draft/i);
assert.match(prompt.system, /not canonical|non-canonical|never (become )?canonical/i);
assert.match(prompt.system, /not published|do not publish|must not publish/i);
assert.match(prompt.system, /never invent sources|do not invent sources/i);
assert.match(prompt.system, /fact/i);
assert.match(prompt.system, /interpretation/i);
assert.match(prompt.user, /Source text about a hydrologic process/);
assert.match(prompt.user, /knowledgeUnits|KnowledgeUnit/);
assert.match(prompt.user, /USGS Water Cycle/);

const fixture = remapPackage(pilotPackages[2], identity);
const parsed = parseStudioPackage(JSON.stringify(fixture), identity);
assert.equal(parsed.ok, true);
if (!parsed.ok) throw new Error("expected parse success");
assert.equal(parsed.pkg.topic.id, identity.topicId);
assert.equal(parsed.pkg.topic.lifecycle, fixture.topic.lifecycle);

const fenced = parseStudioPackage(`Leading prose\n\`\`\`json\n${JSON.stringify(fixture)}\n\`\`\`\ntrailing`, identity);
assert.equal(fenced.ok, true);
assert.equal(parseStudioPackage("not-json", identity).ok, false);
assert.equal(parseStudioPackage("{}", identity).ok, false);
assert.equal(parseStudioPackage('{"id":"id":"ku-water-cycle-definition"}', identity).ok, false);
assert.equal(
  parseStudioPackage(`Leading prose\n${JSON.stringify(fixture)}\ntrailing commentary`, identity).ok,
  false,
  "prose around bare JSON must not be extracted",
);
assert.match(prompt.system, /duplicate keys/i);
assert.match(prompt.system, /trailing commas/i);
assert.match(prompt.user, /"blocks"/);
assert.match(prompt.user, /"payload"/);

const versionlessUnitPkg: PilotPackage = {
  ...fixture,
  knowledgeUnits: fixture.knowledgeUnits.map((unit, index) =>
    index === 0 ? { ...unit, id: "unit/geography/water-reservoirs", contentVersion: 1 } : unit,
  ),
};
assert.equal(projectPilotToLearnerReferences(versionlessUnitPkg)[0], "unit/geography/water-reservoirs@v1");
assert.equal(validateLearner(versionlessUnitPkg).length, 0);

const versionedUnitPkg: PilotPackage = {
  ...fixture,
  knowledgeUnits: fixture.knowledgeUnits.map((unit, index) =>
    index === 0 ? { ...unit, id: "unit/geography/water-reservoirs@v1", contentVersion: 1 } : unit,
  ),
};
assert.equal(projectPilotToLearnerReferences(versionedUnitPkg)[0], "unit/geography/water-reservoirs@v1@v1");
assert.ok(validateLearner(versionedUnitPkg).some((item) => item.code === "learner-compatibility.invalid-reference"));

const versionedRaw = JSON.parse(JSON.stringify(fixture)) as PilotPackage;
versionedRaw.knowledgeUnits = versionedRaw.knowledgeUnits.map((unit, index) =>
  index === 0 ? { ...unit, id: "unit/geography/water-reservoirs@v1", contentVersion: 1 } : unit,
);
const rejectedVersioned = parseStudioPackage(JSON.stringify(versionedRaw), identity);
assert.equal(rejectedVersioned.ok, false);
if (!rejectedVersioned.ok) {
  assert.match(rejectedVersioned.error.message, /versionless|contentVersion/i);
}

assert.match(prompt.system, /contentVersion carries version/i);
assert.match(prompt.user, /"id":"unit\/[^"]+"/);
assert.doesNotMatch(prompt.user, /"id":"unit\/[^"]+@v\d+"/);
assert.doesNotMatch(prompt.user, /unit\/\.\.\.\/\.\.\.@v1/);

const unlinkedGroundingPkg: PilotPackage = {
  ...fixture,
  topic: { ...fixture.topic, lifecycle: "published" },
  knowledgeUnits: fixture.knowledgeUnits.map((unit) => ({
    ...unit,
    lifecycle: "published" as const,
    claimIds: undefined,
    sourceReferenceIds: undefined,
    blocks: unit.blocks.map((block) => ({ ...block, claimIds: undefined, sourceReferenceIds: undefined })),
  })),
};
assert.ok(validateAi(unlinkedGroundingPkg).some((item) => item.code === "ai-grounding.missing-provenance"));
assert.ok(projectPilotToAiGrounding(unlinkedGroundingPkg).some((row) => row.sourceReferenceIds.length === 0));

const linkedGroundingPkg: PilotPackage = {
  ...fixture,
  topic: { ...fixture.topic, lifecycle: "published" },
  knowledgeUnits: fixture.knowledgeUnits.map((unit) => ({
    ...unit,
    lifecycle: "published" as const,
    sourceReferenceIds: unit.sourceReferenceIds && unit.sourceReferenceIds.length > 0 ? unit.sourceReferenceIds : fixture.sourceReferences.slice(0, 1).map((item) => item.id),
    claimIds: unit.claimIds,
    blocks: unit.blocks.map((block) => ({
      ...block,
      claimIds: block.claimIds,
      sourceReferenceIds: block.sourceReferenceIds ?? unit.sourceReferenceIds,
    })),
  })),
};
assert.equal(
  validateAi(linkedGroundingPkg).some((item) => item.code === "ai-grounding.missing-provenance"),
  false,
);
assert.ok(projectPilotToAiGrounding(linkedGroundingPkg).every((row) => row.sourceReferenceIds.length > 0));

assert.match(prompt.user, /"sourceReferenceIds"/);
assert.match(prompt.user, /"claimIds"/);
assert.match(prompt.system, /source-reference IDs supplied by the Source Packet|only source-reference IDs supplied/i);

const malformedPipeline = await runStudioPipeline({
  identity: identityInput,
  sourceText: "Authoritative notes for a studio draft package.",
  provider: scriptedProvider(
    [{ status: "success", text: '{"id":"id":"ku-water-cycle-definition"}' }],
    { calls: 0, inputs: [] },
  ),
});
assert.equal(malformedPipeline.ok, false);
if (!malformedPipeline.ok) {
  assert.equal(malformedPipeline.error.code, "parse_failure");
  assert.equal("record" in malformedPipeline, false);
}
const parseFailRecorder = { calls: 0, inputs: [] as AiProviderInput[] };
const parseAfterSuccess = await runStudioPipeline({
  identity: identityInput,
  sourceText: "Authoritative notes for a studio draft package.",
  provider: scriptedProvider(
    [{ status: "success", text: '{"id":"id":"ku-water-cycle-definition"}' }],
    parseFailRecorder,
  ),
});
assert.equal(parseAfterSuccess.ok, false);
assert.equal(parseFailRecorder.calls, 1);
assert.equal(
  parseStudioPackage('{"disciplineId":"discipline/geography","sources":[{"reference":"', identity).ok,
  false,
);

const beforeIds = getReviewRecords().map((record) => record.content.topic.id).slice().sort();
const recorder = { calls: 0, inputs: [] as AiProviderInput[] };
const provider = scriptedProvider([{ status: "success", text: JSON.stringify(fixture) }], recorder);
const result = await runStudioPipeline({
  identity: identityInput,
  sourceText: "Authoritative notes for a studio draft package.",
  provider,
  evaluatedAt: "2026-09-16T00:00:00.000Z",
});
assert.equal(result.ok, true);
if (!result.ok) throw new Error("expected pipeline success");
assert.equal(result.record.workflowState, "draft");
assert.equal(result.record.content.topic.lifecycle, "draft");
assert.equal(result.record.reviews.length, 0);
assert.equal(result.record.publishedAt, undefined);
assert.ok(result.record.qualitySnapshot);
assert.equal(result.record.qualitySnapshot?.evaluatorVersion, "content-quality-gate/v1");
assert.equal(isProductionDeliveryEligible(result.record), false);
assert.equal(isProductionAiEligible(result.record), false);
assert.equal(result.preview.lifecycle.workflowState, "draft");
assert.equal(result.preview.lifecycle.deliverable, false);
assert.equal(result.preview.lifecycle.aiGroundable, false);
assert.equal(result.preview.lifecycle.publishable, false);
assert.equal(result.usage, undefined);
assert.equal(recorder.inputs[0]?.request.context.references.length, 0);
assert.equal(recorder.inputs[0]?.request.learnerContext, undefined);
assert.ok(recorder.inputs[0]?.instructions?.system);
assert.doesNotMatch(JSON.stringify(recorder.inputs[0]?.request.input.text), /Authoritative notes for a studio draft package/);
assert.equal(recorder.inputs[0]?.limits?.maxOutputTokens, STUDIO_MAX_OUTPUT_TOKENS);
assert.equal(recorder.inputs[0]?.limits?.timeoutMs, STUDIO_TIMEOUT_MS);
assert.throws(() => approveProduction(result.record));
assert.throws(() => publishProduction(result.record, "2026-09-16T00:00:00.000Z"));
const afterIds = getReviewRecords().map((record) => record.content.topic.id).slice().sort();
assert.deepEqual(afterIds, beforeIds);
assert.equal(afterIds.includes(identity.topicId), false);

const jsonExport = exportStudioDraftJson(result.record);
const exported = JSON.parse(jsonExport) as { workflowState?: string; content?: { topic?: { id?: string } } };
assert.equal(exported.workflowState, "draft");
assert.equal(exported.content?.topic?.id, identity.topicId);
const tsExport = exportStudioDraftTypeScript(result.record);
assert.match(tsExport, /PilotPackage/);
assert.match(tsExport, /topic\/studio\/sample-draft/);
assert.doesNotMatch(tsExport, /src\/lib\/content\/production\/batches/);

const store = memoryStore();
const saved = saveStudioDraft(
  { savedAt: "2026-09-16T00:00:00.000Z", identity, record: result.record },
  store,
);
assert.equal(saved.length, 1);
assert.equal(loadStudioDrafts(store)[0]?.identity.topicId, identity.topicId);
assert.ok(store.getItem(STUDIO_STORAGE_KEY));
assert.equal(store.getItem("sajib_atlas_learner_state"), null);

const retryRecorder = { calls: 0, inputs: [] as AiProviderInput[] };
const retryProvider = scriptedProvider(
  [
    { status: "failed", text: "The AI provider timed out." },
    { status: "success", text: JSON.stringify(fixture) },
  ],
  retryRecorder,
);
const retried = await runStudioPipeline({
  identity: identityInput,
  sourceText: "Retryable studio source.",
  provider: retryProvider,
});
assert.equal(retried.ok, false);
assert.equal(retryRecorder.calls, 1);

const failOnce = scriptedProvider([{ status: "failed", text: "The AI provider is unavailable." }], { calls: 0, inputs: [] });
const isolated = await runStudioBatch({
  items: [
    { id: "item-1", identity: identityInput, sourceText: "First isolated source." },
    { id: "item-2", identity: { ...identityInput, topicSlug: "second-draft", title: "Second Draft" }, sourceText: "Second isolated source." },
  ],
  provider: {
    async complete(input) {
      if (input.instructions?.user.includes("Second isolated source")) {
        return failOnce.complete(input);
      }
      return { status: "success", text: JSON.stringify(remapPackage(pilotPackages[2], resolveStudioIdentity(identityInput))) };
    },
  },
});
assert.equal(isolated.length, 2);
assert.equal(isolated[0].result.ok, true);
assert.equal(isolated[1].result.ok, false);
if (isolated[0].result.ok) {
  assert.equal(isolated[0].result.record.workflowState, "draft");
}
if (!isolated[1].result.ok) {
  assert.equal(isolated[1].result.error.code, "provider_failure");
}

assert.equal(runStudioPipeline.length, 1);

const longSource = `${"A".repeat(2100)} coastal process notes.`;
const longRecorder = { calls: 0, inputs: [] as AiProviderInput[] };
const longResult = await runStudioPipeline({
  identity: identityInput,
  sourceText: longSource,
  provider: scriptedProvider([{ status: "success", text: JSON.stringify(fixture) }], longRecorder),
});
assert.equal(longResult.ok, true);
assert.ok((longRecorder.inputs[0]?.instructions?.user.length ?? 0) > 2000);
assert.ok(longRecorder.inputs[0]?.request.input.text.length < 2000);

const emptySources = parseStudioPackage(JSON.stringify({ ...fixture, claims: [], sources: [], sourceReferences: [] }), identity);
assert.equal(emptySources.ok, true);
if (emptySources.ok) {
  assert.equal(emptySources.pkg.sources.length, 0);
  assert.equal(emptySources.pkg.claims.length, 0);
  assert.equal(emptySources.pkg.sourceReferences.length, 0);
}

assert.deepEqual(loadStudioDrafts(memoryStore({ [STUDIO_STORAGE_KEY]: "{not-json" })), []);

const alwaysFailRecorder = { calls: 0, inputs: [] as AiProviderInput[] };
const alwaysFail = await runStudioPipeline({
  identity: identityInput,
  sourceText: "Always failing source.",
  provider: scriptedProvider([{ status: "failed", text: "The AI provider timed out." }], alwaysFailRecorder),
});
assert.equal(alwaysFail.ok, false);
assert.equal(alwaysFailRecorder.calls, 1);

const sourceA = {
  id: "source/usgs-water-cycle",
  title: "Water cycle",
  publisherOrOrganization: "U.S. Geological Survey",
  reference: "https://www.usgs.gov/special-topics/water-science-school/science/fundamentals-water-cycle",
  type: "government" as const,
  excerpt: "The water cycle describes where water is on Earth and how it moves.",
};
const sourceB = {
  id: "source/noaa-atmosphere",
  title: "The Atmosphere",
  publisherOrOrganization: "National Oceanic and Atmospheric Administration",
  reference: "https://www.noaa.gov/jetstream/atmosphere",
  type: "government" as const,
  excerpt: "The atmosphere is a layer of gas and suspended solids extending from the Earth's surface.",
};
const sourceC = {
  id: "source/nasa-earth",
  title: "Earth facts",
  publisherOrOrganization: "NASA",
  reference: "https://science.nasa.gov/earth/facts/",
  type: "government" as const,
  excerpt: "Near the surface, Earth has an atmosphere that consists of 78% nitrogen and 21% oxygen.",
};
const richPacket = buildStudioSourcePacket({ sources: [sourceC, sourceA, sourceB] });
assert.equal(richPacket.sources.length, 3);
assert.deepEqual(
  richPacket.sources.map((item) => item.id),
  ["source/nasa-earth", "source/noaa-atmosphere", "source/usgs-water-cycle"],
);
assert.equal(isStudioSourcePacketThin(richPacket), false);
const thinPacket = buildStudioSourcePacket({ sources: [sourceA] });
assert.equal(thinPacket.sources.length, 1);
assert.equal(isStudioSourcePacketThin(thinPacket), true);
assert.throws(() => buildStudioSourcePacket({ sources: [sourceA, { ...sourceB, id: sourceA.id }] }));
assert.throws(() => buildStudioSourcePacket({ sources: [{ ...sourceA, title: "" }] }));
assert.throws(() => buildStudioSourcePacket({ sources: [{ ...sourceA, publisherOrOrganization: "" }] }));
assert.throws(() => buildStudioSourcePacket({ sources: [{ ...sourceA, reference: "" }] }));
assert.throws(() => buildStudioSourcePacket({ sources: [{ ...sourceA, excerpt: "" }] }));
assert.throws(() => buildStudioSourcePacket({ sources: [{ ...sourceA, reference: "n/a" }] }));
assert.throws(() => buildStudioSourcePacket({ sources: [{ ...sourceA, reference: "https://example.com/page" }] }));
const converted = sourcePacketToGenerationInput(richPacket, identity);
assert.match(converted.sourceText, /source\/usgs-water-cycle/);
assert.match(converted.sourceText, /source\/noaa-atmosphere/);
assert.match(converted.sourceText, /source\/nasa-earth/);
assert.equal(converted.sourceMetadata.length, 3);
assert.equal(isPacketVerifiedSource(richPacket, "source/usgs-water-cycle"), true);
assert.equal(isPacketVerifiedSource(richPacket, "source/ai-invented"), false);
assert.equal(isPacketVerifiedSource(richPacket, emptySources.ok ? emptySources.pkg.sources[0]?.id ?? "source/ai-invented" : "source/ai-invented"), false);
assert.match(prompt.system, /model memory/i);
const packetRecorder = { calls: 0, inputs: [] as AiProviderInput[] };
const packeted = await runStudioPipeline({
  identity: identityInput,
  sourcePacket: { sources: [sourceC, sourceA, sourceB] },
  provider: scriptedProvider([{ status: "success", text: JSON.stringify(fixture) }], packetRecorder),
  evaluatedAt: "2026-09-16T00:00:00.000Z",
});
assert.equal(packeted.ok, true);
assert.match(packetRecorder.inputs[0]?.instructions?.user ?? "", /source\/usgs-water-cycle/);
assert.match(packetRecorder.inputs[0]?.instructions?.user ?? "", /source\/noaa-atmosphere/);
assert.match(packetRecorder.inputs[0]?.instructions?.user ?? "", /source\/nasa-earth/);

const library = listStudioLibraryEntries(saved);
assert.equal(library.length, 1);
assert.equal(library[0]?.topicId, identity.topicId);
assert.equal(library[0]?.title, identity.title);
assert.equal(library[0]?.subjectId, identity.subjectId);
assert.equal(library[0]?.workflowState, "draft");
assert.ok(library[0]?.qualityStatus);
const restored = restoreStudioDraft(saved[0]);
assert.equal(restored.ok, true);
assert.equal(restored.identity.topicId, identity.topicId);
assert.equal(restored.record.workflowState, "draft");
assert.equal(restored.preview.lifecycle.publishable, false);
assert.equal(isProductionDeliveryEligible(restored.record), false);
assert.throws(() => approveProduction(restored.record));
assert.throws(() => publishProduction(restored.record, "2026-09-16T00:00:00.000Z"));

const studioDir = dirname(fileURLToPath(import.meta.url));
const studioSources = ["identity.ts", "prompt.ts", "generate.ts", "parse.ts", "pipeline.ts", "batch.ts", "export.ts", "persist.ts", "index.ts", "generate-action.ts", "library.ts", "source-packet.ts"]
  .map((name) => readFileSync(join(studioDir, name), "utf8"))
  .join("\n");
assert.equal(/maxAttempts/.test(readFileSync(join(studioDir, "pipeline.ts"), "utf8")), false);
assert.equal(/for \(let attempt/.test(readFileSync(join(studioDir, "pipeline.ts"), "utf8")), false);
const pageSource = readFileSync(join(studioDir, "../../app/content-studio/page.tsx"), "utf8");
assert.match(pageSource, /maxDuration = 150|STUDIO_ACTION_MAX_DURATION_SECONDS/);
assert.match(readFileSync(join(studioDir, "types.ts"), "utf8"), /STUDIO_ACTION_MAX_DURATION_SECONDS = 150/);
assert.equal(studioSources.includes("geography-data"), false);
assert.equal(studioSources.includes("production/batches"), false);
assert.equal(studioSources.includes("approveProduction"), false);
assert.equal(studioSources.includes("publishProduction"), false);
assert.equal(studioSources.includes("sajib_atlas_learner_state"), false);
assert.equal(/\btype StudioPackage\b/.test(studioSources), false);
assert.equal(/\bStudioKnowledgeUnit\b/.test(studioSources), false);
assert.match(studioSources, /PilotPackage/);
assert.match(studioSources, /PilotSource/);
assert.match(studioSources, /evaluateProductionQuality/);
assert.match(studioSources, /createProductionDraft/);

console.log("Content Production Studio verification passed.");
