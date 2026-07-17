import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { weekdayKey } from "@/lib/format";
import { BallMark } from "@/components/icons";
import { DayFilter } from "@/components/day-filter";
import { GameCard } from "@/components/game-card";

export const dynamic = "force-dynamic";

function matchesDayFilter(date: Date, day: string): boolean {
  if (day === "all") return true;
  const key = weekdayKey(date);
  return key === day;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day: dayParam } = await searchParams;
  const day = (dayParam || "all").toLowerCase();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const games = await prisma.game.findMany({
    where: { date: { gte: startOfToday }, status: "APPROVED" },
    include: { signups: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const filtered = games.filter((g) => matchesDayFilter(g.date, day));

  return (
    <>
      <section className="hero-plane">
        <div className="pitch-lines" aria-hidden />
        <div className="shell hero">
          <BallMark className="hero-ball" />
          <div className="hero-copy animate-rise">
            <p className="hero-kicker">Prague friendlies</p>
            <h1 className="hero-brand">
              Football <span>PRG</span>
            </h1>
            <p className="hero-lead">
              See who&apos;s playing, grab a spot on the list, pay Dome. Not
              coming? Say so in the group. Joining? Do it here in seconds.
            </p>
            <div className="hero-actions">
              <a href="#games" className="btn-primary btn-pulse">
                See upcoming games
              </a>
              <Link href="/venues" className="btn-ghost">
                Where we play
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="shell section" id="games">
        <div className="section-head">
          <div>
            <p className="section-kicker">This week</p>
            <h2>Upcoming games</h2>
          </div>
          <Suspense fallback={null}>
            <DayFilter active={day} />
          </Suspense>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No games for this filter yet.</p>
            <p>
              <a href="#games" className="text-link">
                Check All days →
              </a>
            </p>
          </div>
        ) : (
          <div className="game-grid">
            {filtered.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
