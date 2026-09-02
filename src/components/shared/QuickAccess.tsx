const links = [
  { label: "Today's Learning", href: "/dashboard" },
  { label: "Important Topics", href: "/explore" },
  { label: "MCQ Practice", href: "/geography" },
  { label: "Revision", href: "/revision" },
];

export default function QuickAccess() {
  return <section id="quick-access" className="section shell quick-access"><div className="quick-heading"><p className="eyebrow">Make it useful</p><h2>Quick <em>access.</em></h2></div><div className="quick-grid">{links.map((item, index) => <a href={item.href} key={item.label}><span>0{index + 1}</span>{item.label}<b>↗</b></a>)}</div></section>;
}
