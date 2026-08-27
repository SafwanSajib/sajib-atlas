import { MCQResult, LearnerState } from "./types";
import { curriculumRegistry, CurriculumItem } from "@/lib/curriculum-registry";

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
  topicSlug: string;
  topicTitle: string;
  reason: string;
  priority: number;
};

export const calculateRevisionCandidates = (state: LearnerState): RevisionCandidate[] => {
  const candidates: RevisionCandidate[] = [];

  for (const item of curriculumRegistry) {
    const insight = calculateTopicInsight(item.slug, state);
    
    if (insight.status === "weak" && insight.attempted >= MIN_EVIDENCE_THRESHOLD) {
      candidates.push({ 
        topicSlug: item.slug, 
        topicTitle: item.title,
        reason: `Low quiz accuracy (${Math.round(insight.accuracy! * 100)}%)`,
        priority: 1 
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
      link: `/${getSubjectFromSlug(revision[0].topicSlug)}/${revision[0].topicSlug}`,
      type: "review",
      reason: revision[0].reason,
      topicTitle: revision[0].topicTitle
    };
  }

  const nextUncompleted = curriculumRegistry.find(item => !state.completedTopics.includes(item.slug) && item.contentStatus === 'available');
  if (nextUncompleted) {
    return {
      text: `Learn ${nextUncompleted.title}`,
      link: `/${nextUncompleted.subject}/${nextUncompleted.slug}`,
      type: "continue",
    };
  }

  return {
    text: "Explore Subjects",
    link: "/explore",
    type: "continue",
  };
};

const getSubjectFromSlug = (slug: string) => curriculumRegistry.find(i => i.slug === slug)?.subject || 'geography';

