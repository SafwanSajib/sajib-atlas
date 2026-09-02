/**
 * RAG-ready retrieval abstraction. Phase 5 lexical search is the first implementation.
 * Future semantic/hybrid/vector retrievers can implement KnowledgeRetriever
 * without changing AiRequest / AiContext / AiResponse.
 */

import { searchKnowledge } from "@/lib/search/retrieve";
import { projectSearchResultsToAiContext } from "./context";
import { aiFailure, aiSuccess } from "./errors";
import {
  AI_RETRIEVAL_SCHEMA_VERSION,
  CURRENT_AI_RETRIEVAL_METHOD,
  type AiIntelligenceResult,
  type KnowledgeRetrievalQuery,
  type KnowledgeRetrievalResult,
  type KnowledgeRetriever,
} from "./types";

export function createLexicalKnowledgeRetriever(): KnowledgeRetriever {
  return {
    retrieve(query: KnowledgeRetrievalQuery): AiIntelligenceResult<KnowledgeRetrievalResult> {
      const retrieved = searchKnowledge(query.query, { limit: query.limit });
      if (!retrieved.ok) {
        return aiFailure(
          retrieved.error.code === "invalid_request" ? "invalid_request" : "validation_failure",
          retrieved.error.message,
        );
      }
      const results = projectSearchResultsToAiContext(retrieved.data.results).map((item) => ({
        ...item,
        retrievalMethod: CURRENT_AI_RETRIEVAL_METHOD,
      }));
      return aiSuccess({
        query: retrieved.data.query,
        results,
        total: retrieved.data.total,
        method: CURRENT_AI_RETRIEVAL_METHOD,
        retrievalVersion: AI_RETRIEVAL_SCHEMA_VERSION,
      });
    },
  };
}

export const lexicalKnowledgeRetriever: KnowledgeRetriever = createLexicalKnowledgeRetriever();
