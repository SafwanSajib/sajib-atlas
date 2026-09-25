"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createControlledBatchAction,
  handoffControlledItemAction,
  listControlledBatchesAction,
  pauseControlledBatchAction,
  recoverFailedBatchItemAction,
  replaceControlledItemSourceAction,
  resumeControlledBatchAction,
  startControlledBatchAction,
  tickControlledBatchAction,
} from "@/lib/content-studio/batch-control/actions";
import type { BatchControlSnapshot } from "@/lib/content-studio/batch-control/types";
import type { BatchTopicDefinition } from "@/lib/content-studio/batch-engine/types";

type DraftItem = {
  subjectSlug: string;
  topicSlug: string;
  title: string;
  summary: string;
  sourceText: string;
};

const emptyItem: DraftItem = { subjectSlug: "", topicSlug: "", title: "", summary: "", sourceText: "" };

function editorialHref(item: { itemId: string; state: string; hasDraft: boolean }): string | null {
  if (!item.hasDraft || (item.state !== "succeeded" && item.state !== "quality_blocked")) return null;
  const match = /^studio-batch\/([0-9]{3,4})\/item\/([0-9]{3})\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(item.itemId);
  if (!match) return null;
  return `/content-studio/editor/${match[1]}/${match[2]}--${match[3]}`;
}

