const domains = [
  ["01", "Geography", "Maps, regions, physical systems and the forces shaping place.", "Spatial knowledge"],
  ["02", "BCS Preparation", "Focused resources for building a confident, connected command of the syllabus.", "Exam intelligence"],
  ["03", "Bangladesh Affairs", "The history, society, economy and identity of Bangladesh.", "National context"],
  ["04", "International Affairs", "Events, institutions and ideas that connect the world.", "Global perspective"],
  ["05", "English & IELTS", "Sharper language, richer vocabulary and exam-ready communication.", "Language lab"],
  ["06", "Science & Technology", "The concepts and breakthroughs changing how we understand tomorrow.", "Future signals"],
];

export default function DomainGrid() {
  return <section id="explore" className="section shell">
    <div className="section-heading"><div><p className="eyebrow">The knowledge map</p><h2>Explore the <em>Atlas</em></h2></div><p className="section-intro">Six connected domains. One growing system for asking better questions and finding your way through them.</p></div>
    <div id="topics" className="domain-grid">
      {domains.map(([number, title, description, label]) => <a className="domain-card" href="#atlas" key={title}><div className="card-top"><span className="card-number">{number}</span><span className="arrow">↗</span></div><p className="card-label">{label}</p><h3>{title}</h3><p className="card-description">{description}</p><span className="card-line" /></a>)}
    </div>
  </section>;
}
