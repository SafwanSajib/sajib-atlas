import Link from "next/link";
import { getReviewRecords } from "@/lib/content/review";

export default function ContentReviewIndexPage() {
  if (process.env.NODE_ENV === "production") {
    return <main className="section shell"><h1>Content review unavailable</h1><p>This development-only workspace is disabled in production.</p></main>;
  }
  const records = getReviewRecords();
  return (
    <main className="section shell">
      <p className="eyebrow">Development-only · Read-only</p>
      <h1>Canonical Content Review</h1>
      <p>Inspect canonical pilot content, evidence, quality, lifecycle, and integration readiness.</p>
      {records.length === 0 ? <p>No canonical content packages are registered for local review.</p> : (
        <ul className="study-list">
          {records.map((record) => <li key={record.content.topic.id}><Link href={`/content-review/${record.content.topic.subjectId.split("/").pop()}/${record.content.topic.id.split("/").pop()}`}>{record.content.topic.title}</Link> · {record.workflowState} · v{record.content.topic.contentVersion}</li>)}
        </ul>
      )}
    </main>
  );
}
