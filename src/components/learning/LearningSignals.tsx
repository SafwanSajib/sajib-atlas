"use client";

import { useLearner } from "@/store/learner/context";
import { calculateRevisionCandidates, suggestNextAction } from "@/store/learner/intelligence";

export default function LearningSignals() {
  const { state } = useLearner();
  
  const revision = calculateRevisionCandidates(state);
  const nextAction = suggestNextAction(state);

  return (
    <section className="section shell">
      <h3>Your Learning Signals</h3>
      
      <div className="intelligence-card highlight">
        <h4>Next Step</h4>
        <a href={nextAction.link} className="button-primary">{nextAction.text}</a>
        {nextAction.reason && <p className="mt-2 text-sm">{nextAction.reason}</p>}
      </div>

      {revision.length > 0 && (
        <div className="intelligence-card">
          <h4>Needs Review</h4>
          <ul>
            {revision.map(r => <li key={r.topicSlug}>{r.topicTitle} - {r.reason}</li>)}
          </ul>
        </div>
      )}
      
      {state.mcqResults.length === 0 && (
          <p>Keep learning to unlock personalized insights.</p>
      )}
    </section>
  );
}
