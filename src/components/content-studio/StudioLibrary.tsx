"use client";

import { listStudioLibraryEntries } from "@/lib/content-studio/library";
import type { StudioPersistedDraft } from "@/lib/content-studio/types";

export default function StudioLibrary({
  drafts,
  onLoad,
}: {
  drafts: readonly StudioPersistedDraft[];
  onLoad: (draft: StudioPersistedDraft) => void;
}) {
  const entries = listStudioLibraryEntries(drafts);
  return (
    <section className="studio-panel">
      <p className="eyebrow">Draft library</p>
      <p>Saved locally on this device. Loaded content is DRAFT — NOT CANONICAL.</p>
      {entries.length === 0 ? (
        <p>No saved Studio drafts.</p>
      ) : (
        <ul className="study-list">
          {drafts.map((draft, index) => {
            const entry = entries[index];
            if (!entry) return null;
            return (
              <li key={`${entry.topicId}-${entry.savedAt}`}>
                <button type="button" className="button button-quiet" onClick={() => onLoad(draft)}>
                  Load {entry.title}
                </button>
                {" "}
                {entry.topicId} · {entry.subjectId} · v{entry.contentVersion} · {entry.workflowState} · quality {entry.qualityStatus} · {entry.savedAt}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
