import type { GeographyCategory, GeographyTopic } from "@/lib/geography-data";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PreviousNextNavigation from "@/components/PreviousNextNavigation";

function BulletList({ items }: { items: string[] }) {
  return <ul className="study-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function StudySection({ eyebrow, title, children }: { eyebrow: string; title?: string; children: React.ReactNode }) {
  return <section><p className="eyebrow">{eyebrow}</p>{title ? <h2>{title}</h2> : null}{children}</section>;
}

function OptionalStudySection({ eyebrow, items }: { eyebrow: string; items?: string[] }) {
  return items?.length ? <StudySection eyebrow={eyebrow}><BulletList items={items} /></StudySection> : null;
}

export default function TopicStudyPage({ topic, category, previous, next }: { topic: GeographyTopic; category: GeographyCategory; previous?: GeographyTopic; next?: GeographyTopic }) {
  return <>
    <Navbar />
    <main className="study-main">
      <div className="shell">
        <div className="study-header">
          <Breadcrumbs current={topic.title} parentHref={`/geography/${category.slug}`} parentLabel={category.title} />
          <p className="eyebrow">{topic.category}</p>
          <h1>{topic.title}</h1>
          <p className="page-description">{topic.shortDescription}</p>
          <div className="study-meta">
            <span><small>BCS relevance</small><strong>{topic.examRelevance}</strong></span>
            <span><small>Difficulty</small><strong>{topic.difficulty}</strong></span>
            <span><small>Tags</small><strong>{topic.tags.join(" · ")}</strong></span>
          </div>
        </div>
        <article className="study-content">
          <StudySection eyebrow="Summary"><p className="study-lead">{topic.sections.englishSummary}</p></StudySection>
          <StudySection eyebrow="Core concept" title="Understand the system"><p>{topic.sections.coreConcept}</p></StudySection>
          <StudySection eyebrow="Why / how it happens" title="Causes and context"><p>{topic.sections.whyHow}</p></StudySection>
          <StudySection eyebrow="Mechanism / process"><p>{topic.sections.mechanism}</p></StudySection>
          <StudySection eyebrow="Key facts"><BulletList items={topic.sections.keyFacts} /></StudySection>
          <OptionalStudySection eyebrow="Important terminology" items={topic.terminology} />
          <OptionalStudySection eyebrow="Established figures" items={topic.establishedFigures} />
          <OptionalStudySection eyebrow="Named examples / case studies" items={topic.caseStudies} />
          <StudySection eyebrow="Causes / components"><BulletList items={topic.sections.causesComponents} /></StudySection>
          <StudySection eyebrow="Effects / significance"><BulletList items={topic.sections.effectsSignificance} /></StudySection>
          <StudySection eyebrow="Geography connection"><p>{topic.sections.geographyConnection}</p></StudySection>
          <StudySection eyebrow="Bangladesh connection"><p>{topic.sections.bangladeshConnection}</p></StudySection>
          <StudySection eyebrow="BCS preliminary facts"><BulletList items={topic.sections.bcsPreli} /></StudySection>
          <StudySection eyebrow="BCS written analysis" title="Build an analytical answer"><BulletList items={topic.sections.writtenPoints} /></StudySection>
          <StudySection eyebrow="Common misconceptions"><BulletList items={topic.sections.misconceptions} /></StudySection>
          <StudySection eyebrow="MCQ practice">
            <div className="mcq-list">
              {topic.sections.mcqPractice.map((mcq) => <details className="mcq-card" key={mcq.question}>
                <summary>{mcq.question}</summary>
                <ol>{mcq.options.map((option) => <li key={option}>{option}</li>)}</ol>
                <p><strong>Answer:</strong> {mcq.answer}</p>
                <p>{mcq.explanation}</p>
                <p><strong>BCS shortcut / trap:</strong> {mcq.shortcutOrTrap}</p>
              </details>)}
            </div>
          </StudySection>
          <StudySection eyebrow="Quick revision"><BulletList items={topic.sections.quickRevision} /></StudySection>
        </article>
        <PreviousNextNavigation previous={previous} next={next} categorySlug={category.slug} />
      </div>
    </main>
    <Footer />
  </>;
}
