import type { Topic } from "@/lib/knowledge-data";

export default function TopicCard({ topic, index }: { topic: Topic; index: number }) {
  return <a className="topic-card" href={topic.href}><div className="card-top"><span className="card-number">{String(index + 1).padStart(2, "0")}</span><span className="arrow">↗</span></div><p className="card-label">{topic.label}</p><h3>{topic.title}</h3><p className="card-description">{topic.description}</p><span className="card-line" /></a>;
}
