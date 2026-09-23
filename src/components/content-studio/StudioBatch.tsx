"use client";

import { useState } from "react";
import { generateStudioBatchAction } from "@/lib/content-studio/generate-action";
import type { StudioBatchItemInput, StudioBatchItemResult } from "@/lib/content-studio/types";

type BatchForm = {
  subjectSlug: string;
  topicSlug: string;
  title: string;
  summary: string;
  sourceText: string;
};

const emptyItem: BatchForm = { subjectSlug: "", topicSlug: "", title: "", summary: "", sourceText: "" };

export default function StudioBatch() {
  const [draft, setDraft] = useState<BatchForm>(emptyItem);
  const [queue, setQueue] = useState<StudioBatchItemInput[]>([]);
  const [results, setResults] = useState<readonly StudioBatchItemResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof BatchForm>(key: K, value: BatchForm[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addItem() {
    if (!draft.subjectSlug.trim() || !draft.topicSlug.trim() || !draft.title.trim() || !draft.sourceText.trim()) {
      setMessage("Batch items need subject, topic slug, title, and source text.");
      return;
    }
    setQueue((current) => [
      ...current,
      {
        id: `batch-${current.length + 1}-${draft.topicSlug.trim()}`,
        identity: {
          subjectSlug: draft.subjectSlug,
          topicSlug: draft.topicSlug,
          title: draft.title,
          summary: draft.summary,
        },
        sourceText: draft.sourceText,
      },
    ]);
    setDraft(emptyItem);
    setMessage(null);
  }

  async function runQueue() {
    if (queue.length === 0) {
      setMessage("Add at least one batch item.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const next = await generateStudioBatchAction(queue);
      setResults(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="eyebrow">Batch · sequential · isolated failures · draft only</p>
      <h2>Batch drafts</h2>
      <p>Items run one after another. A failed item is isolated and does not publish anything.</p>
      <div className="studio-panel">
        <label htmlFor="batch-subject">Subject slug</label>
        <input id="batch-subject" value={draft.subjectSlug} onChange={(event) => update("subjectSlug", event.target.value)} />
        <label htmlFor="batch-topic">Topic slug</label>
        <input id="batch-topic" value={draft.topicSlug} onChange={(event) => update("topicSlug", event.target.value)} />
        <label htmlFor="batch-title">Title</label>
        <input id="batch-title" value={draft.title} onChange={(event) => update("title", event.target.value)} />
        <label htmlFor="batch-source">Source text</label>
        <textarea id="batch-source" rows={6} value={draft.sourceText} onChange={(event) => update("sourceText", event.target.value)} />
        {message ? <p role="status">{message}</p> : null}
        <div className="button-row">
          <button type="button" className="button button-quiet" onClick={addItem}>Add item</button>
          <button type="button" className="button button-primary" onClick={() => void runQueue()} disabled={busy}>
            {busy ? "Running batch…" : "Run batch"}
          </button>
        </div>
      </div>
      <ul className="study-list">
        {queue.map((item) => (
          <li key={item.id}>{item.identity.title} · topic/{item.identity.subjectSlug}/{item.identity.topicSlug} · queued</li>
        ))}
      </ul>
      {results.length > 0 ? (
        <ul className="study-list">
          {results.map((item) => (
            <li key={item.id}>
              {item.id}: {item.result.ok ? `DRAFT · quality ${item.result.record.qualitySnapshot?.report.overall ?? "unevaluated"}` : `FAILED · ${item.result.error.code}`}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
