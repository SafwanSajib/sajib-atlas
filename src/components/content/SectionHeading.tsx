export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2></div>;
}
