import type { ContentQualityReport } from "@/lib/content-quality/types";
import type { EditorialWorkspaceView } from "@/lib/content-studio/editorial/types";

function displayStatus(overall: ContentQualityReport["overall"] | undefined): string {
  if (overall === "pass") return "PASS";
  if (overall === "warning") return "WARNING";
  if (overall === "blocked") return "FAIL";
  return "NOT EVALUATED";
}

export default function EditorialQualityPanel({
  view,
  report,
  onValidate,
  busy,
}: {
  view: EditorialWorkspaceView;
  report?: ContentQualityReport;
  onValidate: () => void;
  busy: boolean;
}) {
  const snapshot = view.qualitySnapshot ?? view.production.qualitySnapshot;
  const shown = report ?? snapshot?.report;
  return (
    <section className="section">
      <h2>Quality</h2>
      <p>Pass means machine checks passed. It does not mean human approval, canonical registration, or publication.</p>
      <p>Overall {displayStatus(shown?.overall)} · {shown?.overall ?? "not evaluated"}</p>
      <p>Evaluated {snapshot?.evaluatedAt ?? "not evaluated"} · evaluator {snapshot?.evaluatorVersion ?? "not evaluated"}</p>
      {shown ? (
        <ul className="study-list">
          {shown.dimensions.map((dimension, index) => (
            <li key={`${dimension.dimension}-${index}`}>
              {dimension.dimension} · {dimension.status}
              {dimension.issues.length > 0 ? (
                <ul>
                  {dimension.issues.map((issue) => (
                    <li key={`${issue.code}-${issue.path}`}>{issue.code} · {issue.severity} · {issue.path} · {issue.message}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : <p>NOT EVALUATED</p>}
      <button type="button" className="button button-quiet" disabled={busy} onClick={onValidate}>Validate</button>
    </section>
  );
}
