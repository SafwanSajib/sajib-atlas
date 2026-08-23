type SectionHeadingProps = { eyebrow?: string; title: string; description?: string };

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return <div className="section-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2>{title}</h2></div>{description ? <p className="section-intro">{description}</p> : null}</div>;
}
