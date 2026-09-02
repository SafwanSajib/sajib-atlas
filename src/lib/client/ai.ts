/**
 * AI read mapping. Maps AiExperienceResult into the Phase 8 envelope.
 * Does not call providers or add /api/ai.
 */

import type { AiExperienceResult, AiExperienceView } from "@/lib/ai-experience/types";
import { mapAiExperienceResult } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";

export function clientReadAi(result: AiExperienceResult): PlatformReadResult<AiExperienceView> {
  return mapAiExperienceResult(result);
}
