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
          <Link href="/">Games</Link>
          <Link href="/venues">Venues</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/games/new" className="nav-cta">
            Post a game
          </Link>
        </nav>
      </div>
    </header>
  );
}
