import type { Topic } from "@/lib/knowledge-data";
import TopicCard from "@/components/TopicCard";

export default function TopicGrid({ topics }: { topics: Topic[] }) {
  return <div className="topic-grid">{topics.map((topic, index) => <TopicCard key={topic.slug} topic={topic} index={index} />)}</div>;
}
