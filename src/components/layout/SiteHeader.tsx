import Link from "next/link";

export function SiteHeader() {
  return <header className="header"><div className="container header-inner"><Link href="/" className="brand" aria-label="SajibAtlas home">SAJIB <span>ATLAS</span></Link><nav className="nav" aria-label="Primary navigation"><Link href="/subjects">Subjects</Link><Link href="/topics">Topics</Link><Link href="/">Explore</Link></nav></div></header>;
}
