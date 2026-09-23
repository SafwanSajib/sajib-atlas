import type { EditorialWorkspaceView } from "@/lib/content-studio/editorial/types";

export default function EditorialHeader({ view }: { view: EditorialWorkspaceView }) {
  const topic = view.production.content.topic;
  const overall = view.qualitySnapshot?.report.overall ?? view.production.qualitySnapshot?.report.overall;
  return (
    <header className="section">
      <p className="eyebrow">Development-only · Editorial workspace</p>
      <h1>{view.topicTitle}</h1>
      <p>DRAFT — NOT CANONICAL</p>
      <p>A quality pass is not human approval. ready_for_approval is not publication.</p>
      <p>
        Subject {view.subjectId} · topic {topic.id} · content version {view.contentVersion} · lifecycle {topic.lifecycle}
        · generation state {view.generationState} · quality overall {overall ?? "not evaluated"} · editorial status {view.editorialStatus}
        · updated {view.updatedAt}
      </p>
      <p>Storage {view.batchId} · {view.itemId} · revision {view.revision}</p>
    </header>
  );
}
