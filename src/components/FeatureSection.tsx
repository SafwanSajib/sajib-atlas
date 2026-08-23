const features = [
  ["Atlas", "Geographic knowledge, maps, regions and spatial concepts.", "↗", "/geography"],
  ["Library", "Structured notes, concepts, references and study materials.", "⌁", "/explore"],
  ["Practice", "MCQs, revision tools and exam-focused learning.", "＋", "/bcs"],
];

export default function FeatureSection() {
  return <section id="atlas" className="section feature-band"><div className="shell"><div className="section-heading"><div><p className="eyebrow">A system for learning</p><h2>Knowledge, <em>organized.</em></h2></div></div><div className="feature-grid">{features.map(([title, description, icon, href]) => <article className="feature-card" key={title}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{description}</p><a href={href} aria-label={`Open ${title}`}>Open section <span>↗</span></a></article>)}</div></div></section>;
}
