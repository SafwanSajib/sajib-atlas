import { existsSync, readFileSync } from "node:fs";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { FORBIDDEN_PLATFORM_FIELDS } from "@/lib/platform/types";
import { clientCachePut, emptyClientServerCache, isSafeClientCacheData } from "./cache";
import { clientReadIdle, clientReadLoading } from "./read-state";
import {
  clientSetOnline,
  clientStateBeginRead,
  clientStatePeek,
  clientStateReadAccess,
  clientStateReadAi,
  clientStateReadAssessment,
  clientStateReadCapabilities,
  clientStateReadIdentity,
  clientStateReadLearnerIntelligence,
  clientStateReadTopic,
  clientStateSearch,
  clientStateWriteLocal,
  createClientState,
} from "./session";
import { CLIENT_LOCAL_STORE_KIND, CLIENT_SERVER_CACHE_KIND } from "./types";
import { runPhase9bVerification } from "./verify-phase9b";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 9C verification failed: ${message}`);
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

export async function runPhase9cVerification(): Promise<string[]> {
  const passed: string[] = [];

  const prior = await runPhase9bVerification();
  assert(prior.length > 0, "Phase 9B adapter verifier still runs");
  passed.push("Phase 9B shared client adapter remains compatible");

  const idle = clientReadIdle(CLIENT_SERVER_CACHE_KIND);
  const loading = clientReadLoading(CLIENT_SERVER_CACHE_KIND);
  assert(idle.status === "idle" && loading.status === "loading", "idle and loading states exist");
  let state = createClientState(true);
  state = clientStateBeginRead(state, "platform-cache/v1/topics?topicId=geography/earths-rotation", CLIENT_SERVER_CACHE_KIND);
  const began = clientStatePeek(state, "platform-cache/v1/topics?topicId=geography/earths-rotation");
  assert(began !== undefined && began.status === "loading", "begin read is loading");
  passed.push("loading/success/error read states are explicit");

  const caps = clientStateReadCapabilities(state);
  assert(caps.read.status === "success" && caps.read.source === "server", "online capabilities come from server");
  const identity = clientStateReadIdentity(caps.state);
  assert(identity.read.status === "success", "online identity succeeds");
  if (identity.read.status === "success" && identity.read.data) {
    const data = identity.read.data as { identity: { learnerId: string } };
    assert(data.identity.learnerId === LOCAL_LEARNER_ID, "identity remains learner/local");
  }
  const topic = clientStateReadTopic(identity.state, "geography/earths-rotation");
  assert(topic.read.status === "success" && topic.read.source === "server", "online topic is a server read");
  assert(topic.read.store === CLIENT_SERVER_CACHE_KIND, "topic cache is server-cache");
  const assessment = clientStateReadAssessment(topic.state, "geography/earths-rotation/mcq-practice");
  assert(assessment.read.status === "success", "online assessment identity succeeds");
  const search = clientStateSearch(assessment.state, "rotation");
  assert(search.read.status === "success", "online search succeeds");
  state = search.state;
  passed.push("online reads populate server cache from existing engines");

  const cachedKeys = Object.keys(state.server.entries);
  assert(cachedKeys.some((key) => key.includes("topics")), "topic projection is cached");
  assert(!cachedKeys.some((key) => key.includes("/access")), "access decisions are not cached");
  const topicJson = JSON.stringify(state.server.entries);
  assert(!topicJson.includes('"payload"'), "cache has no payload pointers");
  assert(!topicJson.includes("mcqPractice"), "cache has no MCQ payload");
  for (const field of FORBIDDEN_PLATFORM_FIELDS) {
    assert(!collectKeys(state.server.entries).has(field), `cache has no ${field}`);
  }
  passed.push("server cache stores only safe public read projections");

  const localWrite = clientStateWriteLocal(state, {
    completedTopicIds: ["geography/earths-rotation"],
  });
  assert(localWrite.success === true, "local learner write succeeds");
  if (localWrite.success) {
    state = localWrite.data;
    assert(state.local.kind === CLIENT_LOCAL_STORE_KIND, "local store kind is local-learner");
    assert(state.local.learnerId === LOCAL_LEARNER_ID, "local learner is learner/local");
    assert(state.local.completedTopicIds.includes("geography/earths-rotation"), "local completion is recorded");
    assert(state.server.kind === CLIENT_SERVER_CACHE_KIND, "server cache is unchanged in kind");
    assert(!JSON.stringify(state.local).includes("platform-cache/"), "local store is not the server cache");
  }
  const spoofLocal = clientStateWriteLocal(state, { learnerId: "device-1" });
  assert(spoofLocal.success === false, "non-local learner cannot enter local store");
  const intelligence = clientStateReadLearnerIntelligence(state);
  assert(intelligence.read.status === "success" && intelligence.read.store === CLIENT_LOCAL_STORE_KIND, "intelligence is local");
  assert(intelligence.read.source === "local", "intelligence source is local");
  passed.push("local learner state stays separate from server cache");

  const unsafe = clientCachePut(emptyClientServerCache(), {
    resource: "topics",
    data: { payload: { module: "geography-data" }, answer: "x" },
    classification: "public",
  });
  assert(unsafe.success === false, "unsafe projections are not cached");
  const protectedWrite = clientCachePut(emptyClientServerCache(), {
    resource: "topics",
    data: { id: "future-explanations" },
    classification: "protected",
  });
  assert(protectedWrite.success === false, "protected content is not cached");
  const accessWrite = clientCachePut(emptyClientServerCache(), {
    resource: "access",
    data: { allowed: true, reason: "entitled" },
    classification: "public",
  });
  assert(accessWrite.success === false, "access decisions are not a cacheable resource");
  assert(!isSafeClientCacheData({ password: "x" }), "secrets are not safe cache data");
  passed.push("cache rejects secrets, payload, and protected content");

  const offline = clientSetOnline(state, false);
  assert(offline.online === false, "client can go offline");
  const offlineTopic = clientStateReadTopic(offline, "geography/earths-rotation");
  assert(offlineTopic.read.status === "success" && offlineTopic.read.source === "cache", "offline public topic uses cache");
  const miss = clientStateReadTopic(offline, "geography/missing-offline");
  assert(miss.read.status === "error", "offline uncached topic is not invented");
  const offlineAccess = clientStateReadAccess(offline, {
    scope: "feature",
    targetId: "future-explanations",
    learnerId: LOCAL_LEARNER_ID,
  });
  assert(offlineAccess.read.status === "success" && offlineAccess.read.source === "policy", "offline protected uses fail-closed policy");
  if (offlineAccess.read.data) {
    assert(offlineAccess.read.data.allowed === false, "offline protected is not allowed");
  }
  const liveAccess = clientStateReadAccess(createClientState(true), {
    scope: "topic",
    targetId: "geography/earths-rotation",
  });
  assert(liveAccess.read.status === "success" && liveAccess.read.source === "server", "online access is live decideAccess");
  if (liveAccess.read.data) {
    assert(liveAccess.read.data.allowed === true && liveAccess.read.data.reason === "free", "public catalog stays free online");
  }
  const offlineAi = clientStateReadAi(offline, {
    ok: true,
    data: {
      requestId: "req/local",
      responseId: "res/local",
      status: "success",
      groundingState: "grounded",
      text: "secret",
      sources: [],
    },
  });
  assert(offlineAi.read.status === "error", "AI is not served from cache offline");
  const offlineIntel = clientStateReadLearnerIntelligence(offline);
  assert(offlineIntel.read.status === "success" && offlineIntel.read.source === "local", "local intelligence works offline");
  passed.push("offline reads use public cache and fail closed for protected/AI");

  const stateFiles = [
    "src/lib/client/cache.ts",
    "src/lib/client/local.ts",
    "src/lib/client/read-state.ts",
    "src/lib/client/session.ts",
  ];
  for (const path of stateFiles) {
    assert(existsSync(path), `${path} exists`);
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not import scoring`);
      assert(!specifier.includes("ai-providers"), `${path} does not import providers`);
      assert(!specifier.includes("/commerce"), `${path} does not import commerce`);
    }
    assert(!source.includes("localStorage"), `${path} does not persist`);
    assert(!source.includes("Date.now"), `${path} is deterministic`);
  }
  assert(!existsSync("src/app/api/v1/cache"), "no cache API");
  assert(!existsSync("src/android"), "no Android app");
  passed.push("state layer does not add APIs, persistence, or mobile apps");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase9c.ts");

if (executedFromCli) {
  const passed = await runPhase9cVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE9C_VERIFICATION: PASS");
}
