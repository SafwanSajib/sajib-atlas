import Link from "next/link";

const links = [["Explore", "/explore"], ["Atlas", "/geography"], ["Topics", "/explore"], ["About", "/about"]];

export default function Footer() {
  return <footer className="site-footer"><div className="shell footer-wrap"><div><Link className="brand" href="/"><span className="brand-name">SAJIB <b>ATLAS</b></span><span className="brand-tagline">KNOWLEDGE <i>•</i> GEOGRAPHY <i>•</i> GROWTH</span></Link><p className="footer-note">A personal knowledge platform for a more connected way to learn.</p></div><div className="footer-links">{links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</div></div><div className="shell footer-bottom"><span>© 2026 Sajib Atlas</span><span>Built for curious minds</span></div></footer>;
}
