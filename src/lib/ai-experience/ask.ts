"use server";

import { createServerRoutedProvider } from "@/lib/ai-providers/server";
import { beginExperienceCall, endExperienceCall } from "./guard";
import { parseAiExperienceFormData } from "./parse";
import { handleAiExperienceRequest } from "./service";
import type { AiExperienceResult } from "./types";

function failure(code: string, message: string): AiExperienceResult {
  return { ok: false, error: { code, message } };
}

export async function askGroundedQuestion(
  _previous: AiExperienceResult | null,
  formData: FormData,
): Promise<AiExperienceResult> {
  const parsed = parseAiExperienceFormData(formData);
  if (!parsed.ok) return parsed;

  const slot = beginExperienceCall();
  if (!slot.ok) return failure(slot.code, slot.message);

  try {
    const provider = createServerRoutedProvider();
    if (!provider.ok) {
      return failure(
        provider.error.code,
        "Grounded answers are unavailable because the AI provider is not configured.",
      );
    }
    return await handleAiExperienceRequest(parsed.data, provider.data);
  } finally {
    endExperienceCall();
  }
}
