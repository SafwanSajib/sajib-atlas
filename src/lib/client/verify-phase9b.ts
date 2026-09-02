import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { SEARCH_DEFAULT_LIMIT, SEARCH_MAX_LIMIT } from "@/lib/search/types";
import { clientReadAccess } from "./access";
import { clientReadAi } from "./ai";
import { clientReadAssessment } from "./assessment";
import { clientReadCapabilities, clientReadIdentity } from "./capabilities";
import { clientExecuteRequest } from "./http";
import { clientReadLearnerIntelligence } from "./intelligence";
import { clientNavigateTopic } from "./navigation";
import { createClientRequest, createClientRequestHeaders } from "./request";
import { clientSearch } from "./search";
import { clientOfflineProtectedAccess, clientServerCacheKey, clientStoreKind } from "./state";
import { clientReadTopic, clientReadTopics } from "./topics";
import {
  CLIENT_LOCAL_STORE_KIND,
  CLIENT_SERVER_CACHE_KIND,
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  FORBIDDEN_PLATFORM_FIELDS,
} from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 9B verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Phase 9B verification failed: expected throw (${label})`);
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

function listFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) listFiles(full, acc);
    else acc.push(full.replace(/\\/g, "/"));
  }
  return acc;
}

function runtimeFiles(dir: string): string[] {
  return listFiles(dir).filter(
    (path) => path.endsWith(".ts") && !path.includes("verify-") && !path.endsWith(".d.ts"),
  );
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

function isDistinct(left: string, right: string): boolean {
  return left !== right;
}

export async function runPhase9bVerification(): Promise<string[]> {
  const passed: string[] = [];

  const headers = createClientRequestHeaders({ surface: "android" });
  assert(headers["X-Platform-Client"] === "android", "android surface is sent");
  assert(headers["X-Platform-Contract-Version"] === "v1", "request version is v1");
  assert(headers["X-Platform-Learner"] === undefined, "request does not send learner spoof header");
  const withId = createClientRequestHeaders({
    surface: "ios",
    requestId: "platform-request/local-sample",
  });
  assert(withId["X-Platform-Request-Id"] === "platform-request/local-sample", "opaque request id is forwarded");
  expectThrow("invalid surface", () => createClientRequestHeaders({ surface: "browser" }));
  expectThrow("email as surface", () => createClientRequestHeaders({ surface: "learner/local" }));
  passed.push("API request headers reuse Phase 8 client/version contracts");

  const request = createClientRequest({
    surface: "web",
    url: "http://localhost/api/v1/identity",
  });
  const identityHttp = await clientExecuteRequest(request);
  assert(identityHttp.success === true, "identity HTTP execute succeeds");
  if (identityHttp.success) {
    const data = identityHttp.data as { identity: { learnerId: string } };
    assert(data.identity.learnerId === LOCAL_LEARNER_ID, "HTTP identity is learner/local");
  }
  const unknownRoute = await clientExecuteRequest(
    createClientRequest({ surface: "web", url: "http://localhost/api/v1/search" }),
  );
  assert(unknownRoute.success === false, "unknown product API is not invented");
  const aiRoute = await clientExecuteRequest(
    createClientRequest({ surface: "web", url: "http://localhost/api/ai" }),
  );
  assert(aiRoute.success === false, "no /api/ai dispatch");
  passed.push("API request dispatch uses existing /api/v1 routes only");

  const caps = clientReadCapabilities();
  assert(caps.success === true && caps.contractVersion === CURRENT_PLATFORM_API_CONTRACT_VERSION, "capabilities are v1");
  if (caps.success) {
    assert(caps.data.authentication === false, "authentication remains unimplemented");
    assert(caps.data.identity.learnerId === "learner/local", "capabilities identity is local");
    assert(caps.data.commerce === "records-only", "commerce stays records-only");
  }
  const identity = clientReadIdentity();
  assert(identity.success === true, "identity read succeeds");
  if (identity.success) {
    assert(identity.data.identity.learnerId === LOCAL_LEARNER_ID, "canonical learner is learner/local");
    assert(identity.data.identity.mode === "local", "identity mode is local");
  }
  passed.push("canonical learner/local identity is preserved");

  const topic = clientReadTopic("geography/earths-rotation");
  assert(topic.success === true, "topic read succeeds");
  if (topic.success) {
    assert(topic.data.topic.id === "geography/earths-rotation", "topic id is canonical");
    const json = JSON.stringify(topic.data);
    assert(!json.includes("mcqPractice"), "topic read has no MCQ payload");
    assert(!json.includes('"payload"'), "topic read has no payload pointer");
  }
  const missing = clientReadTopic("geography/missing");
  assert(missing.success === false && missing.error.code === "not_found", "unknown topic is not_found");
  const page = clientReadTopics({ subjectId: "geography", limit: 2 });
  assert(page.success === true, "topic collection succeeds");
  if (page.success) {
    assert(page.data.limit === 2 && page.data.items.length === 2, "client pagination uses platform page");
  }
  const over = clientReadTopics({ subjectId: "geography", limit: SEARCH_MAX_LIMIT + 1 });
  assert(over.success === false && over.error.code === "validation_failure", "limit above max is rejected");
  const nav = clientNavigateTopic("geography/earths-rotation");
  assert(nav.success === true, "navigation uses topic read");
  if (nav.success) {
    assert(nav.data.kind === "topic" && nav.data.topicId === "geography/earths-rotation", "navigation id is canonical");
  }
  passed.push("topic reads reuse 1J compose and platform pagination");

  const assessment = clientReadAssessment("geography/earths-rotation/mcq-practice");
  assert(assessment.success === true, "assessment-set read succeeds");
  if (assessment.success) {
    assert(assessment.data.id === "geography/earths-rotation/mcq-practice", "assessment id is canonical");
    assert(!("payload" in assessment.data), "assessment read omits payload");
    const json = JSON.stringify(assessment.data);
    assert(!json.includes("answer"), "assessment read has no answers");
    assert(!json.includes("geography-data"), "assessment read does not name geography-data");
  }
  const missingSet = clientReadAssessment("geography/missing/mcq-practice");
  assert(missingSet.success === false && missingSet.error.code === "not_found", "unknown assessment is not_found");
  passed.push("assessment reads are identity-only and answer-safe");

  const search = clientSearch("rotation");
  assert(search.success === true, "search delegates to Search engine");
  if (search.success) {
    assert(search.data.limit === SEARCH_DEFAULT_LIMIT, "search default limit is reused");
    assert(search.data.results.length <= SEARCH_MAX_LIMIT, "search respects max");
  }
  const badLimit = clientSearch("rotation", 0);
  assert(badLimit.success === false && badLimit.error.code === "validation_failure", "search invalid limit maps to envelope");
  passed.push("search read delegates to the Search engine");

  const intelligence = clientReadLearnerIntelligence();
  assert(intelligence.success === true, "intelligence read succeeds");
  if (intelligence.success) {
    assert(intelligence.data.learnerId === LOCAL_LEARNER_ID, "intelligence learner is local");
    assert(intelligence.data.topicProgress.length === 0, "empty local state projects empty progress");
  }
  const spoofed = clientReadLearnerIntelligence({
    learnerId: "user@example.com",
    assessments: [],
  });
  assert(spoofed.success === false, "non-local intelligence learner is rejected");
  passed.push("learner intelligence reads local state and keeps learner/local");

  const ai = clientReadAi({
    ok: true,
    data: {
      requestId: "req/local",
      responseId: "res/local",
      status: "success",
      groundingState: "grounded",
      text: "Earth rotates.",
      sources: [],
    },
  });
  assert(ai.success === true, "AI experience maps into envelope");
  const aiFail = clientReadAi({
    ok: false,
    error: { code: "invalid_request", message: "text is required" },
  });
  assert(aiFail.success === false && aiFail.error.code === "invalid_request", "AI errors map onto Phase 1J codes");
  passed.push("AI reads map experience results; no /api/ai");

  const publicAccess = clientReadAccess({
    scope: "topic",
    targetId: "geography/earths-rotation",
  });
  assert(publicAccess.success === true, "access read succeeds");
  if (publicAccess.success) {
    assert(publicAccess.data.allowed === true && publicAccess.data.reason === "free", "public catalog stays free");
  }
  const protectedAccess = clientReadAccess({
    scope: "feature",
    targetId: "future-explanations",
    learnerId: LOCAL_LEARNER_ID,
  });
  assert(protectedAccess.success === true, "protected access is an AccessDecision");
  if (protectedAccess.success) {
    assert(protectedAccess.data.allowed === false, "protected feature fails closed");
  }
  const spoofAccess = clientReadAccess({
    scope: "topic",
    targetId: "geography/earths-rotation",
    learnerId: "device-1",
  });
  assert(spoofAccess.success === false, "non-local access learner is rejected");
  passed.push("entitlement/access reads use decideAccess");

  assert(clientStoreKind("server-cache") === CLIENT_SERVER_CACHE_KIND, "server cache kind exists");
  assert(clientStoreKind("local-learner") === CLIENT_LOCAL_STORE_KIND, "local learner kind exists");
  assert(isDistinct(CLIENT_SERVER_CACHE_KIND, CLIENT_LOCAL_STORE_KIND), "stores are distinct");
  const cacheKey = clientServerCacheKey("topics", "topicId=geography/earths-rotation");
  assert(cacheKey.startsWith("platform-cache/v1/topics"), "cache key is versioned");
  assert(!cacheKey.includes("local-learner"), "cache key is not local store");
  const offline = clientOfflineProtectedAccess();
  assert(offline.allowed === false && offline.classification === "protected", "offline protected access fails closed");
  expectThrow("unknown store", () => clientStoreKind("session"));
  passed.push("client server cache is separate from local learner state");

  for (const field of FORBIDDEN_PLATFORM_FIELDS) {
    assert(!collectKeys(caps).has(field), `capabilities have no ${field}`);
    assert(!collectKeys(identity).has(field), `identity has no ${field}`);
    assert(!collectKeys(assessment).has(field), `assessment has no ${field}`);
  }
  passed.push("client projections are JSON-safe and secret-free");

  const runtime = runtimeFiles("src/lib/client");
  assert(runtime.length > 0, "client adapter runtime exists");
  for (const path of runtime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not import scoring`);
      assert(!specifier.includes("assessment-engine/delivery"), `${path} does not deliver MCQs`);
      assert(!specifier.includes("ai-providers"), `${path} does not import AI providers`);
      assert(!specifier.includes("learner-intelligence/ingest"), `${path} does not ingest intelligence`);
      assert(!specifier.includes("/commerce"), `${path} does not import commerce`);
    }
    assert(!source.includes("localStorage"), `${path} does not persist`);
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not score`);
  }
  assert(!existsSync("src/android") && !existsSync("android"), "no Android app");
  assert(!existsSync("src/ios") && !existsSync("ios"), "no iOS app");
  assert(!existsSync("src/app/api/v1/search"), "no /api/v1/search");
  assert(!existsSync("src/app/api/v1/assessment"), "no /api/v1/assessment");
  assert(!existsSync("src/app/api/ai"), "no /api/ai");
  passed.push("adapter does not duplicate engines or add product APIs");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase9b.ts");

if (executedFromCli) {
  const passed = await runPhase9bVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE9B_VERIFICATION: PASS");
}