export default function StudioBatchControl() {
  const [batchNumber, setBatchNumber] = useState(1);
  const [draft, setDraft] = useState<DraftItem>(emptyItem);
  const [pendingItems, setPendingItems] = useState<DraftItem[]>([]);
  const [batches, setBatches] = useState<readonly BatchControlSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewerId, setReviewerId] = useState("editor/local");
  const [replacement, setReplacement] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = batches.find((batch) => batch.batchId === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    void listControlledBatchesAction()
      .then((next) => {
        if (cancelled) return;
        setBatches(next);
        setSelectedId((current) => current ?? next[0]?.batchId ?? null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load persistent batches.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh(preferId?: string) {
    const next = await listControlledBatchesAction();
    setBatches(next);
    setSelectedId((current) => preferId ?? current ?? next[0]?.batchId ?? null);
  }

  async function run(action: () => Promise<BatchControlSnapshot | void>) {
    setBusy(true);
    setMessage(null);
    try {
      const snapshot = await action();
      await refresh(snapshot?.batchId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch control action failed.");
    } finally {
      setBusy(false);
    }
  }

  function update<K extends keyof DraftItem>(key: K, value: DraftItem[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addItem() {
    if (!draft.subjectSlug.trim() || !draft.topicSlug.trim() || !draft.title.trim() || !draft.sourceText.trim()) {
      setMessage("Each persistent item needs a subject, topic slug, title, and source text.");
      return;
    }
    setPendingItems((current) => [...current, draft]);
    setDraft(emptyItem);
    setMessage(null);
  }

  return (
    <section className="studio-panel" aria-labelledby="persistent-batch-heading">
      <p className="eyebrow">Persistent batch engine · operator-triggered · one item per action</p>
      <h2 id="persistent-batch-heading">Batch control</h2>
      <p>
        This is separate from the synchronous Studio batch below. Create persists every item before any generation.
        Start only queues the batch. Process next item runs exactly one topic through the existing Studio pipeline and then stops.
        Leaving this page stops further work. Nothing is approved or published, and nothing is inserted into canonical content review.
      </p>
      <label htmlFor="control-batch-number">Batch number</label>
      <input
        id="control-batch-number"
        type="number"
        min={1}
        value={batchNumber}
        onChange={(event) => setBatchNumber(Number(event.target.value))}
      />
      <label htmlFor="control-subject">Subject slug</label>
      <input id="control-subject" value={draft.subjectSlug} onChange={(event) => update("subjectSlug", event.target.value)} />
      <label htmlFor="control-topic">Topic slug</label>
      <input id="control-topic" value={draft.topicSlug} onChange={(event) => update("topicSlug", event.target.value)} />
      <label htmlFor="control-title">Title</label>
      <input id="control-title" value={draft.title} onChange={(event) => update("title", event.target.value)} />
      <label htmlFor="control-summary">Summary</label>
      <input id="control-summary" value={draft.summary} onChange={(event) => update("summary", event.target.value)} />
      <label htmlFor="control-source">Source text</label>
      <textarea id="control-source" rows={5} value={draft.sourceText} onChange={(event) => update("sourceText", event.target.value)} />
      {message ? <p role="status">{message}</p> : null}
      <div className="button-row">
        <button type="button" className="button button-quiet" onClick={addItem} disabled={busy}>Add topic</button>
        <button
          type="button"
          className="button button-primary"
          disabled={busy || pendingItems.length === 0}
          onClick={() => void run(async () => {
            const topics: BatchTopicDefinition[] = pendingItems.map((item) => ({
              identity: {
                subjectSlug: item.subjectSlug,
                topicSlug: item.topicSlug,
                title: item.title,
                summary: item.summary,
              },
              sourceText: item.sourceText,
            }));
            const snapshot = await createControlledBatchAction({ batchNumber, topics });
            setPendingItems([]);
            return snapshot;
          })}
        >
          Create persistent batch
        </button>
      </div>
      <ul className="study-list">
        {pendingItems.map((item) => (
          <li key={`${item.topicSlug}-${item.title}`}>{item.title} · not persisted yet</li>
        ))}
      </ul>
      <h3>Saved batches</h3>
      {batches.length === 0 ? <p>No persistent batches yet.</p> : (
        <ul className="study-list">
          {batches.map((batch) => (
            <li key={batch.batchId}>
              <button type="button" className="button button-quiet" onClick={() => setSelectedId(batch.batchId)}>
                Batch {batch.batchNumber} · {batch.state} · {batch.itemCount} items
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="button-row">
        <button type="button" className="button button-primary" disabled={busy || selected?.state !== "draft"} onClick={() => selected && void run(() => startControlledBatchAction(selected.batchId))}>
          Start batch
        </button>
        <button type="button" className="button button-primary" disabled={busy || (selected?.state !== "queued" && selected?.state !== "running")} onClick={() => selected && void run(() => tickControlledBatchAction(selected.batchId))}>
          Process next item
        </button>
        <button type="button" className="button button-quiet" disabled={busy || (selected?.state !== "queued" && selected?.state !== "running")} onClick={() => selected && void run(() => pauseControlledBatchAction(selected.batchId))}>
          Pause batch
        </button>
        <button type="button" className="button button-quiet" disabled={busy || selected?.state !== "paused"} onClick={() => selected && void run(() => resumeControlledBatchAction(selected.batchId))}>
          Resume batch
        </button>
      </div>
      {selected ? (
        <div>
          <p>
            <strong>Batch {selected.batchNumber}</strong> · status {selected.state} · {selected.itemCount} items · operator-triggered
          </p>
          <h3>Items</h3>
          <ul className="study-list">
            {selected.items.filter((item) => item.state === "failed").map((item) => (
              <li key={`recover-${item.itemId}`}>
                <button
                  type="button"
                  className="button button-quiet"
                  disabled={busy}
                  onClick={() => void run(() => recoverFailedBatchItemAction({ batchId: selected.batchId, itemId: item.itemId }))}
                >
                  Recover failed item
                </button>
                <span> {item.title}. Requeues this failed item only. Process next item runs it once. Succeeded items are not regenerated.</span>
              </li>
            ))}
          </ul>
          <ul className="study-list">
            {selected.items.map((item) => (
              <li key={item.itemId}>
                {item.ordinal}. {item.title} · {item.state}
                {item.topicId} · executions {item.executions}
                {item.qualityOverall ? ` · quality ${item.qualityOverall}` : ""}
                {editorialHref(item) ? <Link href={editorialHref(item) ?? ""}> Open editorial workspace</Link> : null}
                {item.safeError ? (
                  <span>
                    {" "}· provider {item.safeError.provider ?? "n/a"} · attempts {item.safeError.attempts ?? "n/a"} · retry {item.safeError.retryOccurred ? "yes" : "no"} · HTTP {item.safeError.httpStatus ?? "n/a"} · outcome {item.safeError.outcome ?? "n/a"}
                    {item.safeError.finishReason ? ` · finish ${item.safeError.finishReason}` : ""} · {item.safeError.pipelineFailureCategory ?? "no pipeline category"}
                    {item.safeError.safeMessage ? ` · ${item.safeError.safeMessage}` : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <h3>Production inbox</h3>
          <p>Draft queue only. This is not canonical content review.</p>
          {selected.inbox.length === 0 ? <p>No inbox entries yet.</p> : (
            <ul className="study-list">
              {selected.inbox.map((entry) => (
                <li key={`${entry.itemId}-${entry.lane}`}>{entry.title} · {entry.lane}{entry.handoffRecorded ? " · handoff recorded" : ""}</li>
              ))}
            </ul>
          )}
          <label htmlFor="control-reviewer">Editorial reviewer id</label>
          <input id="control-reviewer" value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} />
          <ul className="study-list">
            {selected.inbox.filter((entry) => entry.lane === "ready_for_editorial_review").map((entry) => (
              <li key={`handoff-${entry.itemId}`}>
                <button
                  type="button"
                  className="button button-quiet"
                  disabled={busy}
                  onClick={() => void run(() => handoffControlledItemAction({ batchId: selected.batchId, itemId: entry.itemId, reviewerId }))}
                >
                  Record editorial handoff for {entry.title}
                </button>
              </li>
            ))}
          </ul>
          <label htmlFor="control-replacement">Replacement source for a source-insufficient item</label>
          <textarea id="control-replacement" rows={4} value={replacement} onChange={(event) => setReplacement(event.target.value)} />
          <ul className="study-list">
            {selected.items.filter((item) => item.state === "source_insufficient").map((item) => (
              <li key={`source-${item.itemId}`}>
                <button
                  type="button"
                  className="button button-quiet"
                  disabled={busy || !replacement.trim()}
                  onClick={() => void run(async () => {
                    const snapshot = await replaceControlledItemSourceAction({
                      batchId: selected.batchId,
                      itemId: item.itemId,
                      sourceText: replacement,
                    });
                    setReplacement("");
                    return snapshot;
                  })}
                >
                  Replace source for {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
