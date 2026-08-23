import type { GeographyCategory } from "@/lib/geography-data";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SectionHeading from "@/components/SectionHeading";

export default function GeographyIndexPage({ categories }: { categories: GeographyCategory[] }) {
  return <><Navbar /><main className="category-main"><div className="shell"><div className="page-header"><Breadcrumbs current="Geography" /><p className="eyebrow">The spatial atlas</p><h1>Geography</h1><p className="page-description">Understand places through patterns, processes and the relationships between people and their environments.</p><p className="topic-count">{categories.length} study categories</p></div><section className="category-topics"><SectionHeading eyebrow="Browse the collection" title="Choose a category" description="Move from a broad geographic domain into focused concepts and structured study pages." /><div className="topic-grid">{categories.map((category) => <a className="topic-card" href={`/geography/${category.slug}`} key={category.slug}><div className="card-top"><span className="card-number">{category.number}</span><span className="arrow">↗</span></div><p className="card-label">{category.eyebrow}</p><h3>{category.title}</h3><p className="card-description">{category.description}</p><span className="topic-meta">{category.topics.length} study topics</span><span className="card-line" /></a>)}</div></section></div></main><Footer /></>;
}
