import Link from "next/link";
import { isAdminAuthed } from "@/lib/admin";
import { adminLogout } from "@/lib/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthed();

  if (!authed) {
    return <>{children}</>;
  }

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dash-brand-mark">FP</span>
          <div>
            <strong>Football PRG</strong>
            <p>Organizer console</p>
          </div>
        </div>
        <nav className="dash-nav">
          <a href="#overview">Overview</a>
          <a href="#approvals">Approvals</a>
          <a href="#players">Players</a>
          <a href="#games">Live games</a>
          <a href="#activity">Activity</a>
          <a href="#bans">Bans</a>
          <Link href="/">← Public site</Link>
        </nav>
        <form action={adminLogout} className="dash-sidebar-foot">
          <button type="submit" className="dash-btn dash-btn-ghost">
            Log out
          </button>
        </form>
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
