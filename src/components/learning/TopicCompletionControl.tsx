"use client";

import { requireCanonicalTopic } from "@/lib/content/manifest";
import { isTopicCompleted } from "@/store/learner/completion";
import { useLearner } from "@/store/learner/context";

export default function TopicCompletionControl({ topicSlug }: { topicSlug: string }) {
  const { state, markTopicComplete } = useLearner();
  const topic = requireCanonicalTopic(`geography/${topicSlug}`);
  const completed = isTopicCompleted(state, topic);

  return (
    <div className="topic-completion">
      {completed ? (
        <p className="topic-completion-done" role="status">
          Topic completed
        </p>
      ) : (
        <button
          type="button"
          className="button button-primary"
          onClick={() => markTopicComplete(topic.id)}
        >
          Mark topic complete
        </button>
      )}
    </div>
  );
}
