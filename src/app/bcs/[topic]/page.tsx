import CategoryPage from "@/components/legacy/CategoryPage";
import { nestedPages } from "@/lib/knowledge-data";
import { notFound } from "next/navigation";

export default async function BcsTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const data = nestedPages[`bcs/${topic}`];

  if (!data) {
    notFound();
  }

  return <CategoryPage data={data} />;
}

