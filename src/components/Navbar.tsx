const links = [
  ["Explore", "#explore"],
  ["Atlas", "#atlas"],
  ["Topics", "#topics"],
  ["About", "#about"],
];

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="shell nav-wrap" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Sajib Atlas home">
          <span className="brand-name">SAJIB <b>ATLAS</b></span>
          <span className="brand-tagline">KNOWLEDGE <i>•</i> GEOGRAPHY <i>•</i> GROWTH</span>
        </a>
        <div className="desktop-nav">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </div>
        <details className="mobile-nav">
          <summary aria-label="Open navigation menu"><span /> <span /> <span /></summary>
          <div className="mobile-nav-panel">
            {links.map(([label, href]) => <a key={label} href={href}>{label}<span>↗</span></a>)}
          </div>
        </details>
      </nav>
    </header>
  );
}
