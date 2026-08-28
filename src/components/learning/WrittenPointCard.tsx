export function WrittenPointCard({ items }: { items: string[] }) {
  return <section className="topic-section"><h2>Written Points</h2><ul className="list">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
