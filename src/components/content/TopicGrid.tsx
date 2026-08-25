import type { GeographyTopic } from "@/lib/geography-data";
import type { Topic } from "@/lib/knowledge-data";
import TopicCard from "@/components/content/TopicCard";

export default function TopicGrid({ topics }: { topics: (Topic | GeographyTopic)[] }) {
  return <div className="topic-grid">{topics.map((topic, index) => <TopicCard key={topic.slug} topic={topic} index={index} />)}</div>;
}
