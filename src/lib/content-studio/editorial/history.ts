import type { PilotPackage } from "@/lib/content/pilot/types";
import type { ProductionRecord } from "@/lib/content/production/types";
import { redactSecrets } from "../batch-engine/sanitize";
import type { EditorialChange, EditorialNote, EditorialStatus } from "./types";

function encoded(value: unknown): string {
  const json = JSON.stringify(value);
  return redactSecrets(json === undefined ? "undefined" : json);
}

function collect(content: PilotPackage): Map<string, unknown> {
  const paths = new Map<string, unknown>();
  const topic = content.topic;
  paths.set("topic.title", topic.title);
  paths.set("topic.summary", topic.summary);
  paths.set("topic.audience", topic.audience);
  paths.set("topic.level", topic.level);
  paths.set("topic.provenanceStatus", topic.provenanceStatus);
  paths.set("topic.categoryId", topic.categoryId);
  for (const concept of content.concepts) {
    paths.set(`concepts/${concept.id}/title`, concept.title);
    paths.set(`concepts/${concept.id}/aliases`, concept.aliases);
    paths.set(`concepts/${concept.id}/knowledgeUnitIds`, concept.knowledgeUnitIds);
  }
  for (const objective of content.objectives) {
    paths.set(`objectives/${objective.id}/verb`, objective.verb);
    paths.set(`objectives/${objective.id}/statement`, objective.statement);
    paths.set(`objectives/${objective.id}/level`, objective.level);
  }
  for (const unit of content.knowledgeUnits) {
    const prefix = `knowledgeUnits/${unit.id}`;
    paths.set(`${prefix}/title`, unit.title);
    paths.set(`${prefix}/summary`, unit.summary);
    paths.set(`${prefix}/audience`, unit.audience);
    paths.set(`${prefix}/level`, unit.level);
    paths.set(`${prefix}/scope`, unit.scope);
    paths.set(`${prefix}/validity`, unit.validity);
    paths.set(`${prefix}/extension`, unit.extension);
    paths.set(`${prefix}/conceptIds`, unit.conceptIds);
    paths.set(`${prefix}/objectiveIds`, unit.objectiveIds);
    paths.set(`${prefix}/claimIds`, unit.claimIds);
    paths.set(`${prefix}/sourceReferenceIds`, unit.sourceReferenceIds);
    for (const block of unit.blocks) {
      const blockPrefix = `${prefix}/blocks/${block.id}`;
      paths.set(`${blockPrefix}/type`, block.type);
      paths.set(`${blockPrefix}/order`, block.order);
      paths.set(`${blockPrefix}/payload`, block.payload);
      paths.set(`${blockPrefix}/interpretationStatus`, block.interpretationStatus);
      paths.set(`${blockPrefix}/claimIds`, block.claimIds);
      paths.set(`${blockPrefix}/sourceReferenceIds`, block.sourceReferenceIds);
    }
  }
  for (const claim of content.claims) {
    const prefix = `claims/${claim.id}`;
    paths.set(`${prefix}/statement`, claim.statement);
    paths.set(`${prefix}/kind`, claim.kind);
    paths.set(`${prefix}/interpretationStatus`, claim.interpretationStatus);
    paths.set(`${prefix}/supportStatus`, claim.supportStatus);
    paths.set(`${prefix}/sourceReferenceIds`, claim.sourceReferenceIds);
    paths.set(`${prefix}/scope`, claim.scope);
    paths.set(`${prefix}/validity`, claim.validity);
    paths.set(`${prefix}/conflictGroupId`, claim.conflictGroupId);
  }
  for (const source of content.sources) {
    const prefix = `sources/${source.id}`;
    paths.set(`${prefix}/type`, source.type);
    paths.set(`${prefix}/title`, source.title);
    paths.set(`${prefix}/publisherOrOrganization`, source.publisherOrOrganization);
    paths.set(`${prefix}/reference`, source.reference);
    paths.set(`${prefix}/language`, source.language);
    paths.set(`${prefix}/publicationDate`, source.publicationDate);
    paths.set(`${prefix}/accessedDate`, source.accessedDate);
    paths.set(`${prefix}/scope`, source.scope);
  }
  for (const reference of content.sourceReferences) {
    const prefix = `sourceReferences/${reference.id}`;
    paths.set(`${prefix}/sourceId`, reference.sourceId);
    paths.set(`${prefix}/supportType`, reference.supportType);
    paths.set(`${prefix}/citation`, reference.citation);
    paths.set(`${prefix}/locator`, reference.locator);
    paths.set(`${prefix}/quote`, reference.quote);
  }
  return paths;
}

export function appendHistory(input: {
  previous: ProductionRecord;
  next: ProductionRecord;
  previousStatus: EditorialStatus;
  nextStatus: EditorialStatus;
  revision: number;
  at: string;
  notes: readonly EditorialNote[];
  reason?: string;
  actorLabel?: string;
}): EditorialChange[] {
  const before = collect(input.previous.content);
  const after = collect(input.next.content);
  const names = [...new Set([...before.keys(), ...after.keys()])].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const rows: EditorialChange[] = [];
  const actor = input.actorLabel ? { actorLabel: input.actorLabel } : {};
  for (const path of names) {
    const previousJson = JSON.stringify(before.get(path));
    const nextJson = JSON.stringify(after.get(path));
    if (previousJson === nextJson) continue;
    rows.push({
      revision: input.revision,
      at: input.at,
      path,
      previousValue: encoded(before.get(path)),
      newValue: encoded(after.get(path)),
      ...actor,
    });
  }
  for (const note of input.notes) {
    rows.push({
      revision: input.revision,
      at: input.at,
      path: `notes/${note.noteId}`,
      previousValue: encoded(null),
      newValue: encoded(note),
      ...actor,
    });
  }
  if (input.previousStatus !== input.nextStatus) {
    rows.push({
      revision: input.revision,
      at: input.at,
      path: "editorialStatus",
      previousValue: encoded(input.previousStatus),
      newValue: encoded(input.nextStatus),
      ...(input.reason !== undefined ? { reason: redactSecrets(input.reason) } : {}),
      ...actor,
    });
  }
  return rows;
}
