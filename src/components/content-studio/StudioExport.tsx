"use client";

import { exportStudioDraftJson, exportStudioDraftTypeScript } from "@/lib/content-studio/export";
import type { StudioPipelineSuccess } from "@/lib/content-studio/types";

function download(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function StudioExport({ result }: { result: StudioPipelineSuccess }) {
  const slug = result.identity.topicSlug;
  return (
    <section className="studio-panel">
      <p className="eyebrow">6. Export</p>
      <p>Downloads a local draft file. This does not write production batches or publish content.</p>
      <div className="button-row">
        <button
          type="button"
          className="button button-primary"
          onClick={() => download(`${slug}.draft.json`, exportStudioDraftJson(result.record), "application/json")}
        >
          Download JSON
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => download(`${slug}.draft.ts`, exportStudioDraftTypeScript(result.record), "text/plain")}
        >
          Download TypeScript
        </button>
      </div>
    </section>
  );
}
