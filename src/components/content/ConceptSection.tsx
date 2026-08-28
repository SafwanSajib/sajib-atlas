export function ConceptSection({ title, body, items }: { title: string; body?: string; items?: string[] }) {
  return <section className="topic-section"><h2>{title}</h2>{body ? <p>{body}</p> : null}{items ? <ul className="list">{items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>;
}
