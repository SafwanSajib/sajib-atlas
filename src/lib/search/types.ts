export type SearchDocument = { id: string; title: string; description: string; href: string; subject: string };
export type SearchProvider = { search(query: string): Promise<SearchDocument[]> };
