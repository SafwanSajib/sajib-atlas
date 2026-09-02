/**
 * HTTP transport for platform contracts (Phase 8C / 8D).
 *
 * Parses client headers, writes Phase 1J JSON envelopes, and calls existing
 * reads and access decisions. Does not score, search-rank, or invent grants.
 */

import {
  composeDefaultIdentityReadResponse,
  readTopic,
  readTopics,
} from "@/lib/contracts/compose";
import { CURRENT_PLATFORM_API_CONTRACT_VERSION } from "@/lib/contracts/api";
import { decideAccess } from "@/lib/entitlement/access";
import { LOCAL_LEARNER_ID } from "@/lib/identity/types";
import type { PlatformReadResult, PlatformRequestContext } from "./types";
import { defaultPlatformCapabilities } from "./capabilities";
import { validatePlatformRequestContext } from "./context";
import { isPlatformReadEnvelope, platformFailure, platformSuccess } from "./envelope";
import { createPlatformPage, resolvePlatformLimit, validatePlatformCursor } from "./page";

const MALFORMED_REQUEST = "malformed request";
const UNSUPPORTED_CONTRACT_VERSION = "unsupported contract version";

export function statusForPlatformError(code: string): number {
  if (code === "not_found") return 404;
  if (code === "validation_failure") return 422;
  return 400;
}

export function platformHttpResponse<T>(
  result: PlatformReadResult<T>,
  statusOverride?: number,
): Response {
  const envelope = isPlatformReadEnvelope(result)
    ? result
    : platformFailure("invalid_request", MALFORMED_REQUEST);
  const status = statusOverride ?? (envelope.success ? 200 : statusForPlatformError(envelope.error.code));
  return new Response(JSON.stringify(envelope), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Platform-Contract-Version": CURRENT_PLATFORM_API_CONTRACT_VERSION,
    },
  });
}

export function platformMethodNotAllowed(): Response {
  return platformHttpResponse(platformFailure("invalid_request", "Use GET."), 405);
}

function requestedContractVersion(request: Request): string {
  try {
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("contractVersion");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  } catch {
    return CURRENT_PLATFORM_API_CONTRACT_VERSION;
  }
  const fromHeader = request.headers.get("x-platform-contract-version");
  if (fromHeader && fromHeader.trim()) return fromHeader.trim();
  return CURRENT_PLATFORM_API_CONTRACT_VERSION;
}

function claimedLearnerId(request: Request): string | undefined {
  const header = request.headers.get("x-platform-learner");
  if (header && header.trim()) return header.trim();
  try {
    const query = new URL(request.url).searchParams.get("learnerId");
    if (query && query.trim()) return query.trim();
  } catch {
    return undefined;
  }
  return undefined;
}

export function parsePlatformHttpContext(request: Request): PlatformReadResult<PlatformRequestContext> {
  try {
    new URL(request.url);
  } catch {
    return platformFailure("invalid_request", MALFORMED_REQUEST);
  }
  const version = requestedContractVersion(request);
  if (version !== CURRENT_PLATFORM_API_CONTRACT_VERSION) {
    return platformFailure("invalid_request", UNSUPPORTED_CONTRACT_VERSION);
  }
  const claimed = claimedLearnerId(request);
  if (claimed !== undefined && claimed !== LOCAL_LEARNER_ID) {
    return platformFailure("invalid_request", "learnerId must be learner/local");
  }
  const surface = request.headers.get("x-platform-client") ?? "api";
  const requestIdHeader = request.headers.get("x-platform-request-id");
  const requestId = requestIdHeader && requestIdHeader.trim() ? requestIdHeader.trim() : undefined;
  try {
    const context = validatePlatformRequestContext({
      contractVersion: version,
      client: { surface },
      learnerId: LOCAL_LEARNER_ID,
      requestId,
    });
    return platformSuccess(context);
  } catch {
    return platformFailure("invalid_request", MALFORMED_REQUEST);
  }
}

function withContext<T>(
  request: Request,
  run: () => PlatformReadResult<T>,
): Response {
  const context = parsePlatformHttpContext(request);
  if (!context.success) return platformHttpResponse(context);
  return platformHttpResponse(run());
}

export function handlePlatformCapabilitiesGet(request: Request): Response {
  return withContext(request, () => platformSuccess(defaultPlatformCapabilities()));
}

export function handlePlatformIdentityGet(request: Request): Response {
  return withContext(request, () => platformSuccess(composeDefaultIdentityReadResponse()));
}

function topicAccessAllowed(topicId: string): boolean {
  return decideAccess(
    { scope: "topic", targetId: topicId, learnerId: LOCAL_LEARNER_ID },
    [],
  ).allowed;
}

export function handlePlatformTopicsGet(request: Request): Response {
  const context = parsePlatformHttpContext(request);
  if (!context.success) return platformHttpResponse(context);

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return platformHttpResponse(platformFailure("invalid_request", MALFORMED_REQUEST));
  }

  const topicId = url.searchParams.get("topicId") ?? undefined;
  if (topicId !== undefined) {
    if (!topicId.trim()) {
      return platformHttpResponse(platformFailure("invalid_request", MALFORMED_REQUEST));
    }
    const result = readTopic({ topicId });
    if (!result.success) return platformHttpResponse(result);
    if (!topicAccessAllowed(topicId.trim())) {
      return platformHttpResponse(platformFailure("invalid_request", "entitlement required"));
    }
    return platformHttpResponse(result);
  }

  const subjectId = url.searchParams.get("subjectId") ?? undefined;
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const collected = readTopics({
    ...(subjectId !== undefined ? { subjectId } : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
  });
  if (!collected.success) return platformHttpResponse(collected);

  const cursorRaw = url.searchParams.get("cursor");
  if (cursorRaw !== null) {
    try {
      validatePlatformCursor(cursorRaw);
    } catch {
      return platformHttpResponse(platformFailure("validation_failure", "invalid cursor"));
    }
  }

  try {
    const limit = resolvePlatformLimit(url.searchParams.get("limit"));
    const allowed = collected.data.items.filter((item) => topicAccessAllowed(item.id));
    return platformHttpResponse(platformSuccess(createPlatformPage(allowed, limit)));
  } catch {
    return platformHttpResponse(platformFailure("validation_failure", "invalid limit"));
  }
}
