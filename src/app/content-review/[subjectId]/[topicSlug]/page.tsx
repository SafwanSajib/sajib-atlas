import { notFound } from "next/navigation";
import ReviewAudit from "@/components/content-review/ReviewAudit";
import ReviewContent from "@/components/content-review/ReviewContent";
import { buildReviewProjection, getReviewRecord } from "@/lib/content/review";

export default async function ContentReviewDetailPage({ params }: { params: Promise<{ subjectId: string; topicSlug: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { subjectId, topicSlug } = await params;
  const record = getReviewRecord(`topic/${subjectId}/${topicSlug}`);
  if (!record) notFound();
  const projection = buildReviewProjection(record);
  return (
    <main className="shell">
      <header className="section">
        <p className="eyebrow">Development-only · Read-only review</p>
        <h1>{projection.identity.title}</h1>
        <p>{projection.identity.topicId} · v{projection.identity.contentVersion}</p>
      </header>
      <ReviewAudit projection={projection} />
      <ReviewContent projection={projection} />
    </main>
  );
}
