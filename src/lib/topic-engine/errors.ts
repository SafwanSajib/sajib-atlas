/**
 * Transport-independent Topic Engine errors.
 * Distinct from the Phase 1J API envelope (`success` / `contractVersion`).
 */

export const TOPIC_ENGINE_ERROR_CODES = [
  "invalid_request",
  "not_found",
  "validation_failure",
] as const;
export type TopicEngineErrorCode = (typeof TOPIC_ENGINE_ERROR_CODES)[number];

export type TopicEngineError = {
  code: TopicEngineErrorCode;
  message: string;
};

export type TopicEngineSuccess<T> = {
  ok: true;
  data: T;
};

export type TopicEngineFailure = {
  ok: false;
  error: TopicEngineError;
};

export type TopicEngineResult<T> = TopicEngineSuccess<T> | TopicEngineFailure;

export function topicEngineSuccess<T>(data: T): TopicEngineSuccess<T> {
  return { ok: true, data };
}

export function topicEngineFailure(
  code: TopicEngineErrorCode,
  message: string,
): TopicEngineFailure {
  return { ok: false, error: { code, message } };
}

export function isTopicEngineErrorCode(value: string): value is TopicEngineErrorCode {
  for (const code of TOPIC_ENGINE_ERROR_CODES) {
    if (code === value) return true;
  }
  return false;
}
