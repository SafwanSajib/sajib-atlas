import CategoryPage from "@/components/legacy/CategoryPage";
import { categoryPages } from "@/lib/knowledge-data";

export default function ExplorePage() { return <CategoryPage data={categoryPages.explore} />; }
