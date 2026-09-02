/**
 * AI experience application service. Provider-agnostic orchestration.
 * Transport (Server Action / Route Handler) stays thin.
 */

import { randomUUID } from "node:crypto";

import {
  answerWithGrounding,
  explainConcept,
  explainTopic,
} from "@/lib/ai-intelligence/index";
import type { AiProvider } from "@/lib/ai-intelligence/provider";
import type { LearnerTopicProgress } from "@/lib/learner-intelligence/types";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { LOCAL_LEARNER_ID } from "@/lib/learner/identity";
import type { AiExperienceRequest, AiExperienceResult, AiExperienceSource } from "./types";

function failure(code: string, message: string): AiExperienceResult {
  return { ok: false, error: { code, message } };
}

function isPlatformHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function toSources(
  grounding: readonly {
    sourceId: string;
    sourceKind: string;
    title: string;
    href?: string;
    contentVersion?: number;
  }[],
): AiExperienceSource[] {
  const sources: AiExperienceSource[] = [];
  const seen = new Set<string>();
  for (const item of grounding) {
    if (seen.has(item.sourceId)) continue;
    seen.add(item.sourceId);
    const source: AiExperienceSource = {
      id: item.sourceId,
      kind: item.sourceKind,
      title: item.title,
    };
    if (item.href && isPlatformHref(item.href)) source.href = item.href;
    if (item.contentVersion !== undefined) source.contentVersion = item.contentVersion;
    sources.push(source);
  }
  return sources;
}

function publicFailure(code: string): AiExperienceResult {
  if (code === "provider_failure") {
    return failure(
      "provider_unavailable",
      "AI service is temporarily unavailable.",
    );
  }
  if (code === "invalid_request" || code === "validation_failure") {
    return failure(code, "The question could not be processed. Check the question and try again.");
  }
  if (code === "blocked") {
    return failure("blocked", "This question could not be answered with the current knowledge context.");
  }
  return failure("server_error", "The grounded answer could not be completed.");
}

function topicProgressFromRequest(request: AiExperienceRequest): LearnerTopicProgress | undefined {
  if (!request.learner) return undefined;
  return {
    learnerId: LOCAL_LEARNER_ID,
    topicId: request.learner.topicId,
    assessmentsCompleted: 0,
    questionsAnswered: request.learner.questionsAnswered,
    questionsCorrect: 0,
    questionsIncorrect: 0,
    questionsUnanswered: 0,
    score: 0,
    percentage: request.learner.percentage,
    lastActivityAt: "1970-01-01T00:00:00.000Z",
    performanceState: request.learner.performanceState,
    isCompleted: request.learner.isCompleted,
  };
}

export async function handleAiExperienceRequest(
  request: AiExperienceRequest,
  provider: AiProvider,
): Promise<AiExperienceResult> {
  if (request.intent === "explain-assessment") {
    return failure(
      "validation_failure",
      "Assessment explanation is not available from this form. Client-supplied assessment results are not accepted.",
    );
  }

  const requestId = `ai-request/${randomUUID()}`;
  const topicProgress = topicProgressFromRequest(request);

  const answered =
    request.intent === "explain-topic" && request.topicId
      ? await explainTopic(
          {
            requestId,
            topicId: request.topicId,
            text: request.text,
            style: request.style,
            topicProgress,
          },
          provider,
        )
      : request.intent === "explain-concept" && request.conceptId
        ? await explainConcept(
            {
              requestId,
              conceptId: request.conceptId,
              text: request.text,
              style: request.style,
            },
            provider,
          )
        : await answerWithGrounding(
            {
              requestId,
              intent: request.intent,
              text: request.text,
              query: request.topicId
                ? (getCanonicalTopic(request.topicId)?.title ?? request.text)
                : request.text,
              style: request.style,
              topicProgress,
            },
            provider,
          );

  if (!answered.ok) {
    return publicFailure(answered.error.code);
  }

  return {
    ok: true,
    data: {
      requestId: answered.data.requestId,
      responseId: answered.data.responseId,
      status: answered.data.status,
      groundingState: answered.data.groundingState,
      text: answered.data.output.text,
      sources: toSources(answered.data.grounding),
    },
  };
}
