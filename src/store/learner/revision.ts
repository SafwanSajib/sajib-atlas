import type { LearnerState } from "./types";
import { contentManifest } from "@/lib/content/manifest";
import { calculateTopicInsight, MIN_EVIDENCE_THRESHOLD } from "./intelligence";

export type RevisionItem = {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  subject: string;
  category: string;
  href: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  attempted: number;
  correct: number;
  accuracy: number;
  status: "available";
};

export const calculateRevisionQueue = (state: LearnerState): RevisionItem[] => {
  const revisionItems: RevisionItem[] = [];
  const seen = new Set<string>();

  for (const item of contentManifest) {
    if (item.contentStatus !== "available") continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    const insight = calculateTopicInsight(item.slug, state);
    if (insight.attempted < MIN_EVIDENCE_THRESHOLD) continue;
    if (insight.accuracy === null) continue;

    const accuracy = insight.accuracy;
    
    // Priority Logic
    // 1. Weak topics (< 50% accuracy) get HIGH priority
    // 2. Developing topics (< 80% accuracy) get MEDIUM priority
    // Completion is a study-progress flag. Revision remains accuracy-based
    // and does not drop completed topics (existing queue semantics).
    if (accuracy < 0.5) {
      revisionItems.push({
        topicId: item.id,
        topicSlug: item.slug,
        topicTitle: item.title,
        subject: item.subject,
        category: item.category,
        href: item.href,
        priority: "HIGH",
        reason: "Low quiz accuracy",
        attempted: insight.attempted,
        correct: insight.correct,
        accuracy: accuracy,
        status: "available",
      });
    } else if (accuracy < 0.8) {
      revisionItems.push({
        topicId: item.id,
        topicSlug: item.slug,
        topicTitle: item.title,
        subject: item.subject,
        category: item.category,
        href: item.href,
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
