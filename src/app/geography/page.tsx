import GeographyCategoryPage from "@/components/GeographyCategoryPage";
import { geographyCategories } from "@/lib/geography-data";

export default function GeographyPage() {
	return <GeographyCategoryPage category={{ ...geographyCategories[0], title: "Geography", eyebrow: "The spatial atlas", description: "Understand places through patterns, processes and the relationships between people and their environments.", topics: geographyCategories.map((category) => ({ slug: category.slug, title: category.title, shortDescription: category.description, category: "Geography", difficulty: "Foundation", examRelevance: `${category.topics.length} topics`, tags: ["category"], sections: { overview: category.description, coreConcept: category.description, keyFacts: [], bcsPreli: [], writtenPoints: [], geographyLink: category.description, quickRevision: [] } })) }} />;
}
