import type { ReviewProjection } from "@/lib/content/review";

export default function ReviewAudit({ projection }: { projection: ReviewProjection }) {
  const { lifecycle, quality, evidence, integrations } = projection;
  return (
    <aside className="section">
      <div className="intelligence-card">
        <p className="eyebrow">Lifecycle</p>
        <p><strong>Workflow:</strong> {lifecycle.workflowState}</p>
        <p><strong>Content lifecycle:</strong> {lifecycle.contentLifecycle}</p>
        <p><strong>Version:</strong> {lifecycle.contentVersion}</p>
        <p><strong>Publication readiness:</strong> {lifecycle.publishable ? "PUBLISHABLE" : "NOT PUBLISHABLE"}</p>
        <p><strong>Delivery:</strong> {lifecycle.deliverable ? "DELIVERABLE" : "NOT PUBLICLY DELIVERABLE"}</p>
      </div>
      <div className="intelligence-card">
        <p className="eyebrow">Quality</p>
        <h2>{quality.status}</h2>
        {quality.evaluationStatus === "not-evaluated" ? <p>No valid version-bound quality snapshot is available.</p> : null}
        {quality.snapshot ? <p>Evaluated {quality.snapshot.evaluatedAt} with {quality.snapshot.evaluatorVersion}.</p> : null}
        {quality.snapshot?.report.dimensions.map((dimension) => <p key={dimension.dimension}><strong>{dimension.dimension}:</strong> {dimension.status}</p>)}
      </div>
      <div className="intelligence-card">
        <p className="eyebrow">Evidence</p>
        <p>{evidence.claims.length} claims · {evidence.sources.length} sources · {evidence.sourceReferences.length} references</p>
        {evidence.claims.map((claim) => <p key={claim.id}><strong>{claim.interpretationStatus}:</strong> {claim.statement}</p>)}
        <ul className="study-list">
          {evidence.sources.map((source) => <li key={source.id}><strong>{source.title}</strong> · {source.publisherOrOrganization} · <a href={source.reference}>{source.reference}</a></li>)}
        </ul>
      </div>
      <div className="intelligence-card">
        <p className="eyebrow">Integration</p>
        <p><strong>Assessment:</strong> {integrations.assessment.length} alignments</p>
        <p><strong>Search:</strong> {integrations.search.eligible ? "PASS" : "NOT ELIGIBLE"}</p>
        <p><strong>AI grounding:</strong> {integrations.ai.eligible ? "PASS" : "NOT ELIGIBLE"}</p>
        <p><strong>Learner references:</strong> {integrations.learner.valid ? "PASS" : "INVALID"}</p>
      </div>
    </aside>
  );
}
