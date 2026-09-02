import type { AiErrorCode, AiFailure, AiSuccess } from "./types";

export function aiSuccess<T>(data: T): AiSuccess<T> {
  return { ok: true, data };
}

export function aiFailure(code: AiErrorCode, message: string): AiFailure {
  return { ok: false, error: { code, message } };
}
