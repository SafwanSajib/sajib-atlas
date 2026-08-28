import type { NormalizedTopic } from "@/types/topic";

export function TopicHero({ topic }: { topic: NormalizedTopic }) {
  return <header className="topic-header"><p className="eyebrow">{topic.subject} · {topic.difficulty}</p><h1 className="section-title">{topic.title}</h1><p className="lead">{topic.description}</p></header>;
}
