import CategoryPage from "@/components/legacy/CategoryPage";
import { nestedPages, nestedPaths } from "@/lib/knowledge-data";

export function generateStaticParams() { return nestedPaths.filter((path) => path.startsWith("bcs/")).map((path) => ({ topic: path.split("/")[1] })); }

export default async function BcsTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  return <CategoryPage data={nestedPages[`bcs/${topic}`]} />;
}
