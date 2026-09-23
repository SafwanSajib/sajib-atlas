"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { generateStudioDraftAction } from "@/lib/content-studio/generate-action";
import { slugFromTitle } from "@/lib/content-studio/identity";
import { restoreStudioDraft } from "@/lib/content-studio/library";
import { loadStudioDrafts, saveStudioDraft } from "@/lib/content-studio/persist";
import type { PilotSource } from "@/lib/content/pilot/index";
import type { StudioPersistedDraft, StudioPipelineResult, StudioSourceInput, StudioTopicIdentityInput } from "@/lib/content-studio/types";
import StudioBatch from "./StudioBatch";
import StudioBatchControl from "./StudioBatchControl";
import StudioExport from "./StudioExport";
import StudioLibrary from "./StudioLibrary";
import StudioPreview from "./StudioPreview";

type SourceRow = {
  id: string;
  title: string;
  publisherOrOrganization: string;
  reference: string;
  type: PilotSource["type"];
  excerpt: string;
};

type FormState = {
  subjectSlug: string;
  topicSlug: string;
  title: string;
  disciplineSlug: string;
  summary: string;
  sources: SourceRow[];
};

const emptySource = (): SourceRow => ({
  id: "",
  title: "",
  publisherOrOrganization: "",
  reference: "",
  type: "government",
  excerpt: "",
});

const initial: FormState = {
  subjectSlug: "",
  topicSlug: "",
  title: "",
  disciplineSlug: "",
  summary: "",
  sources: [emptySource(), emptySource(), emptySource()],
};

function packetFromForm(form: FormState): { sources: StudioSourceInput[] } | undefined {
  const filled = form.sources.filter((row) => row.title.trim() || row.reference.trim() || row.excerpt.trim() || row.id.trim());
  if (filled.length === 0) return undefined;
  return {
    sources: filled.map((row, index) => ({
      id: row.id.trim() || `source/item-${index + 1}`,
      title: row.title.trim(),
      publisherOrOrganization: row.publisherOrOrganization.trim(),
      reference: row.reference.trim(),
      type: row.type,
      excerpt: row.excerpt.trim(),
    })),
  };
}

function statusText(busy: boolean, result: StudioPipelineResult | null): string {
  if (busy) return "Status: Generating";
  if (!result) return "Status: Ready for topic and source";
  if (!result.ok) return `Status: Failed — ${result.error.code}`;
  const quality = result.record.qualitySnapshot?.report.overall ?? "not-evaluated";
  return `Status: DRAFT — NOT CANONICAL · quality ${quality}`;
}

