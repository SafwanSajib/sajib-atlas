import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/content/SectionHeading";
import { getAllTopics } from "@/lib/content/loaders/static-loader";

export const metadata = { title: "Topics" };

export default function TopicsPage() {
  const topics = getAllTopics();
  return <section className="section"><Container><SectionHeading eyebrow="Knowledge index" title="Topics" /><div className="grid" style={{ marginTop: "3rem" }}>{topics.map((topic) => <article className="card" key={topic.slug}><p className="eyebrow">{topic.subject} · {topic.difficulty}</p><h2>{topic.title}</h2><p>{topic.description}</p><Link className="link" href={`/topics/${topic.slug}`}>Open topic →</Link></article>)}</div></Container></section>;
}
