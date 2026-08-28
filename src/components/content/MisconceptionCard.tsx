export function MisconceptionCard({ items }: { items: string[] }) {
  return <div className="card"><p className="eyebrow">Check your understanding</p><ul className="list">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}
