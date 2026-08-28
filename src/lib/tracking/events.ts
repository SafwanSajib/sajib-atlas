export type AnalyticsEvent =
  | { name: "topic_view"; topicSlug: string }
  | { name: "mcq_answer"; topicSlug: string; correct: boolean }
  | { name: "search"; query: string };
