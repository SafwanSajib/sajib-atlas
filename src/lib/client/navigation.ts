/**
 * Navigation by canonical topic id. Not a second slug scheme.
 */

import { platformFailure, platformSuccess } from "@/lib/platform/envelope";
import type { PlatformReadResult } from "@/lib/platform/types";
import { clientReadTopic } from "./topics";
import type { ClientNavigationTarget } from "./types";

export function clientNavigateTopic(topicId: string): PlatformReadResult<ClientNavigationTarget> {
  const result = clientReadTopic(topicId);
  if (!result.success) return result;
  if (!result.data.topic.href) {
    return platformFailure("not_found", "topic href not found");
  }
  return platformSuccess({
    kind: "topic",
    topicId: result.data.topic.id,
    href: result.data.topic.href,
  });
}
