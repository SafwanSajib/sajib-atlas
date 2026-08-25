import GeographyIndexPage from "@/components/legacy/GeographyIndexPage";
import { geographyCategories } from "@/lib/geography-data";

export default function GeographyPage() {
	return <GeographyIndexPage categories={geographyCategories} />;
}
