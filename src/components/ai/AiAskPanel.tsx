"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import { askGroundedQuestion } from "@/lib/ai-experience/ask";
import type { AiExperienceResult } from "@/lib/ai-experience/types";
import { AI_ANSWER_STYLES, AI_INTENTS, type AiAnswerStyle, type AiIntent } from "@/lib/ai-intelligence/types";
import { deriveLearnerTopicProgress } from "@/lib/learner-intelligence/derive";
import { useLearner } from "@/store/learner/context";

function isPlatformHref(href: string | undefined): href is string {
  return Boolean(href && href.startsWith("/") && !href.startsWith("//"));
}

const INTENT_LABELS: Record<AiIntent, string> = {
  "knowledge-answer": "Ask about knowledge",
  "explain-topic": "Explain this topic",
  "explain-concept": "Explain this concept",
  "explain-assessment": "Explain an assessment",
};

const STYLE_LABELS: Record<AiAnswerStyle, string> = {
  concise: "Concise",
  standard: "Standard",
  detailed: "Detailed",
  "exam-focused": "Exam-focused",
};

const GROUNDING_LABELS = {
  grounded: "Grounded in Sajib Atlas knowledge",
  "weakly-grounded": "Limited matching knowledge",
  "insufficient-context": "Not enough matching knowledge",
} as const;

function ResultPanel({ result }: { result: AiExperienceResult }) {
  if (!result.ok) {
    return (
      <div className="ai-status ai-status-error" role="alert">
        <p className="eyebrow">Could not answer</p>
        <p>{result.error.message}</p>
      </div>
    );
  }

  const { data } = result;
  if (data.status === "insufficient_context" || data.groundingState === "insufficient-context") {
    return (
      <div className="ai-status ai-status-empty" role="status">
        <p className="eyebrow">{GROUNDING_LABELS["insufficient-context"]}</p>
        <p>
          {data.text ||
            "Sajib Atlas does not have enough matching knowledge to ground an answer. Try a more specific Geography topic such as Earth's Rotation."}
        </p>
        <p>
          Refine the question below, try a shorter topic title, or open a topic
          page and use Ask about this topic.
        </p>
        <p>
          <Link className="text-link" href="/geography">
            Choose a topic <span>↗</span>
          </Link>
        </p>
      </div>
    );
  }

  if (data.status === "failed" || data.status === "blocked") {
    return (
      <div className="ai-status ai-status-error" role="alert">
        <p className="eyebrow">Answer unavailable</p>
        <p>{data.text || "The grounded answer could not be completed."}</p>
      </div>
    );
  }

  return (
    <section className="ai-answer" aria-live="polite">
      <p className={`ai-grounding ai-grounding-${data.groundingState}`}>
        {GROUNDING_LABELS[data.groundingState]}
      </p>
      <div className="ai-answer-text">{data.text}</div>
      {data.sources.length > 0 ? (
        <div className="ai-sources">
          <h2>Sources</h2>
          <ul>
            {data.sources.map((source) => (
              <li key={source.id}>
                {isPlatformHref(source.href) ? (
                  <a href={source.href}>
                    <span className="ai-source-kind">{source.kind}</span>
                    {source.title}
                    {source.contentVersion !== undefined ? (
                      <span className="ai-source-version">v{source.contentVersion}</span>
                    ) : null}
                  </a>
                ) : (
                  <span>
                    <span className="ai-source-kind">{source.kind}</span>
                    {source.title}
                    {source.contentVersion !== undefined ? (
                      <span className="ai-source-version">v{source.contentVersion}</span>
                    ) : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type AiAskPanelProps = {
  available: boolean;
  topicId?: string;
  conceptId?: string;
  defaultIntent: AiIntent;
  defaultStyle: AiAnswerStyle;
};

export default function AiAskPanel({
  available,
  topicId,
  conceptId,
  defaultIntent,
  defaultStyle,
}: AiAskPanelProps) {
  const [result, formAction, pending] = useActionState(askGroundedQuestion, null);
  const { state } = useLearner();

  const resultRef = useRef<HTMLDivElement>(null);
  const intents = AI_INTENTS.filter((intent) => {
    if (intent === "explain-topic") return Boolean(topicId);
    if (intent === "explain-concept") return Boolean(conceptId);
    if (intent === "explain-assessment") return false;
    return true;
  });

  useEffect(() => {
    if (!pending && result) {
      resultRef.current?.focus();
    }
  }, [pending, result]);

  const learnerPayload = useMemo(() => {
    if (!topicId || !state.intelligence) return "";
    const progress = deriveLearnerTopicProgress(
      state.intelligence.assessments,
      topicId,
      state.intelligence.learnerId,
      state.completedTopics,
    );
    if (!progress) return "";
    return JSON.stringify({
      topicId: progress.topicId,
      performanceState: progress.performanceState,
      percentage: progress.percentage,
      questionsAnswered: progress.questionsAnswered,
      isCompleted: progress.isCompleted,
    });
  }, [topicId, state.intelligence, state.completedTopics]);

  if (!available) {
    return (
      <div className="ai-status ai-status-empty" role="status">
        <p className="eyebrow">AI unavailable</p>
        <p>Grounded answers are unavailable because the AI provider is not configured on this server.</p>
      </div>
    );
  }

  return (
    <div className="ai-panel">
      <form className="ai-form" action={formAction} aria-busy={pending}>
        {topicId ? <input type="hidden" name="topicId" value={topicId} /> : null}
        {conceptId ? <input type="hidden" name="conceptId" value={conceptId} /> : null}
        {learnerPayload ? <input type="hidden" name="learner" value={learnerPayload} /> : null}
        <label className="ai-field" htmlFor="ai-question">
          Question
          <textarea
            id="ai-question"
            name="text"
            rows={5}
            required
            maxLength={2000}
            placeholder="Example: Earth's Rotation"
            disabled={pending}
          />
        </label>
        <div className="ai-controls">
          <label className="ai-field" htmlFor="ai-intent">
            Question type
            <select id="ai-intent" name="intent" defaultValue={defaultIntent} disabled={pending}>
              {intents.map((intent) => (
                <option key={intent} value={intent}>
                  {INTENT_LABELS[intent]}
                </option>
              ))}
            </select>
          </label>
          <label className="ai-field" htmlFor="ai-style">
            Explanation style
            <select id="ai-style" name="style" defaultValue={defaultStyle} disabled={pending}>
              {AI_ANSWER_STYLES.map((style) => (
                <option key={style} value={style}>
                  {STYLE_LABELS[style]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Retrieving grounded answer…" : "Ask Sajib Atlas"}
        </button>
      </form>
      {pending ? (
        <p className="ai-status ai-status-pending" role="status" aria-live="polite">
          Searching canonical knowledge, then generating a grounded explanation.
        </p>
      ) : null}
      {result && !pending ? (
        <div ref={resultRef} tabIndex={-1} id="ai-result">
          <ResultPanel result={result} />
        </div>
      ) : null}
    </div>
  );
}
