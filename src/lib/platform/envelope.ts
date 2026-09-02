/**
 * Platform envelope. Reuses Phase 1J success/failure. Not a second result type.
 */

import { platformReadFailure, platformReadSuccess } from "@/lib/contracts/compose";
import {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  PLATFORM_READ_ERROR_CODES,
  type PlatformReadErrorCode,
  type PlatformReadResult,
} from "@/lib/contracts/api";
import type { AiExperienceResult, AiExperienceView } from "@/lib/ai-experience/types";
import { toPlatformError } from "./errors";

export function isPlatformReadEnvelope(value: unknown): value is PlatformReadResult<unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.success === true) {
    return record.contractVersion === CURRENT_PLATFORM_API_CONTRACT_VERSION && "data" in record;
  }
  if (record.success === false) {
    const error = record.error;
    if (error === null || typeof error !== "object" || Array.isArray(error)) return false;
    const body = error as Record<string, unknown>;
    if (typeof body.code !== "string" || typeof body.message !== "string") return false;
    for (const code of PLATFORM_READ_ERROR_CODES) {
      if (code === body.code) return true;
    }
    return false;
  }
  return false;
}

export function platformSuccess<T>(data: T): PlatformReadResult<T> {
  return platformReadSuccess(data);
}

export function platformFailure(
  code: PlatformReadErrorCode | string,
  message: string,
): PlatformReadResult<never> {
  const error = toPlatformError(code, message);
  return platformReadFailure(error.code, error.message);
}

/**
 * Map the AI experience result into the Phase 1J envelope.
 * Does not copy AI domain types or add /api/ai.
 */
export function mapAiExperienceResult(
  result: AiExperienceResult,
): PlatformReadResult<AiExperienceView> {
  if (result.ok) return platformSuccess(result.data);
  const error = toPlatformError(result.error.code, result.error.message);
  return platformFailure(error.code, error.message);
}
