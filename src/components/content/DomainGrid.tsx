import { curriculumRegistry } from "@/lib/curriculum-registry";

const domains = [
  { label: "01", title: "Geography", description: "Spatial knowledge & Earth systems", href: "/geography" },
  { label: "02", title: "BCS Preparation", description: "Exam intelligence & syllabus path", href: "/bcs" },
  { label: "03", title: "English & IELTS", description: "Language lab & communication", href: "/english" },
];

export default function DomainGrid() {
  return (
    <section id="explore" className="section shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The knowledge map</p>
          <h2>Explore the <em>Atlas</em></h2>
        </div>
        <p className="section-intro">Connected domains. One growing system for asking better questions and finding your way through them.</p>
      </div>
      <div id="topics" className="domain-grid">
        {domains.map((domain) => {
          const id = domain.href.substring(1);
          const count = curriculumRegistry.filter((item) => item.subject === id).length;
          return (
            <a className="domain-card" href={domain.href} key={domain.title}>
              <div className="card-top">
                <span className="card-number">{domain.label}</span>
                <span className="arrow">↗</span>
              </div>
              <p className="card-label">{count} available topics</p>
              <h3>{domain.title}</h3>
              <p className="card-description">{domain.description}</p>
              <span className="card-line" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

