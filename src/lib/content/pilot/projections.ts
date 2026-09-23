import type { PilotAiGroundingProjection, PilotPackage, PilotSearchProjection } from "./types";

const text = (value: string | readonly string[]): string =>
  typeof value === "string" ? value : value.join(" ");

export function projectPilotToSearch(pkg: PilotPackage): PilotSearchProjection[] {
  const topic = pkg.topic;
  const projections: PilotSearchProjection[] = [{
    id: topic.id,
    kind: "topic",
    title: topic.title,
    canonicalId: topic.id,
    topicId: topic.id,
    subjectId: topic.subjectId,
    contentVersion: topic.contentVersion,
    lifecycle: topic.lifecycle,
    keywords: [topic.title, topic.subjectId],
    searchText: `${topic.title} ${topic.summary}`,
  }];
  for (const concept of pkg.concepts) {
    projections.push({
      id: concept.id,
      kind: "concept",
      title: concept.title,
      canonicalId: concept.id,
      topicId: topic.id,
      subjectId: topic.subjectId,
      contentVersion: topic.contentVersion,
      lifecycle: topic.lifecycle,
      keywords: [concept.title, ...concept.aliases],
      searchText: [concept.title, ...concept.aliases].join(" "),
    });
  }
  for (const knowledgeUnit of pkg.knowledgeUnits) {
    const blockText = knowledgeUnit.blocks
      .flatMap((contentBlock) => Object.values(contentBlock.payload).map(text))
      .join(" ");
    projections.push({
      id: knowledgeUnit.id,
      kind: "knowledge_unit",
      title: knowledgeUnit.title,
      canonicalId: knowledgeUnit.id,
      topicId: topic.id,
      subjectId: topic.subjectId,
      contentVersion: knowledgeUnit.contentVersion,
      lifecycle: knowledgeUnit.lifecycle,
      keywords: [knowledgeUnit.title, ...knowledgeUnit.conceptIds],
      searchText: `${knowledgeUnit.title} ${knowledgeUnit.summary ?? ""} ${blockText}`.trim(),
    });
  }
  return projections.sort((left, right) => left.id.localeCompare(right.id));
}

export function projectPilotToAiGrounding(pkg: PilotPackage): PilotAiGroundingProjection[] {
  const rows: PilotAiGroundingProjection[] = [];
  for (const knowledgeUnit of pkg.knowledgeUnits) {
    if (knowledgeUnit.lifecycle !== "published") continue;
    const conceptId = knowledgeUnit.conceptIds[0];
    if (!conceptId) continue;
    for (const contentBlock of knowledgeUnit.blocks) {
      const claimIds = contentBlock.claimIds ?? knowledgeUnit.claimIds ?? [];
      const eligible = claimIds.every((claimId) => {
        const claim = pkg.claims.find((item) => item.id === claimId);
        return claim && claim.supportStatus !== "disputed" && claim.supportStatus !== "synthesized";
      });
      if (!eligible) continue;
      rows.push({
        sourceId: `${knowledgeUnit.id}/${contentBlock.id}`,
        title: knowledgeUnit.title,
        subjectId: pkg.topic.subjectId,
        topicId: pkg.topic.id,
        conceptId,
        knowledgeUnitId: knowledgeUnit.id,
        blockType: contentBlock.type,
        contentVersion: knowledgeUnit.contentVersion,
        lifecycle: "published",
        interpretationStatus: contentBlock.interpretationStatus ?? "fact",
        sourceReferenceIds: [...(contentBlock.sourceReferenceIds ?? knowledgeUnit.sourceReferenceIds ?? [])],
        audience: knowledgeUnit.audience,
      });
    }
  }
  return rows.sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

export function projectPilotToLearnerReferences(pkg: PilotPackage): readonly string[] {
  return [...pkg.knowledgeUnits]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((item) => `${item.id}@v${item.contentVersion}`);
}
