import { createServerRoutedProvider } from "@/lib/ai-providers/server";
import { beginExperienceCall, endExperienceCall } from "@/lib/ai-experience/guard";
import { parseAiExperienceRequest } from "@/lib/ai-experience/parse";
import { handleAiExperienceRequest } from "@/lib/ai-experience/service";

export const maxDuration = 30;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function GET(): Response {
  return json({ ok: false, error: { code: "invalid_request", message: "Use POST." } }, 405);
}

function statusForCode(code: string, fallback: number): number {
  if (code === "invalid_request") return 400;
  if (code === "validation_failure") return 422;
  if (code === "rate_limited") return 429;
  if (code === "provider_unavailable" || code === "provider_failure") return 503;
  return fallback;
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: { code: "invalid_request", message: "Content-Type must be application/json." } }, 415);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: { code: "invalid_request", message: "Request must be JSON." } }, 400);
  }
  if (raw.length > 8192) {
    return json({ ok: false, error: { code: "validation_failure", message: "Request is too large." } }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return json({ ok: false, error: { code: "invalid_request", message: "Request must be JSON." } }, 400);
  }

  const parsed = parseAiExperienceRequest(payload);
  if (!parsed.ok) {
    return json(parsed, statusForCode(parsed.error.code, 422));
  }

  const slot = beginExperienceCall();
  if (!slot.ok) {
    return json({ ok: false, error: { code: slot.code, message: slot.message } }, 429);
  }

  try {
    const provider = createServerRoutedProvider();
    if (!provider.ok) {
      return json(
        {
          ok: false,
          error: {
            code: provider.error.code,
            message: "Grounded answers are unavailable because the AI provider is not configured.",
          },
        },
        503,
      );
    }
    const result = await handleAiExperienceRequest(parsed.data, provider.data);
    return json(result, result.ok ? 200 : statusForCode(result.error.code, 502));
  } finally {
    endExperienceCall();
  }
}
