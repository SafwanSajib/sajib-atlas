/**
 * Deterministic AI context assembly: select, dedupe, budget, order.
 * Uses Phase 5 scores. Canonical ids are never truncated.
 */

import {
  AI_DEFAULT_CONTEXT_SOURCES,
  AI_MAX_CONTEXT_ITEM_CHARS,
  AI_MAX_CONTEXT_ITEMS,
  type AiApprovedExcerpt,
  type AiAssessmentContext,
  type AiContext,
  type AiKnowledgeReference,
  type KnowledgeRetrievalResult,
} from "./types";

export type AssembleAiContextInput = {
  retrieval: KnowledgeRetrievalResult;
  assessment?: AiAssessmentContext;
  excerpts?: readonly AiApprovedExcerpt[];
  maxSources?: number;
};

function compareEvidence(left: AiKnowledgeReference, right: AiKnowledgeReference): number {
  const leftScore = left.score ?? 0;
  const rightScore = right.score ?? 0;
  if (leftScore !== rightScore) return rightScore - leftScore;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

function capExcerpt(text: string): string {
  if (text.length <= AI_MAX_CONTEXT_ITEM_CHARS) return text;
  return text.slice(0, AI_MAX_CONTEXT_ITEM_CHARS);
}

export function assembleAiContext(input: AssembleAiContextInput): AiContext {
  const maxSources = Math.min(
    Math.max(input.maxSources ?? AI_DEFAULT_CONTEXT_SOURCES, 1),
    AI_MAX_CONTEXT_ITEMS,
  );
  const ranked = [...input.retrieval.results].sort(compareEvidence);
  const seen = new Set<string>();
  const references: AiKnowledgeReference[] = [];
  for (const item of ranked) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    references.push({
      ...item,
      retrievalMethod: item.retrievalMethod ?? input.retrieval.method,
    });
    if (references.length >= maxSources) break;
  }

  const context: AiContext = { references };
  if (input.excerpts && input.excerpts.length > 0) {
    context.excerpts = input.excerpts.map((item) => ({
      sourceId: item.sourceId,
      sourceKind: item.sourceKind,
      text: capExcerpt(item.text),
    }));
  }
  if (input.assessment) context.assessment = input.assessment;
  return context;
}
