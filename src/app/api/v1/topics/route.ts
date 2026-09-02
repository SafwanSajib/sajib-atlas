import { handlePlatformTopicsGet, platformMethodNotAllowed } from "@/lib/platform/http";

export function GET(request: Request): Response {
  return handlePlatformTopicsGet(request);
}

export function POST(): Response {
  return platformMethodNotAllowed();
}
