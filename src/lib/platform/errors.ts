/**
 * Map domain error codes onto Phase 1J transport errors.
 * Does not replace identity, entitlement, search, or AI error types.
 */

import type { PlatformReadError, PlatformReadErrorCode } from "@/lib/contracts/api";

const NOT_FOUND = new Set(["not_found", "identity_not_found"]);
const VALIDATION = new Set(["validation_failure"]);

export function mapDomainErrorCode(code: string): PlatformReadErrorCode {
  if (NOT_FOUND.has(code)) return "not_found";
  if (VALIDATION.has(code)) return "validation_failure";
  return "invalid_request";
}

export function sanitizePlatformErrorMessage(message: string): string {
  if (!message || typeof message !== "string" || !message.trim()) {
    return "request failed";
  }
  const lower = message.toLowerCase();
  if (
    lower.includes("password") ||
    lower.includes("token") ||
    lower.includes("secret") ||
    lower.includes("apikey") ||
    lower.includes("src/") ||
    lower.includes("stack") ||
    message.includes("\\") ||
    /[a-z0-9._%+-]+@[a-z0-9.-]+/i.test(message)
  ) {
    return "request failed";
  }
  return message.trim();
}

export function toPlatformError(code: string, message: string): PlatformReadError {
  return {
    code: mapDomainErrorCode(code),
    message: sanitizePlatformErrorMessage(message),
  };
}
