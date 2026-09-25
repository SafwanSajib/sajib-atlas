import type { EditorialChange } from "@/lib/content-studio/editorial/types";

export default function EditorialHistoryPanel({ changes }: { changes: readonly EditorialChange[] }) {
  return (
    <section className="section">
      <h2>Change history</h2>
      {changes.length === 0 ? <p>No editorial changes yet.</p> : (
        <ul className="study-list">
          {changes.map((change, index) => (
            <li key={`${change.revision}-${change.path}-${index}`}>
              r{change.revision} · {change.at} · {change.path} · {change.previousValue} → {change.newValue}
              {change.reason ? ` · ${change.reason}` : ""}
              {change.actorLabel ? ` · ${change.actorLabel}` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
