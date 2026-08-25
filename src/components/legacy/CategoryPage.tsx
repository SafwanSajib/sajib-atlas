import type { CategoryPageData } from "@/lib/knowledge-data";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import PageHeader from "@/components/layout/PageHeader";
import SectionHeading from "@/components/layout/SectionHeading";
import TopicGrid from "@/components/content/TopicGrid";

export default function CategoryPage({ data }: { data: CategoryPageData }) {
  return <><Navbar /><main className="category-main"><div className="shell"><PageHeader {...data} /><section className="category-topics"><SectionHeading eyebrow="Browse the collection" title="Choose a direction" description="Each area is a doorway into a larger, connected body of knowledge." /><TopicGrid topics={data.topics} /></section><section className="coming-next"><p className="eyebrow">Coming next</p><h2>{data.nextTitle}</h2><p>{data.nextDescription}</p></section></div></main><Footer /></>;
}
