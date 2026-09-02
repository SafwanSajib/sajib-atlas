/**
 * Phase 9E — Mobile foundation integration gate.
 *
 * Audits 9A–9D. Does not add Android/iOS apps, auth, database, or product APIs.
 *
 * Web / future Android / future iOS
 *   → Shared client layer
 *     → /api/v1
 *       → Platform contracts
 *         → Existing domain engines
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describeLocalToAuthenticatedMigration } from "@/lib/identity/migration";
import { FORBIDDEN_PUBLIC_IDENTITY_FIELDS, LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { decideAccess } from "@/lib/entitlement/access";
import { FORBIDDEN_PLATFORM_FIELDS, PLATFORM_CLIENT_SURFACES } from "@/lib/platform/types";
import { runPhase8Verification } from "@/lib/platform/verify-phase8";
import { clientReadAi } from "./ai";
import { clientReadAssessment } from "./assessment";
import { clientCachePut, emptyClientServerCache } from "./cache";
import { clientExecuteRequest } from "./http";
import { clientReadLearnerIntelligence } from "./intelligence";
import { createClientRequest, createClientRequestHeaders } from "./request";
import { clientSearch } from "./search";
import { clientSetOnline, clientStateReadAccess, clientStateReadTopic, createClientState } from "./session";
import { clientReadTopic } from "./topics";
import { CLIENT_LOCAL_STORE_KIND, CLIENT_SERVER_CACHE_KIND } from "./types";
import { WEB_CLIENT_SURFACE, createWebClientState, projectWebLearnerToClient } from "./web";
import { runPhase9dVerification } from "./verify-phase9d";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 9 verification failed: ${message}`);
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

function runtimeFiles(dir: string): string[] {
  return listFiles(dir).filter(
    (path) => path.endsWith(".ts") && !path.includes("verify-") && !path.endsWith(".d.ts"),
  );
}

export async function runPhase9Verification(): Promise<string[]> {
  const passed: string[] = [];

  const eight = await runPhase8Verification();
  assert(eight.length > 0, "Phase 8 platform gate still runs");
  passed.push("Phase 8 /api/v1 platform foundation remains green");

  const nineD = await runPhase9dVerification();
  assert(nineD.length > 0, "Phase 9D Web gate still runs");
  passed.push("Phase 9A–9D client architecture remains green");

  assert(PLATFORM_CLIENT_SURFACES.includes("web"), "web is a client surface");
  assert(PLATFORM_CLIENT_SURFACES.includes("android"), "android is a client surface");
  assert(PLATFORM_CLIENT_SURFACES.includes("ios"), "ios is a client surface");
  const topicUrl = "http://localhost/api/v1/topics?topicId=geography/earths-rotation";
  const webReq = createClientRequest({ surface: "web", url: topicUrl });
  const androidReq = createClientRequest({ surface: "android", url: topicUrl });
  const iosReq = createClientRequest({ surface: "ios", url: topicUrl });
  const web = await clientExecuteRequest(webReq);
  const android = await clientExecuteRequest(androidReq);
  const ios = await clientExecuteRequest(iosReq);
  assert(web.success && android.success && ios.success, "web/android/ios all read topics over /api/v1");
  if (web.success && android.success && ios.success) {
    const webId = (web.data as { topic: { id: string } }).topic.id;
    const androidId = (android.data as { topic: { id: string } }).topic.id;
    const iosId = (ios.data as { topic: { id: string } }).topic.id;
    assert(webId === androidId && androidId === iosId, "all surfaces receive the same canonical topic id");
    assert(web.contractVersion === android.contractVersion && android.contractVersion === ios.contractVersion, "envelope version is shared");
  }
  const androidHeaders = createClientRequestHeaders({ surface: "android" });
  const iosHeaders = createClientRequestHeaders({ surface: "ios" });
  assert(androidHeaders["X-Platform-Client"] === "android", "android names its surface");
  assert(iosHeaders["X-Platform-Client"] === "ios", "ios names its surface");
  assert(androidHeaders["X-Platform-Contract-Version"] === "v1", "android uses v1");
  assert(iosHeaders["X-Platform-Learner"] === undefined, "android/ios do not send learner spoof headers");
  assert(WEB_CLIENT_SURFACE === "web", "web helper is surface-specific");
  const requestSource = readFileSync("src/lib/client/request.ts", "utf8");
  assert(!requestSource.includes("android-only"), "shared request builder is not android-specific");
  passed.push("shared client contracts are platform-neutral");

  const identity = await clientExecuteRequest(
    createClientRequest({ surface: "android", url: "http://localhost/api/v1/identity" }),
  );
  assert(identity.success === true, "android identity GET succeeds");
  if (identity.success) {
    const data = identity.data as { identity: { learnerId: string; mode: string } };
    assert(data.identity.learnerId === LOCAL_LEARNER_ID, "canonical learner is learner/local");
    assert(data.identity.mode === "local", "active identity mode is local");
  }
  passed.push("canonical learner/local identity is preserved");

  const projected = projectWebLearnerToClient({ completedTopics: ["geography/earths-rotation"] });
  let state = createClientState(true);
  const liveTopic = clientStateReadTopic(state, "geography/earths-rotation");
  state = liveTopic.state;
  assert(state.server.kind === CLIENT_SERVER_CACHE_KIND, "server cache is server-cache");
  assert(projected.kind === CLIENT_LOCAL_STORE_KIND, "local learner is local-learner");
  assert(!JSON.stringify(projected).includes("platform-cache/"), "local record is not the server cache");
  passed.push("server cache and local learner state remain separate");

  const offline = clientSetOnline(state, false);
  const cached = clientStateReadTopic(offline, "geography/earths-rotation");
  assert(cached.read.status === "success" && cached.read.source === "cache", "offline public catalog uses cache");
  const protectedOffline = clientStateReadAccess(offline, {
    scope: "feature",
    targetId: "future-explanations",
    learnerId: LOCAL_LEARNER_ID,
  });
  assert(protectedOffline.read.data?.allowed === false, "offline protected reads fail closed");
  passed.push("offline protected reads fail closed");

  const searchBar = readFileSync("src/components/navigation/SearchBar.tsx", "utf8");
  assert(searchBar.includes("@/lib/client/web"), "Web search uses the web client boundary");
  const geography = readFileSync("src/app/geography/[topic]/page.tsx", "utf8");
  assert(geography.includes("@/lib/geography-data"), "Geography study payload path is unchanged");
  assert(geography.includes("TopicStudyPage"), "Geography study page is unchanged");
  const webClient = createWebClientState(true);
  assert(webClient.online === true, "web state factory works");
  passed.push("Web integration preserves existing behavior");

  const topic = clientReadTopic("geography/earths-rotation");
  assert(topic.success === true, "Topic read stays on 1J compose");
  const assessment = clientReadAssessment("geography/earths-rotation/mcq-practice");
  assert(assessment.success === true && !("payload" in (assessment.success ? assessment.data : {})), "Assessment read is identity-only");
  const search = clientSearch("rotation");
  assert(search.success === true, "Search still delegates to the Search engine");
  const intelligence = clientReadLearnerIntelligence();
  assert(intelligence.success === true && intelligence.data.learnerId === LOCAL_LEARNER_ID, "Learner Intelligence stays local");
  const ai = clientReadAi({
    ok: false,
    error: { code: "invalid_request", message: "text is required" },
  });
  assert(ai.success === false, "AI maps at the client boundary");
  assert(existsSync("src/app/ai/ask/route.ts"), "/ai/ask remains the AI HTTP");
  assert(!existsSync("src/app/api/ai"), "no /api/ai");
  passed.push("Topic, Assessment, Search, Learner Intelligence, and AI boundaries remain intact");

  const publicAccess = decideAccess(
    { scope: "topic", targetId: "geography/earths-rotation", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(publicAccess.allowed === true && publicAccess.reason === "free", "public catalog stays free");
  const liveProtected = clientStateReadAccess(createClientState(true), {
    scope: "feature",
    targetId: "future-explanations",
  });
  assert(liveProtected.read.data?.allowed === false, "protected features fail closed online");
  passed.push("Entitlement/Access remains authoritative");

  const uiFiles = [...listFiles("src/components"), ...listFiles("src/app")].filter(
    (path) => (path.endsWith(".ts") || path.endsWith(".tsx")) && !path.includes("/api/"),
  );
  for (const path of uiFiles) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/commerce/"), `${path} cannot authorize via commerce`);
      assert(!specifier.includes("entitlement/access"), `${path} is not access authority`);
      assert(!specifier.includes("entitlement/grant"), `${path} is not grant authority`);
    }
  }
  const accessWrite = clientCachePut(emptyClientServerCache(), {
    resource: "access",
    data: { allowed: true, reason: "entitled" },
    classification: "public",
  });
  assert(accessWrite.success === false, "access decisions are not cacheable grants");
  passed.push("Commerce/payment cannot authorize client access");

  for (const path of runtimeFiles("src/lib/client")) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not copy scoring`);
      assert(!specifier.includes("/commerce"), `${path} does not import commerce`);
      assert(!specifier.includes("ai-providers"), `${path} does not import AI providers`);
    }
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not score`);
    assert(!source.includes("localStorage"), `${path} does not persist`);
  }
  passed.push("no duplicated domain logic in the shared client layer");

  if (liveTopic.read.data) {
    for (const field of [...FORBIDDEN_PLATFORM_FIELDS, ...FORBIDDEN_PUBLIC_IDENTITY_FIELDS]) {
      assert(!collectKeys(liveTopic.read.data).has(field), `topic projection has no ${field}`);
    }
  }
  if (identity.success) {
    for (const field of FORBIDDEN_PUBLIC_IDENTITY_FIELDS) {
      assert(!collectKeys(identity.data).has(field), `identity has no ${field}`);
    }
  }
  assert(!requestSource.toLowerCase().includes("authorization"), "client requests do not send Authorization yet");
  passed.push("no secrets cross the client boundary");

  const migration = describeLocalToAuthenticatedMigration({
    learnerId: "learner/a1b2c3d4e5f67890",
    mode: "authenticated",
    status: "active",
  });
  assert(migration.ok === true, "future authenticated identity is describable");
  if (migration.ok) {
    assert(migration.description.implemented === false, "auth migration is not implemented");
    assert(migration.description.copiesState === false, "migration does not copy state");
  }
  assert(requestSource.includes("X-Platform-Client"), "surface header remains the extension point");
  passed.push("future authentication can be added without architectural rewrite");

  assert(!existsSync("src/android") && !existsSync("android"), "no Android app");
  assert(!existsSync("src/ios") && !existsSync("ios"), "no iOS app");
  assert(!existsSync("src/app/api/v1/search"), "no extra product APIs");
  passed.push("Android/iOS can consume the same contracts without shipping apps");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase9.ts");

if (executedFromCli) {
  const passed = await runPhase9Verification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE9_VERIFICATION: PASS");
}
