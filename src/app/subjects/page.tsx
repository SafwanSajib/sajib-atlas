import { Container } from "@/components/shared/Container";
import { DomainCard } from "@/components/content/DomainCard";
import { SectionHeading } from "@/components/content/SectionHeading";
import { domains } from "@/content/registry";

export const metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return <section className="section"><Container><SectionHeading eyebrow="Knowledge domains" title="Subjects, connected." /><p className="lead" style={{ marginTop: "2rem" }}>Each subject is an entry point into the same knowledge engine. New domains should extend the model, not create another application.</p><div className="grid" style={{ marginTop: "3rem" }}>{domains.map((domain) => <DomainCard key={domain.slug} domain={domain} />)}</div></Container></section>;
}
