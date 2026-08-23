import type { GeographyTopic } from "@/lib/geography-data";
import type { Topic } from "@/lib/knowledge-data";

type DisplayTopic = Topic | GeographyTopic;

export default function TopicCard({ topic, index }: { topic: DisplayTopic; index: number }) {
  const isGeographyTopic = "shortDescription" in topic;
  const label = isGeographyTopic ? topic.category : topic.label;
  const description = isGeographyTopic ? topic.shortDescription : topic.description;
  const href = isGeographyTopic ? `/geography/${topic.slug}` : topic.href;
  return <a className="topic-card" href={href}><div className="card-top"><span className="card-number">{String(index + 1).padStart(2, "0")}</span><span className="arrow">↗</span></div><p className="card-label">{label}</p><h3>{topic.title}</h3><p className="card-description">{description}</p>{isGeographyTopic ? <span className="topic-meta">{topic.difficulty} · {topic.examRelevance} relevance</span> : null}<span className="card-line" /></a>;
}
