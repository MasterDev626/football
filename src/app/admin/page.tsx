import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatGameDate } from "@/lib/format";
import { buildPlayerInsights } from "@/lib/insights";
import { pragueCalendarDate } from "@/lib/time";
import { ensureWeeklyGames } from "@/lib/weekly-roll";
import {
  adminForceLeave,
  approveGame,
  banPlayer,
  liftBan,
  rejectGame,
} from "@/lib/actions";
import {
  AdminBanForm,
  AdminLiftButton,
  AdminRemoveButton,
  ApproveRejectButtons,
} from "@/components/admin-controls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  await ensureWeeklyGames();

  const startOfToday = pragueCalendarDate();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    pendingGames,
    liveGames,
    bans,
    events,
    recentEvents,
    joinsThisWeek,
    leavesThisWeek,
    totalSignups,
  ] = await Promise.all([
    prisma.game.findMany({
      where: { status: "PENDING" },
      include: { _count: { select: { signups: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.game.findMany({
      where: { date: { gte: startOfToday }, status: "APPROVED" },
      include: {
        signups: { orderBy: [{ listType: "asc" }, { position: "asc" }] },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.ban.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.playerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 3000,
    }),
    prisma.playerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.playerEvent.count({
      where: { type: "JOINED", createdAt: { gte: weekAgo } },
    }),
    prisma.playerEvent.count({
      where: {
        type: { in: ["LEFT", "REMOVED"] },
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.signup.count(),
  ]);

  const { regulars, flakes } = buildPlayerInsights(events);
  const onLists = liveGames.reduce((n, g) => n + g.signups.length, 0);
  const fillAvg =
    liveGames.length === 0
      ? 0
      : Math.round(
          (liveGames.reduce(
            (n, g) =>
              n +
              g.signups.filter((s) => s.listType === "MAIN").length /
                Math.max(g.maxPlayers, 1),
            0,
          ) /
            liveGames.length) *
            100,
        );

  return (
    <div className="dash-page">
      <header className="dash-header" id="overview">
        <div>
          <p className="dash-eyebrow">Live data · Prague</p>
          <h1>Dashboard</h1>
          <p className="dash-sub">
            Approve posts, watch lists, and see who shows up vs who backs out.
          </p>
        </div>
        <Link href="/games/new" className="dash-btn dash-btn-primary">
          Post game (auto-live)
        </Link>
      </header>

      <section className="dash-kpis">
        <Kpi label="Pending approvals" value={String(pendingGames.length)} hint="Need your review" accent />
        <Kpi label="Live upcoming" value={String(liveGames.length)} hint="On homepage" />
        <Kpi label="On lists now" value={String(onLists)} hint={`${totalSignups} all-time signups`} />
        <Kpi label="Joins (7d)" value={String(joinsThisWeek)} hint={`${leavesThisWeek} dropouts`} />
        <Kpi label="Avg fill" value={`${fillAvg}%`} hint="Main list capacity" />
        <Kpi label="Active bans" value={String(bans.length)} hint="Blocked from joining" />
      </section>

      <section className="dash-card" id="approvals">
        <div className="dash-card-head">
          <div>
            <h2>Game approvals</h2>
            <p>External posts stay hidden until you publish them.</p>
          </div>
          <span className="dash-badge">{pendingGames.length} waiting</span>
        </div>
        {pendingGames.length === 0 ? (
          <p className="dash-empty">No pending games — inbox clear.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>When</th>
                  <th>Venue</th>
                  <th>By</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingGames.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <Link href={`/games/${g.id}`} className="dash-link">
                        {g.title}
                      </Link>
                      <div className="dash-muted">
                        {g.format} · {g.priceCzk} CZK · {g.maxPlayers} spots
                      </div>
                    </td>
                    <td>
                      {formatGameDate(g.date)}
                      <div className="dash-muted">
                        {g.startTime}–{g.endTime}
                      </div>
                    </td>
                    <td>{g.venueName}</td>
                    <td>{g.organizerName}</td>
                    <td className="dash-muted">
                      {g.createdAt.toLocaleString("en-GB", {
                        timeZone: "Europe/Prague",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <ApproveRejectButtons
                        gameId={g.id}
                        approveAction={approveGame}
                        rejectAction={rejectGame}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="dash-split" id="players">
        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <h2>Comes often</h2>
              <p>Players with 2+ real joins (empty until people play)</p>
            </div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Joins</th>
                  <th>Left</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {regulars.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dash-empty">
                      No player history yet.
                    </td>
                  </tr>
                ) : (
                  regulars.map((p, i) => (
                    <tr key={p.nameKey}>
                      <td>
                        <span className="dash-rank">{i + 1}</span> {p.displayName}
                      </td>
                      <td>{p.joins}</td>
                      <td>{p.leaves}</td>
                      <td>
                        <strong>{p.netShows}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <h2>Backs out a lot</h2>
              <p>Leaves, removals, late leave attempts</p>
            </div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Left</th>
                  <th>Removed</th>
                  <th>Drop %</th>
                </tr>
              </thead>
              <tbody>
                {flakes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dash-empty">
                      No dropouts recorded yet.
                    </td>
                  </tr>
                ) : (
                  flakes.map((p) => (
                    <tr key={p.nameKey}>
                      <td>{p.displayName}</td>
                      <td>{p.leaves}</td>
                      <td>
                        {p.removed}
                        {p.lateBlocked ? (
                          <span className="dash-muted"> · {p.lateBlocked} late</span>
                        ) : null}
                      </td>
                      <td>
                        <span className="dash-pill warn">
                          {Math.round(p.flakeScore * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="dash-card" id="games">
        <div className="dash-card-head">
          <div>
            <h2>Live games</h2>
            <p>Published upcoming friendlies and current lists</p>
          </div>
        </div>
        {liveGames.length === 0 ? (
          <p className="dash-empty">No published upcoming games.</p>
        ) : (
          liveGames.map((game) => {
            const main = game.signups.filter((s) => s.listType === "MAIN");
            const wait = game.signups.filter((s) => s.listType === "WAITING");
            const pct = Math.round((main.length / Math.max(game.maxPlayers, 1)) * 100);
            return (
              <div key={game.id} className="dash-game-block">
                <div className="dash-game-head">
                  <div>
                    <Link href={`/games/${game.id}`} className="dash-link strong">
                      {game.title}
                    </Link>
                    <p className="dash-muted">
                      {formatGameDate(game.date)} · {game.startTime}–{game.endTime} ·{" "}
                      {game.venueName} · {main.length}/{game.maxPlayers}
                      {wait.length ? ` · ${wait.length} waiting` : ""}
                    </p>
                  </div>
                  <div className="dash-meter" title={`${pct}% full`}>
                    <div style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table compact">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>List</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.signups.map((s) => (
                        <tr key={s.id}>
                          <td>{s.position}</td>
                          <td>{s.name}</td>
                          <td>
                            <span
                              className={`dash-pill ${
                                s.listType === "MAIN" ? "ok" : ""
                              }`}
                            >
                              {s.listType === "MAIN" ? "Main" : "Wait"}
                            </span>
                          </td>
                          <td>
                            <div className="dash-row-actions">
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
                          </td>
                        </tr>
                      ))}
                      {game.signups.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="dash-empty">
                            Empty list
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="dash-card" id="activity">
        <div className="dash-card-head">
          <div>
            <h2>Activity feed</h2>
            <p>Latest joins, leaves, and bans from the database</p>
          </div>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Event</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr key={e.id}>
                  <td>{e.displayName}</td>
                  <td>{labelEvent(e.type)}</td>
                  <td className="dash-muted">
                    {e.createdAt.toLocaleString("en-GB", {
                      timeZone: "Europe/Prague",
                    })}
                  </td>
                </tr>
              ))}
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="dash-empty">
                    No events yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-card" id="bans">
        <div className="dash-card-head">
          <div>
            <h2>Active bans</h2>
            <p>Blocked from registering until cleared</p>
          </div>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Reason</th>
                <th>Fee</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="dash-empty">
                    No active bans.
                  </td>
                </tr>
              ) : (
                bans.map((b) => (
                  <tr key={b.id}>
                    <td>{b.displayName}</td>
                    <td>{b.reason}</td>
                    <td>{b.feeCzk ? `${b.feeCzk} CZK` : "—"}</td>
                    <td>
                      <AdminLiftButton banId={b.id} action={liftBan} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={`dash-kpi ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{hint}</em>
    </div>
  );
}

function labelEvent(type: string): string {
  switch (type) {
    case "JOINED":
      return "Joined";
    case "LEFT":
      return "Left early";
    case "REMOVED":
      return "Removed by organizer";
    case "BANNED":
      return "Banned";
    case "LATE_LEAVE_BLOCKED":
      return "Late leave blocked";
    default:
      return type;
  }
}
