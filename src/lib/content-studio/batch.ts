import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { runStudioPipeline } from "./pipeline";
import type { StudioBatchItemInput, StudioBatchItemResult } from "./types";

export async function runStudioBatch(input: {
  items: readonly StudioBatchItemInput[];
  provider: AiProvider;
}): Promise<readonly StudioBatchItemResult[]> {
  const results: StudioBatchItemResult[] = [];
  for (const item of input.items) {
    const result = await runStudioPipeline({
      identity: item.identity,
      sourceText: item.sourceText,
      provider: input.provider,
    });
    results.push({ id: item.id, result });
  }
  return results;
}
