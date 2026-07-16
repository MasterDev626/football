import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatGameDate } from "@/lib/format";
import { buildPlayerInsights } from "@/lib/insights";
import {
  adminForceLeave,
  adminLogout,
  banPlayer,
  liftBan,
} from "@/lib/actions";
import {
  AdminBanForm,
  AdminLiftButton,
  AdminRemoveButton,
} from "@/components/admin-controls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [games, bans, recentSignups, events, recentEvents] = await Promise.all([
    prisma.game.findMany({
      where: { date: { gte: startOfToday } },
      include: {
        signups: { orderBy: [{ listType: "asc" }, { position: "asc" }] },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.ban.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.signup.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { game: true },
    }),
    prisma.playerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.playerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const { regulars, flakes } = buildPlayerInsights(events);
  const totalPlayers = games.reduce((n, g) => n + g.signups.length, 0);

  return (
    <div className="shell section admin-shell">
      <div className="admin-top">
        <div>
          <h1 className="page-title">Organizer desk</h1>
          <p className="page-lead">
            {games.length} upcoming · {totalPlayers} on lists · {bans.length}{" "}
            bans · who shows up vs who backs out
          </p>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="btn-ghost">
            Log out
          </button>
        </form>
      </div>

      <section className="admin-stats">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/games/${g.id}`}
            className="admin-stat animate-rise"
          >
            <strong>{formatGameDate(g.date)}</strong>
            <span>
              {g.signups.length}/{g.maxPlayers} · {g.venueName}
            </span>
          </Link>
        ))}
      </section>

      <div className="admin-insight-grid">
        <section className="panel admin-panel animate-rise">
          <h2>Comes often</h2>
          <p className="form-hint">Most sign-ups recorded</p>
          <ul className="insight-list">
            {regulars.length === 0 ? (
              <li>No history yet — builds as people join.</li>
            ) : (
              regulars.map((p) => (
                <li key={p.nameKey}>
                  <strong>{p.displayName}</strong>
                  <span>
                    {p.joins} joins · {p.leaves} left · {p.netShows} net
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel admin-panel animate-rise">
          <h2>Backs out a lot</h2>
          <p className="form-hint">Leaves, admin removals, late leave tries</p>
          <ul className="insight-list">
            {flakes.length === 0 ? (
              <li>No dropouts recorded yet.</li>
            ) : (
              flakes.map((p) => (
                <li key={p.nameKey}>
                  <strong>{p.displayName}</strong>
                  <span>
                    {p.leaves} left · {p.removed} removed
                    {p.lateBlocked ? ` · ${p.lateBlocked} late tries` : ""}
                    {p.joins ? ` · ${Math.round(p.flakeScore * 100)}% drop rate` : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="panel admin-panel animate-rise">
        <h2>Latest activity</h2>
        <ul className="admin-feed">
          {recentEvents.map((e) => (
            <li key={e.id}>
              <strong>{e.displayName}</strong>
              <span>
                {labelEvent(e.type)} ·{" "}
                {e.createdAt.toLocaleString("en-GB", {
                  timeZone: "Europe/Prague",
                })}
              </span>
            </li>
          ))}
          {recentEvents.length === 0 ? <li>No events yet.</li> : null}
        </ul>
      </section>

      <section className="panel admin-panel animate-rise">
        <h2>On lists right now</h2>
        <ul className="admin-feed">
          {recentSignups.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong>
              <span>
                {s.game.title} ·{" "}
                {s.createdAt.toLocaleString("en-GB", {
                  timeZone: "Europe/Prague",
                })}
              </span>
            </li>
          ))}
          {recentSignups.length === 0 ? <li>No current signups.</li> : null}
        </ul>
      </section>

      {games.map((game) => (
        <section key={game.id} className="panel admin-panel animate-rise">
          <div className="admin-game-head">
            <div>
              <h2>{game.title}</h2>
              <p>
                {formatGameDate(game.date)} · {game.startTime}–{game.endTime} ·{" "}
                {game.signups.length} signed
              </p>
            </div>
            <Link href={`/games/${game.id}`} className="text-link">
              Open game →
            </Link>
          </div>
          <ol className="admin-roster">
            {game.signups.map((s) => (
              <li key={s.id}>
                <span>
                  {s.position}. {s.name}{" "}
                  <em>({s.listType === "MAIN" ? "main" : "wait"})</em>
                </span>
                <div className="admin-actions">
                  <AdminRemoveButton
                    gameId={game.id}
                    signupId={s.id}
                    action={adminForceLeave}
                  />
                  <AdminBanForm
                    name={s.name.split(" + ")[0]}
                    feeCzk={game.priceCzk}
                    action={banPlayer}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="panel admin-panel animate-rise">
        <h2>Active bans</h2>
        {bans.length === 0 ? (
          <p className="form-hint">No active bans.</p>
        ) : (
          <ul className="admin-feed">
            {bans.map((b) => (
              <li key={b.id}>
                <strong>{b.displayName}</strong>
                <span>
                  {b.reason}
                  {b.feeCzk ? ` · ${b.feeCzk} CZK` : ""}
                </span>
                <AdminLiftButton banId={b.id} action={liftBan} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function labelEvent(type: string): string {
  switch (type) {
    case "JOINED":
      return "joined";
    case "LEFT":
      return "left early";
    case "REMOVED":
      return "removed by organizer";
    case "BANNED":
      return "banned";
    case "LATE_LEAVE_BLOCKED":
      return "tried to leave too late";
    default:
      return type.toLowerCase();
  }
}
