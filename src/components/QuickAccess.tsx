const links = ["Today's Learning", "Important Topics", "MCQ Practice", "Revision", "Notes", "Search Atlas"];

export default function QuickAccess() {
  return <section id="quick-access" className="section shell quick-access"><div className="quick-heading"><p className="eyebrow">Make it useful</p><h2>Quick <em>access.</em></h2></div><div className="quick-grid">{links.map((label, index) => <a href="#top" key={label}><span>0{index + 1}</span>{label}<b>↗</b></a>)}</div></section>;
}
