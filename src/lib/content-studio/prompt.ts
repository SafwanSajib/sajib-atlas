import type { AiProviderInstructions } from "@/lib/ai-intelligence/provider";
import type { StudioSourceInput, StudioSourceMetadata, StudioTopicIdentity } from "./types";

export function buildStudioPrompt(
  identity: StudioTopicIdentity,
  sourceText: string,
  sourceMetadata: readonly (StudioSourceMetadata | StudioSourceInput)[] = [],
): AiProviderInstructions {
  const system = [
    "You are a structured content drafter for Sajib Atlas.",
    "Return exactly ONE JSON object.",
    "Return JSON only. No Markdown. No code fence. No commentary before or after JSON.",
    "No duplicate keys. Every property name must occur exactly once in each object.",
    "Do not emit placeholders. Do not emit JavaScript or TypeScript object syntax.",
    "Use valid JSON double quotes. Do not include trailing commas.",
    "The output must conform to the exact PilotPackage structure. Do not invent unsupported schema fields.",
    "Required top-level keys: disciplineId, subjectId, topic, concepts, objectives, knowledgeUnits, claims, sources, sourceReferences, assessmentAlignments.",
    "KnowledgeUnits use blocks (not contentBlocks). ContentBlocks use type, order, and payload (not text).",
    "KnowledgeUnit ids must be versionless unit/{subject}/{slug}. contentVersion carries version information. Do not put @v1 inside KnowledgeUnit ids, topic.knowledgeUnitIds, or concept.knowledgeUnitIds.",
    "Each KnowledgeUnit should include sourceReferenceIds using only source-reference IDs supplied by the Source Packet (ref/... identifiers from the packet).",
    "Blocks that rely on claims must include claimIds. Blocks may include sourceReferenceIds when direct source linkage is appropriate.",
    "Every claim used by a block must appear in that block's claimIds. Never invent a sourceReference ID. Do not fabricate provenance merely to satisfy validation.",
    "Objectives use verb and statement. Claims use statement, kind, interpretationStatus, supportStatus, and sourceReferenceIds.",
    "Sources use type, title, publisherOrOrganization, reference, and language. Allowed source types: government, international-organization, university, academic-paper, textbook, reference-editorial.",
    "Allowed ContentBlock types: definition, explanation, mechanism-process, chronology, comparison, cause-effect, example, case-study, formula-rule, exception, misconception, procedure-derivation.",
    "Use only the supplied source packet for source-backed claims.",
    "Do not invent citations. Do not invent URLs. Do not add unsupported organizations.",
    "Do not treat model memory as a source. Do not promote generated sources to verified provenance.",
    "Never invent sources or citations. Do not fabricate evidence, URLs, publishers, or locators.",
    "Preserve source-backed claims. Distinguish supported fact from interpretation and synthesis.",
    "Include provenance only from the supplied source packet. Copy supplied source ids, titles, organizations, and locators exactly.",
    "Satisfy the existing structural requirements where the source supports them: 3-5 concepts, 4-8 KnowledgeUnits, at least 3 sources when evidence exists, and at least one assessment alignment reference.",
    "This output is a DRAFT only. It is not canonical content, must not be treated as published, must not publish itself, and must never become canonical by generation alone.",
    "Do not include answer keys, scores, learner state, HTML, CSS, pageSection, sidebar, accordion, examNote, or quickRevision fields.",
  ].join(" ");

  const metadataLines = sourceMetadata
    .filter((item) => item.title.trim())
    .map((item, index) => {
      const parts = [`${index + 1}. title: ${item.title.trim()}`];
      if ("id" in item && item.id) parts.push(`id: ${item.id}`);
      if (item.type) parts.push(`type: ${item.type}`);
      if (item.publisherOrOrganization) parts.push(`publisher: ${item.publisherOrOrganization}`);
      if (item.reference) parts.push(`reference: ${item.reference}`);
      if (item.citation) parts.push(`citation: ${item.citation}`);
      return parts.join("; ");
    });

  const user = [
    "TOPIC IDENTITY (authoritative):",
    `topicId: ${identity.topicId}`,
    `subjectId: ${identity.subjectId}`,
    `disciplineId: ${identity.disciplineId}`,
    `title: ${identity.title}`,
    `summary: ${identity.summary}`,
    metadataLines.length > 0
      ? ["AUTHOR-SUPPLIED SOURCE METADATA (use these; do not invent additional sources):", ...metadataLines].join("\n")
      : "No author-supplied source metadata was provided. Do not invent sources.",
    "Produce a PilotPackage JSON object with knowledgeUnits, ContentBlocks, claims, sources, and sourceReferences grounded only in the source text.",
    "JSON skeleton (fill arrays; keep these property names exactly):",
    '{"disciplineId":"discipline/slug","subjectId":"subject/slug","topic":{"id":"topic/slug/slug","disciplineId":"discipline/slug","subjectId":"subject/slug","title":"...","summary":"...","contentVersion":1,"lifecycle":"draft","conceptIds":["concept/..."],"knowledgeUnitIds":["unit/subject/slug"],"objectiveIds":["objective/..."],"assessmentAlignmentIds":["alignment/..."],"audience":"...","level":"foundational","provenanceStatus":"source-backed"},"concepts":[{"id":"concept/...","title":"...","aliases":[],"knowledgeUnitIds":["unit/subject/slug"]}],"objectives":[{"id":"objective/...","verb":"explain","statement":"...","level":"foundational"}],"knowledgeUnits":[{"id":"unit/subject/slug","title":"...","conceptIds":["concept/..."],"objectiveIds":["objective/..."],"sourceReferenceIds":["ref/..."],"claimIds":["claim/..."],"blocks":[{"id":"block/...","type":"definition","order":1,"payload":{"text":"..."},"claimIds":["claim/..."],"sourceReferenceIds":["ref/..."]}],"contentVersion":1,"lifecycle":"draft","audience":"...","level":"foundational"}],"claims":[{"id":"claim/...","statement":"...","kind":"factual","interpretationStatus":"fact","supportStatus":"synthesized","sourceReferenceIds":["ref/..."]}],"sources":[{"id":"source/...","type":"reference-editorial","title":"...","publisherOrOrganization":"...","reference":"...","language":"en"}],"sourceReferences":[{"id":"ref/...","sourceId":"source/...","supportType":"direct","citation":"..."}],"assessmentAlignments":[{"id":"alignment/...","objectiveIds":["objective/..."],"conceptIds":["concept/..."],"knowledgeUnitIds":["unit/subject/slug"],"assessmentSetId":"pilot/slug/slug","contentVersion":1}]}',
    "SOURCE TEXT:",
    sourceText,
  ].join("\n");

  return { system, user };
}
