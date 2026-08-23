export default function Hero() {
  return (
    <section id="top" className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow">Personal knowledge platform</p>
        <h1>Explore.<br />Learn.<br /><em>Connect.</em></h1>
        <p className="hero-text">A structured knowledge platform for geography, BCS preparation, international affairs, English and beyond.</p>
        <div className="button-row">
          <a className="button button-primary" href="#explore">Explore Atlas <span>↗</span></a>
          <a className="button button-quiet" href="#topics">Browse Topics <span>→</span></a>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orbital orbital-one" /><div className="orbital orbital-two" />
        <div className="atlas-core"><span className="core-cross" /><strong>SA</strong><small>01 / 06</small></div>
        <div className="orbit-label label-top">N 23° 48′</div><div className="orbit-label label-side">KNOWLEDGE<br />NETWORK</div>
        <span className="signal signal-one" /><span className="signal signal-two" /><span className="signal signal-three" />
      </div>
    </section>
  );
}
