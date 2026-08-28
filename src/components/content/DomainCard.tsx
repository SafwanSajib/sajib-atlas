import Link from "next/link";
import type { Domain } from "@/types/content";

export function DomainCard({ domain }: { domain: Domain }) {
  return <article className="card"><p className="eyebrow">{domain.topicCount} topics</p><h3>{domain.title}</h3><p>{domain.description}</p><Link className="link" href={`/topics?subject=${domain.slug}`}>Explore →</Link></article>;
}
