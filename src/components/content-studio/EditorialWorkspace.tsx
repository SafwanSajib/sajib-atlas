"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditorialContentEditor from "@/components/content-studio/EditorialContentEditor";
import EditorialHeader from "@/components/content-studio/EditorialHeader";
import EditorialHistoryPanel from "@/components/content-studio/EditorialHistoryPanel";
import EditorialNotesPanel from "@/components/content-studio/EditorialNotesPanel";
import EditorialProvenancePanel from "@/components/content-studio/EditorialProvenancePanel";
import EditorialQualityPanel from "@/components/content-studio/EditorialQualityPanel";
import {
  markReadyForApprovalAction,
  markReadyForReviewAction,
  replayEditorialWriteThroughAction,
  requestChangesAction,
  returnToEditingAction,
  saveEditorialDraftAction,
  validateEditorialDraftAction,
} from "@/lib/content-studio/editorial/actions";
import type { EditorialPatch } from "@/lib/content-studio/editorial/edit";
import type { EditorialWorkspaceView } from "@/lib/content-studio/editorial/types";
import type { ContentQualityReport } from "@/lib/content-quality/types";

export default function EditorialWorkspace({
  view,
  batchNumber,
  itemParam,
}: {
  view: EditorialWorkspaceView;
  batchNumber: string;
  itemParam: string;
}) {
  const router = useRouter();
  const [contentPatch, setContentPatch] = useState<EditorialPatch>({});
  const [provenancePatch, setProvenancePatch] = useState<EditorialPatch>({});
  const [noteBody, setNoteBody] = useState("");
  const [actorLabel, setActorLabel] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ContentQualityReport | undefined>(view.qualitySnapshot?.report);
  const patch = { ...contentPatch, ...provenancePatch };

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Editorial workspace: persistence failure");
    } finally {
      setBusy(false);
    }
  }

  const identity = { batchNumber, itemParam, expectedRevision: view.expectedRevision, actorLabel: actorLabel.trim() || undefined };

  return (
    <section className="section">
      <EditorialHeader view={view} />
      <p>Inbox lanes: {view.lanes.join(", ") || "none"} · canonical false · publishable false</p>
      {message ? <p role="alert">{message}</p> : null}
      <Field label="Actor label">
        <input value={actorLabel} onChange={(event) => setActorLabel(event.target.value)} maxLength={80} />
      </Field>
      <EditorialContentEditor production={view.production} onPatch={setContentPatch} />
      <EditorialProvenancePanel production={view.production} onPatch={setProvenancePatch} />
      <EditorialQualityPanel
        view={view}
        report={report}
        busy={busy}
        onValidate={() => void run(async () => {
          const next = await validateEditorialDraftAction({ batchNumber, itemParam, patch });
          setReport(next);
        })}
      />
      <EditorialNotesPanel noteBody={noteBody} onNoteBody={setNoteBody} notes={view.notes} />
      <EditorialHistoryPanel changes={view.changes} />
      <div className="button-row">
        <button type="button" className="button button-primary" disabled={busy} onClick={() => void run(() => saveEditorialDraftAction({
          ...identity,
          patch,
          noteBody: noteBody.trim() || undefined,
        }))}>Save Draft</button>
        <button type="button" className="button button-quiet" disabled={busy} onClick={() => void run(() => markReadyForReviewAction(identity))}>Mark Ready for Review</button>
        <button type="button" className="button button-quiet" disabled={busy} onClick={() => void run(() => requestChangesAction({ ...identity, reason: reason.trim() || undefined, noteBody: noteBody.trim() || undefined }))}>Request Changes</button>
        <button type="button" className="button button-quiet" disabled={busy} onClick={() => void run(() => returnToEditingAction({ ...identity, reason: reason.trim() || undefined }))}>Return to Editing</button>
        <button type="button" className="button button-quiet" disabled={busy} onClick={() => void run(() => markReadyForApprovalAction(identity))}>Mark Ready for Approval</button>
        <button type="button" className="button button-quiet" disabled={busy} onClick={() => void run(() => replayEditorialWriteThroughAction({ batchNumber, itemParam }))}>Replay write-through</button>
      </div>
      <Field label="Reason">
        <input value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>
      <p>Not available. Approval and publication are not part of this workspace.</p>
      <button type="button" disabled aria-disabled="true">Approve</button>
      <button type="button" disabled aria-disabled="true">Publish</button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label>{label}{children}</label>;
}
