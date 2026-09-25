import type { AiProvider } from "@/lib/ai-intelligence/provider";
import { createProductionDraft, evaluateProductionQuality } from "@/lib/content/production/index";
import { buildReviewProjection } from "@/lib/content/review/index";
import { generateStudioDraft } from "./generate";
import { resolveStudioIdentity } from "./identity";
import { parseStudioPackage } from "./parse";
import { buildStudioSourcePacket, sourcePacketToGenerationInput } from "./source-packet";
import { STUDIO_MAX_SOURCE_CHARS } from "./types";
import type { StudioFailure, StudioPipelineResult, StudioSourcePacketInput, StudioTopicIdentityInput } from "./types";

function invalid(code: StudioFailure["error"]["code"], message: string, extra: Partial<StudioFailure> = {}): StudioFailure {
  return { ok: false, error: { code, message }, ...extra };
}

/**
 * Studio makes exactly one routed generation request per item.
 * The provider router (Gemini primary → xAI fallback) is the failover authority.
 * Do not add a Studio retry loop around the router.
 */
export async function runStudioPipeline(input: {
  identity: StudioTopicIdentityInput;
  sourceText?: string;
  sourcePacket?: StudioSourcePacketInput;
  provider: AiProvider;
  evaluatedAt?: string;
}): Promise<StudioPipelineResult> {
  let identity;
  try {
    identity = resolveStudioIdentity(input.identity);
  } catch (error) {
    return invalid("invalid_identity", error instanceof Error ? error.message : "Topic identity is invalid.");
  }

  let sourceText = input.sourceText?.trim() ?? "";
  let sourceMetadata = input.identity.sourceMetadata;
  if (input.sourcePacket) {
    try {
      const packet = buildStudioSourcePacket(input.sourcePacket);
      const converted = sourcePacketToGenerationInput(packet, identity);
      sourceText = converted.sourceText;
      sourceMetadata = converted.sourceMetadata;
    } catch (error) {
      return invalid("invalid_source", error instanceof Error ? error.message : "Source packet is invalid.", { identity });
    }
  }
  if (!sourceText) return invalid("invalid_source", "Source text or source packet is required.", { identity });
  if (sourceText.length > STUDIO_MAX_SOURCE_CHARS) {
    return invalid("invalid_source", `Source text exceeds ${STUDIO_MAX_SOURCE_CHARS} characters.`, { identity });
  }

  const generated = await generateStudioDraft({
    identity,
    sourceText,
    provider: input.provider,
    sourceMetadata,
  });
  if (!generated.ok) {
    return invalid("provider_failure", generated.error.message, {
      identity,
      attempts: 1,
      ...(generated.providerTrace ? { providerTrace: generated.providerTrace } : {}),
    });
  }
  const parsed = parseStudioPackage(generated.text, identity);
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      identity,
      attempts: 1,
      rawText: generated.text,
      ...(generated.providerTrace ? { providerTrace: generated.providerTrace } : {}),
    };
  }
  const record = evaluateProductionQuality(
    createProductionDraft(parsed.pkg),
    input.evaluatedAt,
  );
  return {
    ok: true,
    identity,
    record,
    preview: buildReviewProjection(record),
    attempts: 1,
    ...(generated.usage ? { usage: generated.usage } : {}),
    ...(generated.providerTrace ? { providerTrace: generated.providerTrace } : {}),
  };
}
