import CategoryPage from "@/components/CategoryPage";
import { categoryPages } from "@/lib/knowledge-data";

export default function ExplorePage() { return <CategoryPage data={categoryPages.explore} />; }
