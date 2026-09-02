import { existsSync, readFileSync } from "node:fs";
import { GET as getCapabilities, POST as postCapabilities } from "@/app/api/v1/capabilities/route";
import { GET as getIdentity } from "@/app/api/v1/identity/route";
import { GET as getTopics } from "@/app/api/v1/topics/route";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import {
  handlePlatformCapabilitiesGet,
  handlePlatformIdentityGet,
  handlePlatformTopicsGet,
  parsePlatformHttpContext,
  statusForPlatformError,
} from "./http";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 8C verification failed: ${message}`);
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

async function readJson(response: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  const body = JSON.parse(await response.text()) as Record<string, unknown>;
  return { status: response.status, body };
}

export async function runPhase8cVerification(): Promise<string[]> {
  const passed: string[] = [];

  assert(existsSync("src/app/api/v1/capabilities/route.ts"), "capabilities route exists");
  assert(existsSync("src/app/api/v1/identity/route.ts"), "identity route exists");
  assert(existsSync("src/app/api/v1/topics/route.ts"), "topics route exists");
  assert(!existsSync("src/app/api/ai"), "no /api/ai");
  assert(!existsSync("src/app/api/v1/ai"), "no /api/v1/ai");
  assert(!existsSync("src/app/api/auth"), "no /api/auth");
  assert(!existsSync("src/app/api/checkout"), "no /api/checkout");
  passed.push("versioned /api/v1 transport exists without AI/auth/checkout routes");

  const capReq = new Request("http://localhost/api/v1/capabilities", {
    headers: { "X-Platform-Client": "web" },
  });
  const cap = await readJson(handlePlatformCapabilitiesGet(capReq));
  assert(cap.status === 200 && cap.body.success === true, "capabilities GET succeeds");
  const capData = cap.body.data as Record<string, unknown>;
  const capIdentity = capData.identity as Record<string, unknown>;
  assert(capIdentity.learnerId === "learner/local", "capabilities preserve learner/local");
  assert(capData.authentication === false, "capabilities report no authentication");
  assert(cap.body.contractVersion === "v1", "capabilities envelope is v1");
  passed.push("capabilities transport uses platform envelope and local identity");

  const idReq = new Request("http://localhost/api/v1/identity");
  const identity = await readJson(handlePlatformIdentityGet(idReq));
  assert(identity.status === 200 && identity.body.success === true, "identity GET succeeds");
  const identityData = identity.body.data as { identity: { learnerId: string } };
  assert(identityData.identity.learnerId === LOCAL_LEARNER_ID, "HTTP uses learner/local");
  const parsed = parsePlatformHttpContext(idReq);
  assert(parsed.success && parsed.data.learnerId === "learner/local", "context learner is always local");
  passed.push("identity transport is learner/local and not client-authoritative");

  const topicReq = new Request(
    "http://localhost/api/v1/topics?topicId=geography/earths-rotation",
  );
  const topic = await readJson(handlePlatformTopicsGet(topicReq));
  assert(topic.status === 200 && topic.body.success === true, "topic GET succeeds");
  const topicJson = JSON.stringify(topic.body);
  assert(!topicJson.includes("mcqPractice"), "topic transport does not embed Geography MCQ payload");
  assert(!topicJson.includes("payload"), "topic transport omits assessment payload pointers");
  const missing = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?topicId=geography/missing")),
  );
  assert(missing.status === 404 && missing.body.success === false, "unknown topic is 404");
  passed.push("topic transport delegates to 1J reads");

  const page = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?subjectId=geography&limit=2")),
  );
  assert(page.status === 200 && page.body.success === true, "paged topics succeed");
  const pageData = page.body.data as { items: unknown[]; limit: number; nextCursor?: string };
  assert(pageData.limit === 2 && pageData.items.length === 2, "limit is applied");
  assert(pageData.nextCursor === "cursor/continue", "overflow uses opaque cursor");
  const badLimit = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?limit=0")),
  );
  assert(badLimit.status === 422, "invalid limit is validation_failure");
  passed.push("pagination is applied at the transport boundary");

  const badClient = await readJson(
    handlePlatformCapabilitiesGet(
      new Request("http://localhost/api/v1/capabilities", {
        headers: { "X-Platform-Client": "browser" },
      }),
    ),
  );
  assert(badClient.status === 400 && badClient.body.success === false, "invalid client surface is 400");
  const posted = await readJson(postCapabilities());
  assert(posted.status === 405, "POST is method not allowed");
  assert(statusForPlatformError("not_found") === 404, "not_found maps to 404");
  assert(statusForPlatformError("invalid_request") === 400, "invalid_request maps to 400");
  assert(statusForPlatformError("validation_failure") === 422, "validation_failure maps to 422");
  passed.push("HTTP errors and methods are standardized");

  const routedCap = await readJson(getCapabilities(capReq));
  const routedId = await readJson(getIdentity(new Request("http://localhost/api/v1/identity")));
  const routedTopic = await readJson(getTopics(topicReq));
  assert(routedCap.status === 200 && routedId.status === 200 && routedTopic.status === 200, "App Router handlers delegate to transport");
  passed.push("App Router handlers are thin");

  const transportFiles = [
    "src/lib/platform/http.ts",
    "src/app/api/v1/capabilities/route.ts",
    "src/app/api/v1/identity/route.ts",
    "src/app/api/v1/topics/route.ts",
  ];
  for (const path of transportFiles) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import geography-data`);
      assert(!specifier.includes("assessment-engine/scoring"), `${path} does not import scoring`);
      assert(!specifier.includes("ai-providers"), `${path} does not import AI providers`);
      assert(!specifier.includes("learner-intelligence/ingest"), `${path} does not mutate intelligence`);
    }
    assert(!source.includes("isMcqAnswerCorrect"), `${path} does not score`);
    assert(!source.includes("localStorage"), `${path} has no storage`);
  }
  passed.push("HTTP transport contains no duplicated domain logic");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase8c.ts");

if (executedFromCli) {
  const passed = await runPhase8cVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE8C_VERIFICATION: PASS");
}
