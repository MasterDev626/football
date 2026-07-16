import Link from "next/link";
import { BallMark } from "@/components/icons";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand-lockup" aria-label="Football PRG home">
          <BallMark className="brand-mark" />
          <span className="brand-text">
            Football <em>PRG</em>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          <Link href="/#games">Games</Link>
          <Link href="/venues">Venues</Link>
          <Link href="/admin">Admin</Link>
          <a href="/#games" className="nav-cta">
            Join a game
          </a>
        </nav>
      </div>
    </header>
  );
}
