/**
 * Phase 9D — Web client integration gate.
 *
 * Audits Web against 9B/9C. Does not add Android/iOS, auth, or product APIs.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GET as getTopics } from "@/app/api/v1/topics/route";
import { deliverMcqAssessment } from "@/lib/assessment-engine/delivery";
import { getAssessmentSet } from "@/lib/assessment/sets";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { searchTopics } from "@/lib/search-data";
import { clientReadAi } from "./ai";
import { clientReadAssessment } from "./assessment";
import { clientExecuteRequest } from "./http";
import { CLIENT_LOCAL_STORE_KIND, CLIENT_SERVER_CACHE_KIND } from "./types";
import {
  applyWebLearnerToClientState,
  createWebClientHeaders,
  createWebClientRequest,
  createWebClientState,
  projectWebLearnerToClient,
  WEB_CLIENT_SURFACE,
  webSearchTopics,
} from "./web";
import { clientSetOnline, clientStateReadAccess, clientStateReadTopic } from "./session";
import { runPhase9cVerification } from "./verify-phase9c";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 9D verification failed: ${message}`);
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

const WEB_PAGES = [
  "src/app/page.tsx",
  "src/app/about/page.tsx",
  "src/app/ai/page.tsx",
  "src/app/bcs/page.tsx",
  "src/app/bcs/[topic]/page.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/english/page.tsx",
  "src/app/english/[topic]/page.tsx",
  "src/app/explore/page.tsx",
  "src/app/geography/page.tsx",
  "src/app/geography/[topic]/page.tsx",
  "src/app/international-affairs/page.tsx",
  "src/app/research/page.tsx",
  "src/app/revision/page.tsx",
] as const;

export async function runPhase9dVerification(): Promise<string[]> {
  const passed: string[] = [];

  const prior = await runPhase9cVerification();
  assert(prior.length > 0, "Phase 9C state verifier still runs");
  passed.push("Phase 9B/9C client architecture remains compatible");

  for (const path of WEB_PAGES) {
    assert(existsSync(path), `${path} exists`);
  }
  assert(existsSync("src/app/layout.tsx"), "root layout exists");
  assert(existsSync("src/app/ai/ask/route.ts"), "POST /ai/ask exists");
  passed.push("existing Web routes still exist");

  assert(existsSync("src/lib/client/web.ts"), "web client boundary exists");
  const headers = createWebClientHeaders();
  assert(headers["X-Platform-Client"] === WEB_CLIENT_SURFACE, "web surface is web");
  assert(headers["X-Platform-Contract-Version"] === "v1", "web requests are v1");
  assert(headers["X-Platform-Learner"] === undefined, "web does not spoof learner");
  const identity = await clientExecuteRequest(
    createWebClientRequest("http://localhost/api/v1/identity"),
  );
  assert(identity.success === true, "web identity request uses /api/v1");
  if (identity.success) {
    const data = identity.data as { identity: { learnerId: string } };
    assert(data.identity.learnerId === LOCAL_LEARNER_ID, "web identity is learner/local");
  }
  const searchBar = readFileSync("src/components/navigation/SearchBar.tsx", "utf8");
  assert(searchBar.includes("@/lib/client/web"), "SearchBar uses the web client boundary");
  const webSource = readFileSync("src/lib/client/web.ts", "utf8");
  assert(webSource.includes("@/lib/search-data"), "web search still delegates to search-data");
  passed.push("src/lib/client/ is the Web client boundary");

  const topicRoute = readFileSync("src/app/api/v1/topics/route.ts", "utf8");
  assert(topicRoute.includes("@/lib/platform/http"), "topics route stays thin transport");
  const routed = await getTopics(
    new Request("http://localhost/api/v1/topics?topicId=geography/earths-rotation"),
  );
  assert(routed.status === 200, "GET /api/v1/topics still succeeds");
  assert(!existsSync("src/app/api/v1/search"), "no /api/v1/search");
  assert(!existsSync("src/app/api/ai"), "no /api/ai");
  passed.push("/api/v1 remains the transport boundary");

  const projected = projectWebLearnerToClient({
    completedTopics: ["geography/earths-rotation"],
  });
  assert(projected.learnerId === LOCAL_LEARNER_ID, "web local projection is learner/local");
  assert(projected.kind === CLIENT_LOCAL_STORE_KIND, "web learner projection is local-learner");
  passed.push("canonical learner/local identity is preserved");

  let state = createWebClientState(true);
  const onlineTopic = clientStateReadTopic(state, "geography/earths-rotation");
  state = applyWebLearnerToClientState(onlineTopic.state, {
    completedTopics: ["geography/earths-rotation"],
  });
  assert(state.server.kind === CLIENT_SERVER_CACHE_KIND, "server cache kind holds");
  assert(state.local.kind === CLIENT_LOCAL_STORE_KIND, "local learner kind holds");
  assert(JSON.stringify(state.local).includes("geography/earths-rotation"), "local completion is local");
  assert(!JSON.stringify(state.local).includes("platform-cache/"), "local store is not server cache");
  passed.push("server cache and local learner state remain separate");

  const offline = clientSetOnline(state, false);
  const cachedTopic = clientStateReadTopic(offline, "geography/earths-rotation");
  assert(cachedTopic.read.status === "success" && cachedTopic.read.source === "cache", "offline public topic uses cache");
  const protectedOffline = clientStateReadAccess(offline, {
    scope: "feature",
    targetId: "future-explanations",
    learnerId: LOCAL_LEARNER_ID,
  });
  assert(protectedOffline.read.status === "success", "offline protected access is a decision");
  if (protectedOffline.read.data) {
    assert(protectedOffline.read.data.allowed === false, "offline protected content fails closed");
  }
  passed.push("offline reads fail closed for protected content");

  const geographyPage = readFileSync("src/app/geography/[topic]/page.tsx", "utf8");
  assert(geographyPage.includes("@/lib/geography-data"), "Geography payload path is unchanged");
  assert(geographyPage.includes("TopicStudyPage"), "Geography study page is unchanged");
  const mcq = readFileSync("src/components/assessment/MCQPractice.tsx", "utf8");
  assert(mcq.includes("@/lib/assessment/scoring"), "Web MCQ still uses existing scoring");
  assert(webSearchTopics("rotation").length === searchTopics("rotation").length, "web search behavior is unchanged");
  const set = getAssessmentSet("geography/earths-rotation/mcq-practice");
  assert(set !== undefined, "assessment set remains");
  const delivered = deliverMcqAssessment({ assessmentSetId: set.id, contentVersion: 1 });
  assert(delivered.ok === true, "Assessment Engine delivery is unchanged");
  const assessmentRead = clientReadAssessment("geography/earths-rotation/mcq-practice");
  assert(assessmentRead.success === true, "client assessment read is identity-only");
  if (assessmentRead.success) {
    assert(!("payload" in assessmentRead.data), "client assessment omits payload");
  }
  const ask = readFileSync("src/lib/ai-experience/ask.ts", "utf8");
  assert(ask.includes("handleAiExperienceRequest"), "AI experience path is unchanged");
  const mapped = clientReadAi({
    ok: false,
    error: { code: "invalid_request", message: "text is required" },
  });
  assert(mapped.success === false, "AI maps through the client envelope without replacing /ai/ask");
  const signals = readFileSync("src/components/learning/LearningSignals.tsx", "utf8");
  assert(signals.includes("@/store/learner/"), "Web learner intelligence UI stays on the local store");
  passed.push("Topic, Assessment, Search, Learner Intelligence, and AI behavior is preserved");

  const publicAccess = decideAccess(
    { scope: "topic", targetId: "geography/earths-rotation", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(publicAccess.allowed === true && publicAccess.reason === "free", "public catalog stays free");
  const liveAccess = clientStateReadAccess(createWebClientState(true), {
    scope: "feature",
    targetId: "future-explanations",
  });
  if (liveAccess.read.data) {
    assert(liveAccess.read.data.allowed === false, "protected features still fail closed online");
  }
  passed.push("Entitlement/Access remains authoritative");

  const uiFiles = [...listFiles("src/components"), ...listFiles("src/app")].filter(
    (path) => (path.endsWith(".ts") || path.endsWith(".tsx")) && !path.includes("/api/"),
  );
  for (const path of uiFiles) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/commerce/"), `${path} is not commerce authorization`);
      assert(!specifier.includes("entitlement/access"), `${path} is not access authority`);
      assert(!specifier.includes("entitlement/grant"), `${path} is not grant authority`);
      assert(!specifier.includes("platform/http"), `${path} does not call platform HTTP`);
    }
  }
  passed.push("Commerce/payment never enters client authorization");

  const clientRuntime = listFiles("src/lib/client").filter(
    (path) => path.endsWith(".ts") && !path.includes("verify-"),
  );
  for (const path of clientRuntime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not copy scoring`);
      assert(!specifier.includes("/commerce"), `${path} does not import commerce`);
      assert(!specifier.includes("ai-providers"), `${path} does not import AI providers`);
    }
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not score`);
  }
  passed.push("no duplicated domain logic in the client boundary");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase9d.ts");

if (executedFromCli) {
  const passed = await runPhase9dVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE9D_VERIFICATION: PASS");
}
