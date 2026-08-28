import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { DomainCard } from "@/components/content/DomainCard";
import { SectionHeading } from "@/components/content/SectionHeading";
import { domains } from "@/content/registry";

export default function HomePage() {
  return <>
    <section className="hero"><Container><p className="eyebrow">Knowledge · Geography · Growth</p><h1 className="display">Explore.<br />Learn.<br /><span>Connect.</span></h1><div className="hero-copy"><p className="lead">A structured knowledge ecosystem for understanding ideas, practising what you learn, discovering connections, and building a durable path forward.</p><div className="cta-row"><Link className="cta primary" href="/topics/motions-of-earth">Start with a topic →</Link><Link className="cta" href="/subjects">Explore subjects</Link></div></div></Container></section>
    <section className="section"><Container><SectionHeading eyebrow="The knowledge map" title="One system. Many domains." /><div className="grid" style={{ marginTop: "3rem" }}>{domains.map((domain) => <DomainCard key={domain.slug} domain={domain} />)}</div></Container></section>
    <section className="section"><Container><SectionHeading eyebrow="The learning loop" title="Learn → Understand → Practice → Revise" /><p className="lead" style={{ marginTop: "2rem" }}>The platform is designed around reusable knowledge rather than isolated pages. Assessment, revision, discovery, and future intelligence layers attach to the same underlying content model.</p></Container></section>
  </>;
}
