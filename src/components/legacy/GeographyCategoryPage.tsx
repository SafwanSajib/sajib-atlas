import type { GeographyCategory } from "@/lib/geography-data";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import SectionHeading from "@/components/layout/SectionHeading";
import TopicGrid from "@/components/content/TopicGrid";

export default function GeographyCategoryPage({ category }: { category: GeographyCategory }) {
  return <><Navbar /><main className="category-main"><div className="shell"><div className="page-header"><Breadcrumbs current={category.title} parentHref="/geography" parentLabel="Geography" /><p className="eyebrow">{category.eyebrow}</p><h1>{category.title}</h1><p className="page-description">{category.description}</p><p className="topic-count">{category.topics.length} study topics</p></div><section className="category-topics"><SectionHeading eyebrow="Browse the collection" title="Choose a topic" description="Start with a concept, then follow its links through the wider geographic system." /><TopicGrid topics={category.topics} /></section></div></main><Footer /></>;
}
