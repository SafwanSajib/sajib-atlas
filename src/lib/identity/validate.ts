/**
 * Deterministic identity validation. No network, cookies, or persistence.
 */

import {
  IDENTITY_MODES,
  IDENTITY_STATUSES,
  LOCAL_LEARNER_ID,
  type AuthenticationIdentity,
  type ExternalIdentityRef,
  type IdentityMode,
  type IdentityStatus,
  type LearnerIdentity,
} from "./types";

function fail(message: string): never {
  throw new Error(`Identity: ${message}`);
}

const OPAQUE_AUTHENTICATED_ID = /^learner\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const PROVIDER_PREFIX = /^(google|apple|facebook|auth0|firebase|supabase|clerk)[-/]/i;
const PROVIDER_IN_LEARNER_ID =
  /^learner\/(google|apple|facebook|auth0|firebase|supabase|clerk)[-/]/i;

export function isIdentityMode(value: string): value is IdentityMode {
  for (const mode of IDENTITY_MODES) {
    if (mode === value) return true;
  }
  return false;
}

export function isIdentityStatus(value: string): value is IdentityStatus {
  for (const status of IDENTITY_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

export function isCanonicalLocalLearnerId(id: string): boolean {
  return id === LOCAL_LEARNER_ID;
}

export function isUnsafeCanonicalLearnerId(id: string): boolean {
  if (!id || id !== id.trim()) return true;
  if (id.includes("@")) return true;
  if (id.includes("+")) return true;
  if (id.includes("|")) return true;
  if (id.includes(" ")) return true;
  if (JWT_SHAPE.test(id)) return true;
  if (id.startsWith("eyJ")) return true;
  if (id.toLowerCase().includes("bearer")) return true;
  if (id.split("/").length > 2) return true;
  if (!id.startsWith("learner/")) return true;
  if (PROVIDER_IN_LEARNER_ID.test(id)) return true;
  return false;
}

/**
 * Future authenticated id shape: `learner/{opaque-id}`.
 * Does not generate ids. Local identity is not authenticated.
 */
export function isOpaqueAuthenticatedLearnerIdShape(id: string): boolean {
  if (id === LOCAL_LEARNER_ID) return false;
  if (isUnsafeCanonicalLearnerId(id)) return false;
  if (!OPAQUE_AUTHENTICATED_ID.test(id)) return false;
  const opaque = id.slice("learner/".length);
  if (opaque === "local") return false;
  if (PROVIDER_PREFIX.test(opaque)) return false;
  if (!/[0-9]/.test(opaque)) return false;
  if (opaque.length < 8) return false;
  return true;
}

export function validateLearnerIdentity(input: {
  learnerId: string;
  mode: string;
  status: string;
}): LearnerIdentity {
  if (!input || typeof input !== "object") fail("identity must be an object");
  if (!input.learnerId?.trim()) fail("empty learnerId");
  if (input.learnerId !== input.learnerId.trim()) fail("learnerId has surrounding whitespace");
  if (!isIdentityMode(input.mode)) fail(`invalid identity mode ${input.mode}`);
  if (!isIdentityStatus(input.status)) fail(`invalid identity status ${input.status}`);
  if (input.mode === "external") {
    fail("external identity is not canonical learner identity");
  }
  if (isUnsafeCanonicalLearnerId(input.learnerId)) {
    fail("learnerId cannot be email, phone, provider subject, or token");
  }
  if (input.mode === "local") {
    if (!isCanonicalLocalLearnerId(input.learnerId)) {
      fail("local identity must be learner/local");
    }
  } else if (!isOpaqueAuthenticatedLearnerIdShape(input.learnerId)) {
    fail("authenticated learnerId must be an opaque learner/{id} value");
  }

  return {
    learnerId: input.learnerId,
    mode: input.mode,
    status: input.status,
  };
}

export function validateAuthenticationIdentity(input: {
  authenticated: boolean;
  provider?: string;
  subject?: string;
}): AuthenticationIdentity {
  if (!input || typeof input !== "object") fail("authentication identity must be an object");
  if (typeof input.authenticated !== "boolean") fail("authenticated must be boolean");
  const auth: AuthenticationIdentity = { authenticated: input.authenticated };
  if (input.provider !== undefined) {
    if (!input.provider.trim()) fail("empty authentication provider");
    auth.provider = input.provider.trim();
  }
  if (input.subject !== undefined) {
    if (!input.subject.trim()) fail("empty authentication subject");
    auth.subject = input.subject.trim();
  }
  return auth;
}

export function validateExternalIdentityRef(input: {
  provider: string;
  subject: string;
}): ExternalIdentityRef {
  if (!input || typeof input !== "object") fail("external identity must be an object");
  if (!input.provider?.trim()) fail("empty external provider");
  if (!input.subject?.trim()) fail("empty external subject");
  if (input.subject.includes("@")) fail("external subject must not be an email");
  return {
    provider: input.provider.trim(),
    subject: input.subject.trim(),
  };
}

export function assertExternalIsNotCanonical(
  external: ExternalIdentityRef,
  learnerId: string,
): void {
  if (learnerId === external.subject) {
    fail("provider subject cannot become canonical learnerId");
  }
  if (learnerId === `${external.provider}/${external.subject}`) {
    fail("provider subject cannot become canonical learnerId");
  }
  if (learnerId === `learner/${external.provider}-${external.subject}`) {
    fail("provider subject cannot become canonical learnerId");
  }
}
