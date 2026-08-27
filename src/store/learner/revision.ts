import { LearnerState } from "./types";
import { curriculumRegistry, ContentStatus } from "@/lib/curriculum-registry";
import { calculateTopicInsight, MIN_EVIDENCE_THRESHOLD } from "./intelligence";

export type RevisionItem = {
  topicSlug: string;
  topicTitle: string;
  subject: string;
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  attempted: number;
  correct: number;
  accuracy: number;
  status: "available";
};

export const calculateRevisionQueue = (state: LearnerState): RevisionItem[] => {
  const revisionItems: RevisionItem[] = [];

  for (const item of curriculumRegistry) {
    if (item.contentStatus !== "available") continue;

    const insight = calculateTopicInsight(item.slug, state);
    if (insight.attempted < MIN_EVIDENCE_THRESHOLD) continue;
    if (insight.accuracy === null) continue;

    const accuracy = insight.accuracy;
    
    // Priority Logic
    // 1. Weak topics (< 50% accuracy) get HIGH priority
    // 2. Developing topics (< 80% accuracy) get MEDIUM priority
    if (accuracy < 0.5) {
      revisionItems.push({
        topicSlug: item.slug,
        topicTitle: item.title,
        subject: item.subject,
        category: item.category,
        priority: "HIGH",
        reason: "Low quiz accuracy",
        attempted: insight.attempted,
        correct: insight.correct,
        accuracy: accuracy,
        status: "available",
      });
    } else if (accuracy < 0.8) {
      revisionItems.push({
        topicSlug: item.slug,
        topicTitle: item.title,
        subject: item.subject,
        category: item.category,
        priority: "MEDIUM",
        reason: "Developing understanding",
        attempted: insight.attempted,
        correct: insight.correct,
        accuracy: accuracy,
        status: "available",
      });
    }
  }

  // Sort: HIGH priority first, then tie-break by slug
  return revisionItems.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.topicSlug.localeCompare(b.topicSlug);
  });
};
