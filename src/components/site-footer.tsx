import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-panel glass-panel">
        <div className="footer-brand">
          <strong>Football PRG</strong>
          <span>Prague friendlies · Mon Letna · Tue & Sat Nove Butovice</span>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          <Link href="/#games" className="glass-chip">
            Games
          </Link>
          <Link href="/venues" className="glass-chip">
            Venues
          </Link>
          <Link href="/#results" className="glass-chip">
            Results
          </Link>
          <Link href="/admin" className="glass-chip">
            Admin
          </Link>
          <a href="/#games" className="glass-chip glass-chip-accent">
            Join a game
          </a>
        </nav>
      </div>
    </footer>
  );
}
