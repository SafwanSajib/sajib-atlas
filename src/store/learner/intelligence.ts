import type { LearnerState } from "./types";
import { contentManifest } from "@/lib/content/manifest";
import { isTopicCompleted } from "./completion";

export type TopicInsight = {
  topicSlug: string;
  attempted: number;
  correct: number;
  accuracy: number | null;
  status: "strong" | "developing" | "weak" | "insufficient-data";
};

export const MIN_EVIDENCE_THRESHOLD = 3;

export const calculateTopicInsight = (
  topicSlug: string,
  state: LearnerState
): TopicInsight => {
  const attempts = state.mcqResults.filter((r) => r.topicSlug === topicSlug);
  const attempted = attempts.length;
  const correct = attempts.filter((r) => r.correct).length;
  
  if (attempted < MIN_EVIDENCE_THRESHOLD) {
    return {
      topicSlug,
      attempted,
      correct,
      accuracy: attempted > 0 ? correct / attempted : null,
      status: "insufficient-data",
    };
  }

  const accuracy = correct / attempted;
  let status: TopicInsight["status"] = "developing";
  if (accuracy >= 0.8) {
    status = "strong";
  } else if (accuracy < 0.5) {
    status = "weak";
  }

  return {
    topicSlug,
    attempted,
    correct,
    accuracy,
    status,
  };
};

export type RevisionCandidate = {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  href: string;
  reason: string;
  priority: number;
};

export const calculateRevisionCandidates = (state: LearnerState): RevisionCandidate[] => {
  const candidates: RevisionCandidate[] = [];

  for (const item of contentManifest) {
    const insight = calculateTopicInsight(item.slug, state);
    
    if (insight.status === "weak" && insight.attempted >= MIN_EVIDENCE_THRESHOLD) {
      candidates.push({
        topicId: item.id,
        topicSlug: item.slug,
        topicTitle: item.title,
        href: item.href,
        reason: `Low quiz accuracy (${Math.round(insight.accuracy! * 100)}%)`,
        priority: 1,
      });
    }
  }

  return candidates.sort((a, b) => b.priority - a.priority);
};

export type NextAction = {
  text: string;
  link: string;
  type: "review" | "continue";
  reason?: string;
  topicTitle?: string;
};

export const suggestNextAction = (state: LearnerState): NextAction => {
  const revision = calculateRevisionCandidates(state);
  if (revision.length > 0) {
    return {
      text: `Review ${revision[0].topicTitle}`,
      link: revision[0].href,
      type: "review",
      reason: revision[0].reason,
      topicTitle: revision[0].topicTitle
    };
  }

  const nextUncompleted = contentManifest.find(
    (item) => item.contentStatus === "available" && !isTopicCompleted(state, item),
  );
  if (nextUncompleted) {
    return {
      text: `Learn ${nextUncompleted.title}`,
      link: nextUncompleted.href,
      type: "continue",
    };
  }

  return {
    text: "Explore Subjects",
    link: "/explore",
    type: "continue",
  };
};

