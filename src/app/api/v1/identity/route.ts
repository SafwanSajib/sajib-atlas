import { handlePlatformIdentityGet, platformMethodNotAllowed } from "@/lib/platform/http";

export function GET(request: Request): Response {
  return handlePlatformIdentityGet(request);
}

export function POST(): Response {
  return platformMethodNotAllowed();
}
