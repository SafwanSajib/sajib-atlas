import CategoryPage from "@/components/legacy/CategoryPage";
import { categoryPages } from "@/lib/knowledge-data";

export default function AboutPage() { return <CategoryPage data={categoryPages.about} />; }
