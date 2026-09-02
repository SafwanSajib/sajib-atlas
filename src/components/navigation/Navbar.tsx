import Link from "next/link";
import SearchBar from "./SearchBar";

const links = [
  ["Explore", "/explore"],
  ["Atlas", "/geography"],
  ["Ask", "/ai"],
  ["Dashboard", "/dashboard"],
  ["Revision", "/revision"],
  ["About", "/about"],
];

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="shell nav-wrap" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Sajib Atlas home">
          <span className="brand-name">SAJIB <b>ATLAS</b></span>
          <span className="brand-tagline">KNOWLEDGE <i>•</i> GEOGRAPHY <i>•</i> GROWTH</span>
        </Link>
        <div className="desktop-nav">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          <SearchBar />
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
