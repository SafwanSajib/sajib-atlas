import ReviewAudit from "@/components/content-review/ReviewAudit";
import ReviewContent from "@/components/content-review/ReviewContent";
import type { StudioPipelineSuccess } from "@/lib/content-studio/types";

export default function StudioPreview({ result }: { result: StudioPipelineSuccess }) {
  const quality = result.record.qualitySnapshot?.report.overall ?? "not-evaluated";
  const issues = result.record.qualitySnapshot?.report.dimensions.flatMap((dimension) =>
    dimension.issues.map((issue) => `${dimension.dimension}: ${issue.severity} · ${issue.message}`),
  ) ?? [];
  return (
    <section>
      <p className="eyebrow">5. Preview</p>
      <h2>DRAFT — NOT CANONICAL</h2>
      <p>
        <strong>Topic:</strong> {result.identity.topicId} · <strong>Version:</strong> {result.record.content.topic.contentVersion} ·{" "}
        <strong>Workflow:</strong> {result.record.workflowState} · <strong>Quality:</strong> {quality} ·{" "}
        <strong>Attempts:</strong> {result.attempts}
      </p>
      <p>Generation is not publication. This draft is not deliverable and is not registered in canonical content review.</p>
      {issues.length > 0 ? (
        <ul className="study-list">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : (
        <p>Quality gate reported no issues on the publication-candidate evaluation.</p>
      )}
      <ReviewAudit projection={result.preview} />
      <ReviewContent projection={result.preview} />
    </section>
  );
}
