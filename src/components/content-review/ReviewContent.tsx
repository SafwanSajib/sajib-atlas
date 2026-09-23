import type { ReviewProjection } from "@/lib/content/review";

function valueText(value: string | readonly string[]): string {
  return typeof value === "string" ? value : value.join(" ");
}

export default function ReviewContent({ projection }: { projection: ReviewProjection }) {
  return (
    <section className="study-content">
      <section>
        <p className="eyebrow">Content</p>
        <h2>{projection.content.topic.title}</h2>
        <p>{projection.content.topic.summary}</p>
        <p><strong>Audience:</strong> {projection.content.topic.audience} · <strong>Level:</strong> {projection.content.topic.level}</p>
      </section>
      <section>
        <p className="eyebrow">Objectives</p>
        <ul className="study-list">
          {projection.content.objectives.map((objective) => <li key={objective.id}><strong>{objective.verb}:</strong> {objective.statement}</li>)}
        </ul>
      </section>
      <section>
        <p className="eyebrow">Concepts</p>
        <ul className="study-list">
          {projection.content.concepts.map((concept) => <li key={concept.id}><strong>{concept.title}</strong>{concept.aliases.length ? ` (${concept.aliases.join(", ")})` : ""}</li>)}
        </ul>
      </section>
      {projection.content.knowledgeUnits.map((unit) => (
        <section key={unit.id} id={unit.id}>
          <p className="eyebrow">Knowledge Unit</p>
          <h3>{unit.title}</h3>
          {unit.summary ? <p>{unit.summary}</p> : null}
          {unit.blocks.map((block) => (
            <div key={block.id} className="intelligence-card">
              <p className="eyebrow">{block.type}</p>
              {Object.entries(block.payload).map(([key, value]) => <p key={key}><strong>{key}:</strong> {valueText(value)}</p>)}
            </div>
          ))}
        </section>
      ))}
    </section>
  );
}
