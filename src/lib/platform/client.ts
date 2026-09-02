/**
 * Platform client identity. Not learner identity and not authentication.
 */

import {
  PLATFORM_CLIENT_SURFACES,
  type PlatformClientIdentity,
  type PlatformClientSurface,
} from "./types";

function fail(message: string): never {
  throw new Error(`Platform client: ${message}`);
}

export function isPlatformClientSurface(value: string): value is PlatformClientSurface {
  for (const surface of PLATFORM_CLIENT_SURFACES) {
    if (surface === value) return true;
  }
  return false;
}

export function validatePlatformClientIdentity(input: {
  surface: string;
}): PlatformClientIdentity {
  if (!input || typeof input !== "object") fail("client identity must be an object");
  if (!isPlatformClientSurface(input.surface)) fail(`invalid client surface ${input.surface}`);
  if ("learnerId" in input) fail("client identity must not include learnerId");
  return { surface: input.surface };
}
