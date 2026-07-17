"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconGames({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.8v16.4M3.8 12h16.4M7.2 7.2l9.6 9.6M16.8 7.2l-9.6 9.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconVenues({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.3 7-11a7 7 0 10-14 0c0 5.7 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconResults({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 6H5a2 2 0 000 4h2M17 6h2a2 2 0 010 4h-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAdmin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3.5v5.2c0 4.6-3.2 8.7-8 9.8-4.8-1.1-8-5.2-8-9.8V6.5L12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2l1.7 1.7 3.5-3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const items = [
  { href: "/#games", label: "Games", icon: IconGames, id: "games" },
  { href: "/venues", label: "Venues", icon: IconVenues, id: "venues" },
  { href: "/results", label: "Results", icon: IconResults, id: "results" },
  { href: "/admin", label: "Admin", icon: IconAdmin, id: "admin" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  function isActive(id: string): boolean {
    if (id === "venues") return pathname.startsWith("/venues");
    if (id === "admin") return pathname.startsWith("/admin");
    if (id === "results") return pathname.startsWith("/results");
    if (id === "games") {
      return pathname === "/" || pathname.startsWith("/games");
    }
    return false;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile">
      <ul className="mobile-bottom-nav-list">
        {items.map((item) => {
          const active = isActive(item.id);
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`mobile-tab ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="mobile-tab-icon">
                  <Icon />
                </span>
                <span className="mobile-tab-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
