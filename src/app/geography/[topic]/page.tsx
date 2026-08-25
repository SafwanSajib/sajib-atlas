import { notFound } from "next/navigation";
import GeographyCategoryPage from "@/components/legacy/GeographyCategoryPage";
import TopicStudyPage from "@/components/learning/TopicStudyPage";
import { allGeographyTopics, geographyCategories, geographyCategoriesBySlug, geographyTopicsBySlug } from "@/lib/geography-data";

export function generateStaticParams() { return [...geographyCategories.map((category) => ({ topic: category.slug })), ...allGeographyTopics.map((topic) => ({ topic: topic.slug }))]; }

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: slug } = await params;
  const category = geographyCategoriesBySlug[slug];
  const topic = geographyTopicsBySlug[slug];
  return category ? { title: `${category.title} | Sajib Atlas`, description: category.description } : topic ? { title: `${topic.title} | Sajib Atlas`, description: topic.shortDescription } : {};
}

export default async function GeographyRoute({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: slug } = await params;
  const category = geographyCategoriesBySlug[slug];
  if (category) return <GeographyCategoryPage category={category} />;
  const topic = geographyTopicsBySlug[slug];
  if (!topic) notFound();
  const topicCategory = geographyCategories.find((item) => item.title === topic.category);
  if (!topicCategory) notFound();
  const index = topicCategory.topics.findIndex((item) => item.slug === topic.slug);
  return <TopicStudyPage topic={topic} category={topicCategory} previous={topicCategory.topics[index - 1]} next={topicCategory.topics[index + 1]} />;
}
