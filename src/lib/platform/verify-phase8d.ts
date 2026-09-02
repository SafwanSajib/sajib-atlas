import { existsSync, readFileSync } from "node:fs";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import { SEARCH_DEFAULT_LIMIT, SEARCH_MAX_LIMIT } from "@/lib/search/types";
import { runPhase8cVerification } from "./verify-phase8c";
import { isPlatformReadEnvelope } from "./envelope";
import {
  handlePlatformCapabilitiesGet,
  handlePlatformIdentityGet,
  handlePlatformTopicsGet,
  parsePlatformHttpContext,
  platformHttpResponse,
  statusForPlatformError,
} from "./http";
import { resolvePlatformLimit } from "./page";
import { CURRENT_PLATFORM_API_CONTRACT_VERSION, PLATFORM_READ_ERROR_CODES } from "./types";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 8D verification failed: ${message}`);
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

function isEnvelope(body: Record<string, unknown>): boolean {
  return isPlatformReadEnvelope(body);
}

export async function runPhase8dVerification(): Promise<string[]> {
  const passed: string[] = [];

  const prior = await runPhase8cVerification();
  assert(prior.length > 0, "Phase 8C transport verifier still runs");
  passed.push("Phase 8C transport remains compatible");

  const v1 = await readJson(
    handlePlatformCapabilitiesGet(
      new Request("http://localhost/api/v1/capabilities", {
        headers: { "X-Platform-Contract-Version": "v1" },
      }),
    ),
  );
  assert(v1.status === 200 && v1.body.success === true, "v1 is served");
  assert(v1.body.contractVersion === CURRENT_PLATFORM_API_CONTRACT_VERSION, "response version is v1");
  const v2 = await readJson(
    handlePlatformCapabilitiesGet(
      new Request("http://localhost/api/v1/capabilities", {
        headers: { "X-Platform-Contract-Version": "v2" },
      }),
    ),
  );
  assert(v2.status === 400 && v2.body.success === false, "v2 is unsupported");
  const v2Error = v2.body.error as { code: string; message: string };
  assert(v2Error.code === "invalid_request", "unsupported version uses invalid_request");
  assert(v2Error.message === "unsupported contract version", "unsupported version message is standardized");
  const v9 = await readJson(
    handlePlatformIdentityGet(new Request("http://localhost/api/v1/identity?contractVersion=v9")),
  );
  assert(v9.status === 400 && v9.body.success === false, "unknown version is rejected");
  passed.push("API version handling serves v1 only");

  const ok = await readJson(handlePlatformIdentityGet(new Request("http://localhost/api/v1/identity")));
  assert(isEnvelope(ok.body), "success body is a platform envelope");
  assert(ok.body.success === true && "data" in ok.body && ok.body.contractVersion === "v1", "success envelope has version and data");
  const bad = await readJson(
    handlePlatformCapabilitiesGet(
      new Request("http://localhost/api/v1/capabilities", { headers: { "X-Platform-Client": "browser" } }),
    ),
  );
  assert(isEnvelope(bad.body), "error body is a platform envelope");
  assert(bad.body.success === false && typeof (bad.body.error as { code: string }).code === "string", "error envelope has code");
  for (const code of PLATFORM_READ_ERROR_CODES) {
    assert(typeof statusForPlatformError(code) === "number", `status exists for ${code}`);
  }
  const forced = platformHttpResponse({ nope: true } as never);
  const forcedBody = JSON.parse(await forced.text()) as Record<string, unknown>;
  assert(forcedBody.success === false, "non-envelope results are not sent");
  passed.push("request/response envelopes are validated");

  const malformedTopic = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?topicId=")),
  );
  assert(malformedTopic.status === 400 && malformedTopic.body.success === false, "empty topicId is malformed");
  const malformedTopicError = malformedTopic.body.error as { code: string; message: string };
  assert(malformedTopicError.code === "invalid_request", "empty topicId uses invalid_request");
  assert(malformedTopicError.message === "malformed request", "empty topicId uses malformed-request message");
  const malformedClientError = bad.body.error as { code: string; message: string };
  assert(malformedClientError.code === "invalid_request", "invalid client uses invalid_request");
  assert(malformedClientError.message === "malformed request", "invalid client uses malformed-request message");
  const badRequestId = await readJson(
    handlePlatformIdentityGet(
      new Request("http://localhost/api/v1/identity", { headers: { "X-Platform-Request-Id": "not-opaque" } }),
    ),
  );
  const badRequestIdError = badRequestId.body.error as { code: string; message: string };
  assert(badRequestId.status === 400 && badRequestIdError.message === "malformed request", "invalid requestId is malformed");
  const spoof = await readJson(
    handlePlatformIdentityGet(
      new Request("http://localhost/api/v1/identity", { headers: { "X-Platform-Learner": "user@example.com" } }),
    ),
  );
  assert(spoof.status === 400, "non-local learner claim is rejected");
  const spoofQuery = await readJson(
    handlePlatformIdentityGet(new Request("http://localhost/api/v1/identity?learnerId=device-1")),
  );
  assert(spoofQuery.status === 400, "non-local learner query is rejected");
  const unsupported = v2Error.message;
  assert(unsupported === "unsupported contract version", "unsupported-version error is standardized");
  passed.push("malformed-request and unsupported-version errors are standardized");

  assert(resolvePlatformLimit(null) === SEARCH_DEFAULT_LIMIT, "omitted limit uses search default");
  assert(resolvePlatformLimit("2") === 2, "explicit limit is kept");
  let limitThrew = false;
  try {
    resolvePlatformLimit(String(SEARCH_MAX_LIMIT + 1));
  } catch {
    limitThrew = true;
  }
  assert(limitThrew, "limit above max is rejected");
  const over = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?subjectId=geography&limit=101")),
  );
  assert(over.status === 422, "HTTP rejects limit above max");
  const numericCursor = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?subjectId=geography&cursor=25")),
  );
  assert(numericCursor.status === 422, "numeric cursor is rejected");
  const paged = await readJson(
    handlePlatformTopicsGet(new Request("http://localhost/api/v1/topics?subjectId=geography")),
  );
  const pagedData = paged.body.data as { items: unknown[]; limit: number };
  assert(paged.status === 200 && pagedData.limit === SEARCH_DEFAULT_LIMIT, "collections are capped by default limit");
  assert(pagedData.items.length <= SEARCH_DEFAULT_LIMIT, "page does not exceed default limit");
  passed.push("pagination limits are enforced");

  const identity = await readJson(handlePlatformIdentityGet(new Request("http://localhost/api/v1/identity")));
  const identityData = identity.body.data as { identity: { learnerId: string } };
  assert(identityData.identity.learnerId === LOCAL_LEARNER_ID, "canonical learner remains learner/local");
  const localClaim = await readJson(
    handlePlatformIdentityGet(
      new Request("http://localhost/api/v1/identity", { headers: { "X-Platform-Learner": LOCAL_LEARNER_ID } }),
    ),
  );
  assert(localClaim.status === 200 && localClaim.body.success === true, "canonical learner claim is accepted");
  const ctx = parsePlatformHttpContext(new Request("http://localhost/api/v1/identity"));
  assert(ctx.success && ctx.data.learnerId === "learner/local", "transport context is learner/local");
  passed.push("canonical learner identity is preserved");

  const httpSource = readFileSync("src/lib/platform/http.ts", "utf8");
  assert(httpSource.includes("decideAccess"), "topic transport uses entitlement access");
  assert(httpSource.includes("readTopic"), "topic lookup uses 1J readTopic");
  assert(!httpSource.includes("geography-data"), "transport does not import geography-data");
  assert(!httpSource.includes("isMcqAnswerCorrect"), "transport does not score");
  const imports = importedModules(httpSource);
  for (const specifier of imports) {
    assert(!specifier.includes("geography-data"), "no geography payload import");
    assert(!specifier.includes("assessment-engine/scoring"), "no scoring import");
    assert(!specifier.includes("ai-providers"), "no provider import");
  }
  passed.push("API transport does not duplicate domain logic");

  const publicTopic = await readJson(
    handlePlatformTopicsGet(
      new Request("http://localhost/api/v1/topics?topicId=geography/earths-rotation"),
    ),
  );
  assert(publicTopic.status === 200 && publicTopic.body.success === true, "public topic remains readable");
  const topicAccess = decideAccess(
    { scope: "topic", targetId: "geography/earths-rotation", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(topicAccess.allowed === true && topicAccess.reason === "free", "catalog topic stays free");
  const protectedAccess = decideAccess(
    { scope: "feature", targetId: "future-explanations", learnerId: LOCAL_LEARNER_ID },
    [],
  );
  assert(protectedAccess.allowed === false, "protected feature fails closed without entitlement");
  passed.push("public topics work; protected access fails closed");

  assert(existsSync("src/app/api/v1/topics/route.ts"), "topic route remains");
  assert(!existsSync("src/app/api/ai"), "no /api/ai");
  passed.push("Phase 8D does not add product or AI API routes");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-phase8d.ts");

if (executedFromCli) {
  const passed = await runPhase8dVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("PHASE8D_VERIFICATION: PASS");
}
