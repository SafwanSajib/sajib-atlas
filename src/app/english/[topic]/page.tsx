import CategoryPage from "@/components/legacy/CategoryPage";
import { nestedPages, nestedPaths } from "@/lib/knowledge-data";

export function generateStaticParams() { return nestedPaths.filter((path) => path.startsWith("english/")).map((path) => ({ topic: path.split("/")[1] })); }

export default async function EnglishTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  return <CategoryPage data={nestedPages[`english/${topic}`]} />;
}
