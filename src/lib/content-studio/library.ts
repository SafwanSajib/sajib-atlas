import { buildReviewProjection } from "@/lib/content/review/index";
import type { StudioLibraryEntry, StudioPersistedDraft, StudioPipelineSuccess } from "./types";

export function listStudioLibraryEntries(drafts: readonly StudioPersistedDraft[]): readonly StudioLibraryEntry[] {
  return drafts.map((draft) => ({
    topicId: draft.identity.topicId,
    title: draft.identity.title,
    subjectId: draft.identity.subjectId,
    contentVersion: draft.record.content.topic.contentVersion,
    savedAt: draft.savedAt,
    workflowState: draft.record.workflowState,
    qualityStatus: draft.record.qualitySnapshot?.report.overall ?? "not-evaluated",
  }));
}

export function restoreStudioDraft(draft: StudioPersistedDraft): StudioPipelineSuccess {
  return {
    ok: true,
    identity: draft.identity,
    record: draft.record,
    preview: buildReviewProjection(draft.record),
    attempts: 1,
  };
}
