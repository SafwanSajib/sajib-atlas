import type { CategoryPageData } from "@/lib/knowledge-data";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import TopicGrid from "@/components/TopicGrid";

export default function CategoryPage({ data }: { data: CategoryPageData }) {
  return <><Navbar /><main className="category-main"><div className="shell"><PageHeader {...data} /><section className="category-topics"><SectionHeading eyebrow="Browse the collection" title="Choose a direction" description="Each area is a doorway into a larger, connected body of knowledge." /><TopicGrid topics={data.topics} /></section><section className="coming-next"><p className="eyebrow">Coming next</p><h2>{data.nextTitle}</h2><p>{data.nextDescription}</p></section></div></main><Footer /></>;
}
