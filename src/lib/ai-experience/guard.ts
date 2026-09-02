/**
 * Process-local provider-call guard. One incoming experience request
 * may not start overlapping extra model calls from this handler.
 * Not a distributed rate limiter.
 */

/** Process-local only. One in-flight experience request per isolate. */
const MAX_CONCURRENT_PROVIDER_CALLS = 1;
let concurrentCalls = 0;

export function beginExperienceCall(): { ok: true } | { ok: false; code: string; message: string } {
  if (concurrentCalls >= MAX_CONCURRENT_PROVIDER_CALLS) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Another grounded answer is already in progress. Try again in a moment.",
    };
  }
  concurrentCalls += 1;
  return { ok: true };
}

export function endExperienceCall(): void {
  if (concurrentCalls > 0) concurrentCalls -= 1;
}

export function activeExperienceCalls(): number {
  return concurrentCalls;
}
