import { readFileSync } from "node:fs";
import { CURRENT_PLATFORM_API_CONTRACT_VERSION } from "@/lib/contracts/api";
import { composeTopicReadResponse, platformReadSuccess, readTopic } from "@/lib/contracts/compose";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { SEARCH_DEFAULT_LIMIT, SEARCH_MAX_LIMIT } from "@/lib/search/types";
import { TOPIC_CAPABILITY_KINDS } from "@/lib/topic-engine/types";
import { defaultPlatformCapabilities } from "./capabilities";
import { validatePlatformClientIdentity } from "./client";
import { validatePlatformRequestContext } from "./context";
import { mapAiExperienceResult, platformFailure, platformSuccess } from "./envelope";
import { mapDomainErrorCode, toPlatformError } from "./errors";
import { createPlatformPage, validatePlatformCursor } from "./page";
import {
  FORBIDDEN_PLATFORM_FIELDS,
  PLATFORM_CLIENT_SURFACES,
  PLATFORM_READ_ERROR_CODES,
} from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 8B verification failed: ${message}`);
}

function isDistinct(left: string, right: string): boolean {
  return left !== right;
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Phase 8B verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
}

function collectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    keys.add(key);
    collectKeys(record[key], keys);
  }
  return keys;
}

function importedModules(source: string): string[] {
  const imports: string[] = [];
  const re = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    imports.push(match[1]);
    match = re.exec(source);
  }
  return imports;
}

export function runPhase8bVerification(): string[] {
  const passed: string[] = [];

  const topic = composeTopicReadResponse("geography/earths-rotation");
  assert(topic !== undefined, "1J topic compose still works");
  const enveloped = platformSuccess(topic);
  const from1j = platformReadSuccess(topic);
  assert(enveloped.success === true, "envelope success uses 1J shape");
  assert(from1j.success === true, "1J helper remains canonical");
  assert(enveloped.success && from1j.success && enveloped.contractVersion === from1j.contractVersion, "version is 1J contractVersion");
  assert(enveloped.success && enveloped.contractVersion === "v1", "current version is v1");
  assert(JSON.stringify(enveloped) === JSON.stringify(from1j), "platformSuccess is Phase 1J success");
  passed.push("API request/response envelope reuses Phase 1J");

  const viaRead = readTopic({ topicId: "geography/earths-rotation" });
  assert(viaRead.success === true, "1J readTopic still succeeds");
  assert(CURRENT_PLATFORM_API_CONTRACT_VERSION === "v1", "canonical current version is v1");
  assert(!topic.topic.id.includes("v1"), "topic id does not embed contract version");
  assert(!LOCAL_LEARNER_ID.includes("v1"), "learner id does not embed contract version");
  passed.push("API version remains v1 on the envelope only");

  const web = validatePlatformClientIdentity({ surface: "web" });
  const android = validatePlatformClientIdentity({ surface: "android" });
  const ios = validatePlatformClientIdentity({ surface: "ios" });
  const api = validatePlatformClientIdentity({ surface: "api" });
  assert(web.surface === "web" && android.surface === "android", "web and android surfaces exist");
  assert(ios.surface === "ios" && api.surface === "api", "ios and api surfaces exist");
  assert(PLATFORM_CLIENT_SURFACES.length === 4, "exactly four client surfaces");
  assert(isDistinct(web.surface, LOCAL_LEARNER_ID), "client surface is not learner/local");
  expectThrow("learner as surface", () => validatePlatformClientIdentity({ surface: "learner/local" }));
  expectThrow("learnerId on client", () =>
    validatePlatformClientIdentity({ surface: "web", learnerId: LOCAL_LEARNER_ID } as never),
  );
  passed.push("platform/client identity is surface-only");

  const empty = createPlatformPage([], 10);
  assert(empty.items.length === 0 && empty.limit === 10, "empty page is valid");
  assert(empty.nextCursor === undefined, "empty page has no cursor");
  const page = createPlatformPage(["a", "b", "c"], 2);
  assert(page.items.length === 2 && page.nextCursor === "cursor/continue", "overflow sets opaque cursor");
  assert(page.limit === 2, "limit is preserved");
  expectThrow("numeric cursor", () => validatePlatformCursor("25"));
  expectThrow("zero offset cursor", () => validatePlatformCursor("0"));
  assert(validatePlatformCursor("cursor/continue") === "cursor/continue", "opaque cursor is accepted");
  assert(SEARCH_DEFAULT_LIMIT === 25 && SEARCH_MAX_LIMIT === 100, "search limit bounds are reused");
  passed.push("pagination is optional items/limit/nextCursor");

  const capabilities = defaultPlatformCapabilities();
  assert(capabilities.authentication === false, "authentication is not implemented");
  assert(capabilities.identity.learnerId === "learner/local", "capabilities use canonical learner");
  assert(capabilities.identity.mode === "local", "identity mode is local");
  assert(capabilities.commerce === "records-only", "commerce is records-only");
  assert(capabilities.persistence === "local", "persistence is local");
  assert(capabilities.knowledgeRead && capabilities.search && capabilities.aiAsk, "reads and AI ask are available");
  assert(!("study" in capabilities), "platform capabilities are not topic study flags");
  assert(!("concepts" in capabilities), "platform capabilities are not topic concept flags");
  assert(!("completion" in capabilities), "platform capabilities are not topic completion flags");
  assert(!("revision" in capabilities), "platform capabilities are not topic revision flags");
  assert(!("assessment" in capabilities), "platform uses assessmentContracts, not topic assessment");
  assert(TOPIC_CAPABILITY_KINDS.includes("study"), "topic capability kinds remain in topic-engine");
  passed.push("capability discovery is platform-scoped");

  assert(mapDomainErrorCode("identity_not_found") === "not_found", "identity_not_found maps to not_found");
  assert(mapDomainErrorCode("validation_failure") === "validation_failure", "validation_failure is preserved");
  assert(mapDomainErrorCode("invalid_identity") === "invalid_request", "domain identity errors map to invalid_request");
  const unsafe = toPlatformError("invalid_request", "see src/lib/secret token");
  assert(unsafe.message === "request failed", "unsafe error text is sanitized");
  assert(PLATFORM_READ_ERROR_CODES.includes(unsafe.code), "transport codes stay Phase 1J");
  const failed = platformFailure("identity_not_found", "missing");
  assert(failed.success === false && failed.error.code === "not_found", "envelope failure uses mapped code");
  const aiMapped = mapAiExperienceResult({
    ok: false,
    error: { code: "invalid_request", message: "text is required" },
  });
  assert(aiMapped.success === false, "AI result maps into 1J envelope");
  passed.push("standardized API errors map domain codes onto Phase 1J");

  const context = validatePlatformRequestContext({
    contractVersion: "v1",
    client: { surface: "web" },
    learnerId: LOCAL_LEARNER_ID,
    requestId: "platform-request/local-sample",
  });
  assert(context.learnerId === "learner/local", "request context learner is canonical");
  assert(context.client.surface === "web", "request context carries client surface");
  expectThrow("email learner", () =>
    validatePlatformRequestContext({
      contractVersion: "v1",
      client: { surface: "web" },
      learnerId: "user@example.com",
    }),
  );
  expectThrow("device learner", () =>
    validatePlatformRequestContext({
      contractVersion: "v1",
      client: { surface: "android" },
      learnerId: "device-abc",
    }),
  );
  passed.push("request context keeps client and learner distinct");

  assertJsonSafe(enveloped, "success envelope");
  assertJsonSafe(failed, "failure envelope");
  assertJsonSafe(capabilities, "capabilities");
  assertJsonSafe(page, "page");
  assertJsonSafe(context, "request context");
  for (const field of FORBIDDEN_PLATFORM_FIELDS) {
    assert(!collectKeys(enveloped).has(field), `envelope has no ${field}`);
    assert(!collectKeys(capabilities).has(field), `capabilities have no ${field}`);
  }
  passed.push("public platform objects are JSON-safe and secret-free");

  const runtime = [
    "src/lib/platform/types.ts",
    "src/lib/platform/envelope.ts",
    "src/lib/platform/client.ts",
    "src/lib/platform/context.ts",
    "src/lib/platform/errors.ts",
    "src/lib/platform/page.ts",
    "src/lib/platform/capabilities.ts",
    "src/lib/platform/index.ts",
  ];
  for (const path of runtime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not import scoring`);
      assert(!specifier.includes("ai-providers"), `${path} does not import providers`);
      assert(!specifier.includes("topic-engine"), `${path} does not copy topic-engine capabilities`);
    }
    assert(!source.includes("localStorage"), `${path} has no storage`);
    assert(!source.includes("fetch("), `${path} has no network`);
    assert(!source.includes("next/headers"), `${path} has no cookies`);
  }
  passed.push("platform module does not duplicate engines or add HTTP");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase8b.ts");

if (executedFromCli) {
  const passed = runPhase8bVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE8B_VERIFICATION: PASS");
}
