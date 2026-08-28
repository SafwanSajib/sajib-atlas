import type { ContentSource } from "@/types/content";
import type { NormalizedTopic } from "@/types/topic";

export function normalizeTopic(source: ContentSource & { mcqs?: NormalizedTopic["mcqs"] }): NormalizedTopic {
  return {
    ...source,
    keyFacts: [...source.keyFacts],
    keyTerms: [...source.keyTerms],
    examples: [...source.examples],
    misconceptions: [...source.misconceptions],
    bcsTraps: [...source.bcsTraps],
    writtenPoints: [...source.writtenPoints],
    relatedTopics: [...source.relatedTopics],
    quickRevision: [...source.quickRevision],
    mcqs: source.mcqs ?? [],
  };
}
