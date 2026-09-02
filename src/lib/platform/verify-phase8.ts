/**
 * Phase 8E — Platform integration gate.
 *
 * Audits 8A–8D. Does not add product APIs, auth, database, or mobile apps.
 * Flow: Client → HTTP → Platform Contracts → Existing Domain Engines
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { deliverMcqAssessment } from "@/lib/assessment-engine/delivery";
import { getAssessmentSet } from "@/lib/assessment/sets";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { emptyLearnerIntelligenceState } from "@/lib/learner-intelligence/derive";
import { runPhase7Verification } from "@/lib/phase7/verify-phase7";
import { searchKnowledge } from "@/lib/search/retrieve";
import { SEARCH_DEFAULT_LIMIT, SEARCH_MAX_LIMIT } from "@/lib/search/types";
import { composeTopicCapabilityModelForTopicId } from "@/lib/topic-engine/capabilities";
import { resolveTopicById } from "@/lib/topic-engine/resolution";
import { TOPIC_CAPABILITY_KINDS } from "@/lib/topic-engine/types";
import { defaultPlatformCapabilities } from "./capabilities";
import { mapAiExperienceResult } from "./envelope";
import {
  handlePlatformCapabilitiesGet,
  handlePlatformIdentityGet,
  handlePlatformTopicsGet,
  parsePlatformHttpContext,
} from "./http";
import { resolvePlatformLimit } from "./page";
import {
  CURRENT_PLATFORM_API_CONTRACT_VERSION,
  FORBIDDEN_PLATFORM_FIELDS,
  PLATFORM_CLIENT_SURFACES,
  PLATFORM_READ_ERROR_CODES,
} from "./types";
import { runPhase8bVerification } from "./verify-phase8b";
import { runPhase8dVerification } from "./verify-phase8d";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 8 verification failed: ${message}`);
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

async function readJson(response: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  const body = JSON.parse(await response.text()) as Record<string, unknown>;
  return { status: response.status, body };
}

const PLATFORM_RUNTIME = [
  "src/lib/platform/types.ts",
  "src/lib/platform/envelope.ts",
  "src/lib/platform/client.ts",
  "src/lib/platform/context.ts",
  "src/lib/platform/errors.ts",
  "src/lib/platform/page.ts",
  "src/lib/platform/capabilities.ts",
  "src/lib/platform/http.ts",
  "src/lib/platform/index.ts",
];

const HTTP_ROUTES = [
  "src/app/api/v1/capabilities/route.ts",
  "src/app/api/v1/identity/route.ts",
  "src/app/api/v1/topics/route.ts",
];

export async function runPhase8Verification(): Promise<string[]> {
  const passed: string[] = [];

  const eightB = runPhase8bVerification();
  assert(eightB.length > 0, "Phase 8B verifier still runs");
  passed.push("Phase 8B platform contracts remain green");

  const eightD = await runPhase8dVerification();
  assert(eightD.length > 0, "Phase 8D verifier still runs");
  passed.push("Phase 8C/8D HTTP transport remains green");

  const seven = runPhase7Verification();
  assert(seven.length > 0, "Phase 7 integration gate still runs");
  passed.push("Phase 7 identity/entitlement/commerce gate remains green");

  const httpSource = readFileSync("src/lib/platform/http.ts", "utf8");
  const httpImports = importedModules(httpSource);
  assert(httpSource.includes("readTopic"), "HTTP topic lookup uses 1J readTopic");
  assert(httpSource.includes("readTopics"), "HTTP topic collection uses 1J readTopics");
  assert(httpSource.includes("composeDefaultIdentityReadResponse"), "HTTP identity uses 1J compose");
  assert(httpSource.includes("defaultPlatformCapabilities"), "HTTP capabilities use platform contract");
  assert(httpSource.includes("decideAccess"), "HTTP access uses entitlement decideAccess");
  for (const specifier of httpImports) {
    assert(!specifier.includes("topic-engine"), "HTTP does not import Topic Engine");
    assert(!specifier.includes("assessment-engine"), "HTTP does not import Assessment Engine");
    assert(!specifier.includes("learner-intelligence"), "HTTP does not import Learner Intelligence");
    assert(!specifier.includes("search/retrieve"), "HTTP does not import Search retrieve");
    assert(!specifier.includes("search/rank"), "HTTP does not import Search rank");
    assert(!specifier.includes("ai-providers"), "HTTP does not import AI providers");
    assert(!specifier.includes("ai-intelligence"), "HTTP does not import AI intelligence");
    assert(!specifier.includes("geography-data"), "HTTP does not import geography-data");
    assert(!specifier.includes("/commerce"), "HTTP does not import commerce");
  }
  for (const path of HTTP_ROUTES) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    assert(imports.length === 1 && imports[0] === "@/lib/platform/http", `${path} is a thin HTTP wrapper`);
  }
  passed.push("Client → HTTP → Platform Contracts → Domain Engines is the only API flow");

  const identity = await readJson(handlePlatformIdentityGet(new Request("http://localhost/api/v1/identity")));
  const identityData = identity.body.data as { identity: { learnerId: string; mode: string } };
  assert(identity.status === 200 && identityData.identity.learnerId === LOCAL_LEARNER_ID, "HTTP identity is learner/local");
  assert(identityData.identity.mode === "local", "identity mode is local");
  const ctx = parsePlatformHttpContext(new Request("http://localhost/api/v1/identity"));
  assert(ctx.success && ctx.data.learnerId === "learner/local", "request context learner is learner/local");
  const spoof = await readJson(
    handlePlatformIdentityGet(
      new Request("http://localhost/api/v1/identity", { headers: { "X-Platform-Learner": "user@example.com" } }),
    ),
  );
  assert(spoof.status === 400, "non-local learner claims are rejected");
  assert(PLATFORM_CLIENT_SURFACES.includes("web"), "web is a client surface");
  assert(!PLATFORM_CLIENT_SURFACES.includes("learner/local" as never), "client surface is not learner/local");
  passed.push("canonical learner/local identity is preserved");

  const engineTopic = resolveTopicById("geography/earths-rotation");
  assert(engineTopic !== undefined, "Topic Engine still resolves Earth's Rotation");
  assert(engineTopic.identity.id === "geography/earths-rotation", "Topic Engine id is canonical");
  const caps = composeTopicCapabilityModelForTopicId("geography/earths-rotation");
  assert(caps !== undefined, "Topic Engine still composes capabilities");
  assert(TOPIC_CAPABILITY_KINDS.includes("study"), "topic capability kinds stay in Topic Engine");
  const platformCaps = defaultPlatformCapabilities();
  assert(!("study" in platformCaps), "platform capabilities do not copy topic study");
  assert(!("concepts" in platformCaps), "platform capabilities do not copy topic concepts");
  const topicHttp = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?topicId=geography/earths-rotation")),
  );
  assert(topicHttp.status === 200 && topicHttp.body.success === true, "HTTP topic read still succeeds");
  const topicData = topicHttp.body.data as { topic: { id: string } };
  assert(topicData.topic.id === engineTopic.identity.id, "HTTP topic id matches Topic Engine identity");
  passed.push("Topic Engine remains the topic capability authority");

  const set = getAssessmentSet("geography/earths-rotation/mcq-practice");
  assert(set !== undefined, "canonical assessment set remains");
  const delivered = deliverMcqAssessment({
    assessmentSetId: set.id,
    contentVersion: 1,
  });
  assert(delivered.ok === true, "Assessment Engine still delivers public MCQ");
  if (delivered.ok) {
    const serialized = JSON.stringify(delivered.data);
    assert(!serialized.includes("correctIndex"), "delivery omits correctIndex");
    assert(!serialized.includes("correctAnswer"), "delivery omits correctAnswer");
  }
  assert(!httpSource.includes("isMcqAnswerCorrect"), "HTTP transport does not score");
  assert(!httpSource.includes("deliverMcqAssessment"), "HTTP transport does not deliver assessments");
  assert(platformCaps.assessmentContracts === true, "platform advertises assessment contracts only");
  const topicJson = JSON.stringify(topicHttp.body);
  assert(!topicJson.includes("mcqPractice"), "HTTP topic read does not embed MCQ payload");
  assert(!topicJson.includes('"payload"'), "HTTP topic read omits payload pointers");
  passed.push("Assessment Engine remains scoring/delivery authority");

  const intelligence = emptyLearnerIntelligenceState();
  assert(intelligence.learnerId === LOCAL_LEARNER_ID, "Learner Intelligence uses learner/local");
  assert(intelligence.assessments.length === 0, "empty intelligence snapshot is valid");
  assert(platformCaps.learnerIntelligence === true, "platform advertises learner intelligence");
  assert(!httpSource.includes("ingestAssessmentResult"), "HTTP does not ingest intelligence");
  passed.push("Learner Intelligence remains a domain engine, not an HTTP handler");

  const search = searchKnowledge("rotation");
  assert(search.ok === true, "Search engine still retrieves");
  if (search.ok) {
    assert(search.data.limit === SEARCH_DEFAULT_LIMIT, "Search default limit is unchanged");
    assert(search.data.results.length <= SEARCH_MAX_LIMIT, "Search results respect max");
  }
  assert(resolvePlatformLimit(null) === SEARCH_DEFAULT_LIMIT, "platform pagination reuses Search default");
  assert(resolvePlatformLimit("100") === SEARCH_MAX_LIMIT, "platform pagination reuses Search max");
  const over = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?subjectId=geography&limit=101")),
  );
  assert(over.status === 422, "HTTP rejects limit above Search max");
  passed.push("Search remains the retrieval authority; pagination reuses its limits");

  assert(existsSync("src/app/ai/ask/route.ts"), "AI experience remains POST /ai/ask");
  assert(!existsSync("src/app/api/ai"), "no competing /api/ai");
  assert(!existsSync("src/app/api/v1/ai"), "no /api/v1/ai");
  assert(platformCaps.aiAsk === true, "platform advertises AI ask");
  const aiMapped = mapAiExperienceResult({
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
  assert(aiMapped.success === true, "AI experience maps into the 1J envelope");
  passed.push("AI read integration maps at the platform boundary; /ai/ask is unchanged");

  const publicAccess = decideAccess(
    { scope: "topic", targetId: "geography/earths-rotation", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(publicAccess.allowed === true && publicAccess.reason === "free", "public catalog stays free");
  const protectedAccess = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(protectedAccess.allowed === false, "protected features fail closed");
  passed.push("Entitlement/access remains fail-closed through decideAccess");

  assert(platformCaps.commerce === "records-only", "commerce capability is records-only");
  assert(platformCaps.authentication === false, "authentication is not implemented");
  assert(platformCaps.persistence === "local", "persistence is local");
  const pkg = readFileSync("package.json", "utf8").toLowerCase();
  for (const mark of ["stripe", "sslcommerz", "paypal", "supabase", "prisma", "jsonwebtoken"]) {
    assert(!pkg.includes(mark), `package.json does not add ${mark}`);
  }
  assert(!existsSync("src/app/api/checkout"), "no checkout API");
  assert(!existsSync("src/app/api/payments"), "no payments API");
  assert(!existsSync("src/app/api/orders"), "no orders API");
  passed.push("Commerce/payment stay isolated from the API transport");

  const v1 = await readJson(
    handlePlatformCapabilitiesGet(
      new Request("http://localhost/api/v1/capabilities", {
        headers: { "X-Platform-Contract-Version": "v1" },
      }),
    ),
  );
  assert(v1.status === 200 && v1.body.contractVersion === CURRENT_PLATFORM_API_CONTRACT_VERSION, "current version is v1");
  const v2 = await readJson(
    handlePlatformCapabilitiesGet(
      new Request("http://localhost/api/v1/capabilities", {
        headers: { "X-Platform-Contract-Version": "v2" },
      }),
    ),
  );
  const v2Error = v2.body.error as { code: string; message: string };
  assert(v2.status === 400 && v2Error.code === "invalid_request", "unsupported version is invalid_request");
  assert(v2Error.message === "unsupported contract version", "unsupported version message is standardized");
  assert(PLATFORM_READ_ERROR_CODES.includes("invalid_request"), "invalid_request remains");
  assert(PLATFORM_READ_ERROR_CODES.includes("not_found"), "not_found remains");
  assert(PLATFORM_READ_ERROR_CODES.includes("validation_failure"), "validation_failure remains");
  passed.push("API versioning and errors stay on the Phase 1J contract");

  const page = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?subjectId=geography")),
  );
  const pageData = page.body.data as { items: unknown[]; limit: number };
  assert(page.status === 200 && pageData.limit === SEARCH_DEFAULT_LIMIT, "collection default limit is 25");
  assert(pageData.items.length <= SEARCH_DEFAULT_LIMIT, "collection does not exceed default limit");
  passed.push("pagination limits are enforced from Search contracts");

  const uiFiles = [...listFiles("src/components"), ...listFiles("src/app")].filter(
    (path) => (path.endsWith(".ts") || path.endsWith(".tsx")) && !path.includes("/api/"),
  );
  for (const path of uiFiles) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("platform/http"), `${path} does not call platform HTTP from UI`);
      assert(!specifier.includes("entitlement/access"), `${path} is not access authority`);
      assert(!specifier.includes("/commerce/"), `${path} is not commerce authority`);
    }
  }
  assert(!existsSync("src/android") && !existsSync("android"), "no Android app");
  assert(!existsSync("src/ios") && !existsSync("ios"), "no iOS app");
  passed.push("client/server boundary holds: thin routes, no mobile apps, UI is not authority");

  for (const path of PLATFORM_RUNTIME) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not import scoring`);
      assert(!specifier.includes("assessment-engine/session"), `${path} does not import sessions`);
      assert(!specifier.includes("learner-intelligence/ingest"), `${path} does not ingest intelligence`);
      assert(!specifier.includes("ai-providers"), `${path} does not import providers`);
    }
    if (path.endsWith("http.ts")) continue;
    assert(!source.includes("localStorage"), `${path} has no storage`);
  }
  for (const path of runtimeFiles("src/lib/topic-engine")) {
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      assert(!specifier.includes("/platform/"), `${path} is not a platform HTTP handler`);
    }
  }
  passed.push("platform transport does not duplicate domain/business logic");

  const capJson = JSON.stringify(platformCaps);
  const idJson = JSON.stringify(identity.body);
  for (const field of FORBIDDEN_PLATFORM_FIELDS) {
    assert(!collectKeys(platformCaps).has(field), `capabilities have no ${field}`);
    assert(!collectKeys(identity.body).has(field), `identity envelope has no ${field}`);
    assert(!capJson.toLowerCase().includes(field.toLowerCase()), `capabilities text has no ${field}`);
    assert(!idJson.toLowerCase().includes("password"), "identity has no password");
  }
  assert(!topicJson.includes("apiKey"), "topic envelope has no apiKey");
  passed.push("public platform payloads do not leak secrets, answers, or payloads");

  const geographyPage = readFileSync("src/app/geography/[topic]/page.tsx", "utf8");
  assert(geographyPage.includes("@/lib/geography-data"), "Geography route still uses geography-data");
  assert(geographyPage.includes("TopicStudyPage"), "Geography study page is unchanged");
  assert(existsSync("src/components/learning/TopicStudyPage.tsx"), "TopicStudyPage remains");
  assert(existsSync("src/components/assessment/MCQPractice.tsx"), "MCQ practice UI remains");
  const searchBar = readFileSync("src/components/navigation/SearchBar.tsx", "utf8");
  assert(existsSync("src/lib/search-data.ts"), "web search-data module remains");
  assert(
    searchBar.includes("@/lib/search-data") || searchBar.includes("@/lib/client/web"),
    "web search uses search-data or the web client boundary",
  );
  if (searchBar.includes("@/lib/client/web")) {
    const webClient = readFileSync("src/lib/client/web.ts", "utf8");
    assert(webClient.includes("@/lib/search-data"), "web client search still delegates to search-data");
  }
  assert(existsSync("src/app/ai/page.tsx"), "/ai page remains");
  passed.push("existing Web Geography/Topic/Search/AI experience remains in-process");

  const apiFiles = listFiles("src/app/api").filter((path) => path.endsWith("route.ts"));
  assert(apiFiles.length === HTTP_ROUTES.length, "no extra product API routes");
  for (const path of apiFiles) {
    assert(HTTP_ROUTES.includes(path), `${path} is an existing 8C route`);
  }
  passed.push("Phase 8E adds no product APIs, Android/iOS, auth, or database");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase8.ts");

if (executedFromCli) {
  const passed = await runPhase8Verification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE8_VERIFICATION: PASS");
}
