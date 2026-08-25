import Link from "next/link";

const stages = [["Preliminary", "Foundation", 72], ["Written", "Depth & expression", 38], ["Viva", "Clarity & confidence", 16]];

export default function BCSSection() {
  return <section id="about" className="section shell bcs-section"><div className="bcs-copy"><p className="eyebrow">The command center</p><h2>Build your BCS <em>command center.</em></h2><p>Turn a wide syllabus into a visible path forward. Track the areas you know, the ideas you need to revisit and the next useful step.</p><Link className="text-link" href="/bcs">Enter the workspace <span>↗</span></Link></div><div className="progress-panel"><div className="progress-header"><span>Preparation map</span><span>2026 cycle</span></div>{stages.map(([name, detail, value]) => <div className="progress-row" key={name}><div className="progress-label"><strong>{name}</strong><span>{detail}</span><b>{value}%</b></div><div className="progress-track"><i style={{ width: `${value}%` }} /></div></div>)}</div></section>;
}
