import type { StudioProviderTrace } from "../types";
import type { SafeProviderTrace } from "./types";

const SECRET = /(?:Bearer\s+)[A-Za-z0-9._~+/=-]+|\bsk-[A-Za-z0-9._~+/=-]+\b|\bAIza[0-9A-Za-z_-]+\b|(?:api[_-]?key|authorization)\s*[:=]\s*\S+/gi;
const FORBIDDEN_KEYS = new Set([
  "authorization",
  "apiKey",
  "api_key",
  "headers",
  "rawText",
  "raw",
  "body",
  "accessToken",
  "access_token",
  "token",
]);

export function redactSecrets(value: string): string {
  return value.replace(SECRET, "[redacted]");
}

export function scrubStored<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (key, entry) => (FORBIDDEN_KEYS.has(key) ? undefined : entry))) as T;
}

export function sanitizeProviderTrace(trace: StudioProviderTrace | undefined): SafeProviderTrace | undefined {
  if (!trace) return undefined;
  return {
    provider: redactSecrets(trace.provider).slice(0, 80),
    attempts: trace.attempts,
    retryOccurred: trace.retryOccurred,
    attemptsDetail: trace.attemptsDetail.map((row) => ({
      attempt: row.attempt,
      outcome: redactSecrets(row.outcome).slice(0, 160),
      ...(typeof row.status === "number" ? { status: row.status } : {}),
      ...(row.finishReason ? { finishReason: redactSecrets(row.finishReason).slice(0, 80) } : {}),
    })),
  };
}
