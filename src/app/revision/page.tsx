"use client";

import { useLearner } from "@/store/learner/context";
import { calculateRevisionQueue } from "@/store/learner/revision";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";

export default function RevisionPage() {
  const { state } = useLearner();
  const queue = calculateRevisionQueue(state);

  return (
    <main>
      <Navbar />
      <div className="section shell">
        <h1>Revision</h1>
        <p>Review the topics that need attention.</p>
        
        {queue.length === 0 ? (
          <p>Keep learning to build your revision queue.</p>
        ) : (
          <div className="revision-queue">
            {queue.map((item) => (
              <div key={item.topicSlug} className="intelligence-card">
                <h3>{item.topicTitle}</h3>
                <p><strong>Reason:</strong> {item.reason}</p>
                <p><strong>Accuracy:</strong> {Math.round(item.accuracy * 100)}%</p>
                <a href={`/${item.subject}/${item.topicSlug}`} className="button-primary">Review Topic</a>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
