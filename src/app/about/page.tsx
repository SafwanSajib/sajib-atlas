import CategoryPage from "@/components/CategoryPage";
import { categoryPages } from "@/lib/knowledge-data";

export default function AboutPage() { return <CategoryPage data={categoryPages.about} />; }
