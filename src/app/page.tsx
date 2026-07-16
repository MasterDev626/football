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
  if (day === "weekday") {
    return !["friday", "saturday", "sunday"].includes(key);
  }
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
    where: { date: { gte: startOfToday } },
    include: { signups: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const filtered = games.filter((g) => matchesDayFilter(g.date, day));

  return (
    <>
      <section className="shell hero">
        <BallMark className="hero-ball" />
        <div className="hero-copy animate-rise">
          <h1 className="hero-brand">
            Football <span>PRG</span>
          </h1>
          <p className="hero-lead">
            Prague friendlies, organized. See who&apos;s coming, grab a spot on
            the main list, or jump on the waiting list — no group chat required.
          </p>
          <div className="hero-actions">
            <Link href="/games/new" className="btn-primary">
              Post a friendly
            </Link>
            <Link href="/venues" className="btn-ghost">
              Browse venues
            </Link>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="section-head">
          <h2>Upcoming games</h2>
          <Suspense fallback={null}>
            <DayFilter active={day} />
          </Suspense>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No games for this filter yet.</p>
            <p>
              <Link href="/games/new" className="text-link">
                Be the first to post one →
              </Link>
            </p>
          </div>
        ) : (
          <div className="game-grid">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
