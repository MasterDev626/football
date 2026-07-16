import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatGameDate } from "@/lib/format";
import {
  adminForceLeave,
  adminLogout,
  banPlayer,
  liftBan,
} from "@/lib/actions";
import { AdminBanForm, AdminLiftButton, AdminRemoveButton } from "@/components/admin-controls";

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

  const [games, bans, recentSignups] = await Promise.all([
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
      take: 25,
      orderBy: { createdAt: "desc" },
      include: { game: true },
    }),
  ]);

  const totalPlayers = games.reduce((n, g) => n + g.signups.length, 0);

  return (
    <div className="shell section admin-shell">
      <div className="admin-top">
        <div>
          <h1 className="page-title">Dome dashboard</h1>
          <p className="page-lead">
            {games.length} upcoming games · {totalPlayers} names on lists ·{" "}
            {bans.length} active bans
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
          <Link key={g.id} href={`/games/${g.id}`} className="admin-stat animate-rise">
            <strong>{formatGameDate(g.date)}</strong>
            <span>
              {g.signups.length}/{g.maxPlayers} · {g.venueName}
            </span>
          </Link>
        ))}
      </section>

      <section className="panel admin-panel animate-rise">
        <h2>Latest signups</h2>
        <ul className="admin-feed">
          {recentSignups.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong>
              <span>
                joined {s.game.title} ·{" "}
                {s.createdAt.toLocaleString("en-GB", {
                  timeZone: "Europe/Prague",
                })}
              </span>
            </li>
          ))}
          {recentSignups.length === 0 ? <li>No signups yet.</li> : null}
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