export default function StudioForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [result, setResult] = useState<StudioPipelineResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState<readonly StudioPersistedDraft[]>([]);

  useEffect(() => {
    setLibrary(loadStudioDrafts());
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const derivedSlug = useMemo(() => {
    if (form.topicSlug.trim()) return form.topicSlug.trim().toLowerCase();
    if (!form.title.trim()) return "";
    try {
      return slugFromTitle(form.title);
    } catch {
      return "";
    }
  }, [form.topicSlug, form.title]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const identity: StudioTopicIdentityInput = {
        subjectSlug: form.subjectSlug,
        title: form.title,
        topicSlug: form.topicSlug || undefined,
        disciplineSlug: form.disciplineSlug || undefined,
        summary: form.summary || undefined,
      };
      const next = await generateStudioDraftAction({
        identity,
        sourcePacket: packetFromForm(form),
      });
      setResult(next);
      if (next.ok) {
        setLibrary(saveStudioDraft({
          savedAt: new Date().toISOString(),
          identity: next.identity,
          record: next.record,
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="eyebrow" role="status">{statusText(busy, result)}</p>
      <StudioLibrary
        drafts={library}
        onLoad={(draft) => {
          setResult(restoreStudioDraft(draft));
        }}
      />
      <form onSubmit={(event) => void onSubmit(event)}>
        <section className="studio-panel">
          <p className="eyebrow">1. Topic</p>
          <label htmlFor="studio-subject">Subject slug</label>
          <input id="studio-subject" name="subjectSlug" list="studio-subjects" autoComplete="off" required value={form.subjectSlug} onChange={(event) => update("subjectSlug", event.target.value)} />
          <datalist id="studio-subjects">
            <option value="geography" />
            <option value="english" />
            <option value="bcs" />
          </datalist>
          <label htmlFor="studio-title">Title</label>
          <input id="studio-title" name="title" autoComplete="off" required value={form.title} onChange={(event) => update("title", event.target.value)} />
          <label htmlFor="studio-topic">Topic slug (optional — derived from title if empty)</label>
          <input id="studio-topic" name="topicSlug" autoComplete="off" value={form.topicSlug} onChange={(event) => update("topicSlug", event.target.value)} />
          {derivedSlug ? <p>Canonical id: topic/{form.subjectSlug || "subject"}/{derivedSlug}</p> : null}
          <label htmlFor="studio-discipline">Discipline slug (optional)</label>
          <input id="studio-discipline" name="disciplineSlug" autoComplete="off" value={form.disciplineSlug} onChange={(event) => update("disciplineSlug", event.target.value)} />
          <label htmlFor="studio-summary">Summary (optional)</label>
          <input id="studio-summary" name="summary" autoComplete="off" value={form.summary} onChange={(event) => update("summary", event.target.value)} />
        </section>
        <section className="studio-panel">
          <p className="eyebrow">2. Source packet</p>
          <p>Author-supplied verified sources only. Count: {form.sources.filter((row) => row.title.trim() || row.excerpt.trim()).length}. Do not invent URLs or organizations. Automated web research is not implemented.</p>
          {form.sources.map((row, index) => (
            <fieldset key={index} className="studio-source-item">
              <legend>Source {index + 1}</legend>
              <label htmlFor={`studio-source-id-${index}`}>Source id</label>
              <input id={`studio-source-id-${index}`} value={row.id} placeholder="source/usgs-water-cycle" onChange={(event) => {
                const sources = form.sources.slice();
                sources[index] = { ...row, id: event.target.value };
                update("sources", sources);
              }} />
              <label htmlFor={`studio-source-title-${index}`}>Title</label>
              <input id={`studio-source-title-${index}`} value={row.title} onChange={(event) => {
                const sources = form.sources.slice();
                sources[index] = { ...row, title: event.target.value };
                update("sources", sources);
              }} />
              <label htmlFor={`studio-source-org-${index}`}>Organization</label>
              <input id={`studio-source-org-${index}`} value={row.publisherOrOrganization} onChange={(event) => {
                const sources = form.sources.slice();
                sources[index] = { ...row, publisherOrOrganization: event.target.value };
                update("sources", sources);
              }} />
              <label htmlFor={`studio-source-type-${index}`}>Category</label>
              <select id={`studio-source-type-${index}`} value={row.type} onChange={(event) => {
                const sources = form.sources.slice();
                sources[index] = { ...row, type: event.target.value as SourceRow["type"] };
                update("sources", sources);
              }}>
                <option value="government">government</option>
                <option value="international-organization">international-organization</option>
                <option value="university">university</option>
                <option value="academic-paper">academic-paper</option>
                <option value="textbook">textbook</option>
                <option value="reference-editorial">reference-editorial</option>
              </select>
              <label htmlFor={`studio-source-url-${index}`}>Verified locator / URL</label>
              <input id={`studio-source-url-${index}`} value={row.reference} placeholder="https://" onChange={(event) => {
                const sources = form.sources.slice();
                sources[index] = { ...row, reference: event.target.value };
                update("sources", sources);
              }} />
              <label htmlFor={`studio-source-excerpt-${index}`}>Excerpt / notes</label>
              <textarea id={`studio-source-excerpt-${index}`} rows={6} value={row.excerpt} onChange={(event) => {
                const sources = form.sources.slice();
                sources[index] = { ...row, excerpt: event.target.value };
                update("sources", sources);
              }} />
              {form.sources.length > 1 ? (
                <button type="button" className="button button-quiet" onClick={() => update("sources", form.sources.filter((_, itemIndex) => itemIndex !== index))}>
                  Remove source
                </button>
              ) : null}
            </fieldset>
          ))}
          <button type="button" className="button button-quiet" onClick={() => update("sources", [...form.sources, emptySource()])}>
            Add source
          </button>
        </section>
        <section className="studio-panel">
          <p className="eyebrow">3. Generate</p>
          <p>AI output is a draft. It is never canonical and never published from this workspace.</p>
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? "Generating draft…" : "Generate draft"}
          </button>
        </section>
      </form>
      <section className="studio-panel">
        <p className="eyebrow">4. Validate</p>
        {result?.ok ? (
          <p>
            Existing Quality Gate: {result.record.qualitySnapshot?.report.overall ?? "not-evaluated"}. Workflow stays{" "}
            {result.record.workflowState}. Publishable: no.
          </p>
        ) : result ? (
          <p role="alert">
            Validation did not run because generation failed: {result.error.code}. {result.error.message}
          </p>
        ) : (
          <p>Quality evaluation runs after a structured draft is parsed.</p>
        )}
      </section>
      {result?.ok ? (
        <>
          <StudioPreview result={result} />
          <StudioExport result={result} />
        </>
      ) : null}
      <StudioBatchControl />
      <StudioBatch />
    </>
  );
}
