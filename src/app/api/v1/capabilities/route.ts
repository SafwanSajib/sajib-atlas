import { handlePlatformCapabilitiesGet, platformMethodNotAllowed } from "@/lib/platform/http";

export function GET(request: Request): Response {
  return handlePlatformCapabilitiesGet(request);
}

export function POST(): Response {
  return platformMethodNotAllowed();
}
