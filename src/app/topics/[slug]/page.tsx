import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { TopicHero } from "@/components/content/TopicHero";
import { ConceptSection } from "@/components/content/ConceptSection";
import { MisconceptionCard } from "@/components/content/MisconceptionCard";
import { WrittenPointCard } from "@/components/learning/WrittenPointCard";
import { QuickRevision } from "@/components/learning/QuickRevision";
import { MCQPractice } from "@/components/assessment/MCQPractice";
import { staticContentAdapter } from "@/lib/content/adapters/content-adapter";

export async function generateStaticParams() {
  const topics = await staticContentAdapter.getAllTopics();
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = await staticContentAdapter.getTopic(slug);
  return topic ? { title: topic.title, description: topic.description } : { title: "Topic not found" };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await staticContentAdapter.getTopic(slug);
  if (!topic) notFound();
  return <article className="topic"><Container><TopicHero topic={topic} /><ConceptSection title="বাংলা সারাংশ" body={topic.banglaSummary} /><ConceptSection title="English Summary" body={topic.englishSummary} /><ConceptSection title="Core Concept" body={topic.coreConcept} /><ConceptSection title="Mechanism · How It Works" body={topic.mechanism} /><ConceptSection title="Key Facts" items={topic.keyFacts} /><ConceptSection title="Key Terms" items={topic.keyTerms} /><ConceptSection title="Examples" items={topic.examples} /><section className="topic-section"><h2>Misconceptions</h2><MisconceptionCard items={topic.misconceptions} /></section><MCQPractice questions={topic.mcqs} /><ConceptSection title="BCS Trap" items={topic.bcsTraps} /><WrittenPointCard items={topic.writtenPoints} />{topic.geographyConnection ? <ConceptSection title="Geography Connection" body={topic.geographyConnection} /> : null}<ConceptSection title="Related Topics" items={topic.relatedTopics} /><QuickRevision items={topic.quickRevision} /></Container></article>;
}
