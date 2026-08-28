export type Difficulty = "Foundation" | "Intermediate" | "Advanced";

export type Domain = {
  slug: string;
  title: string;
  description: string;
  topicCount: number;
};

export type ContentSource = {
  slug: string;
  title: string;
  description: string;
  subject: string;
  difficulty: Difficulty;
  banglaSummary: string;
  englishSummary: string;
  coreConcept: string;
  mechanism: string;
  keyFacts: string[];
  keyTerms: string[];
  examples: string[];
  misconceptions: string[];
  bcsTraps: string[];
  writtenPoints: string[];
  geographyConnection?: string;
  relatedTopics: string[];
  quickRevision: string[];
};
