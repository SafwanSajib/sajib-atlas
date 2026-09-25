import type { EditorialDraftRecord } from "@/lib/content-studio/editorial/types";
import type { ProductionRecord } from "./types";
import { evaluateProductionQuality, submitProductionForReview } from "./workflow";

function fail(message: string): never {
  throw new Error(`Canonical content production: ${message}`);
}

function snapshotMatchesIdentity(record: ProductionRecord): boolean {
  const snapshot = record.qualitySnapshot;
  if (!snapshot) return false;
  return snapshot.contentId === record.content.topic.id
    && snapshot.contentVersion === record.content.topic.contentVersion
    && snapshot.report.contentId === snapshot.contentId
    && snapshot.report.contentVersion === snapshot.contentVersion;
}

export function submitReadyEditorialRecord(input: {
  editorial: EditorialDraftRecord;
  batchDraft: ProductionRecord;
  canonical: ProductionRecord;
}): ProductionRecord {
  if (input.editorial.editorialStatus !== "ready_for_approval") {
    fail("editorial record is not ready for canonical review");
  }
  if (JSON.stringify(input.editorial.production) !== JSON.stringify(input.batchDraft)) {
    throw new Error("Editorial workspace: persistence failure");
  }
  if (input.canonical.workflowState !== "draft") {
    fail(`invalid transition ${input.canonical.workflowState} -> review`);
  }
  const editorialVersion = input.editorial.production.content.topic.contentVersion;
  const batchVersion = input.batchDraft.content.topic.contentVersion;
  const canonicalVersion = input.canonical.content.topic.contentVersion;
  if (
    input.canonical.content.topic.id !== input.editorial.production.content.topic.id
    || editorialVersion !== batchVersion
    || editorialVersion !== canonicalVersion
  ) {
    fail("stale content version");
  }
  if (input.canonical.qualitySnapshot && !snapshotMatchesIdentity(input.canonical)) {
    fail("quality snapshot does not match content identity");
  }
  const evaluated = input.canonical.qualitySnapshot ? input.canonical : evaluateProductionQuality(input.canonical);
  if (evaluated.qualitySnapshot?.report.overall === "blocked") {
    fail("quality blockers prevent canonical submission");
  }
  return submitProductionForReview(evaluated);
}
