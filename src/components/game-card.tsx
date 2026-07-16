import Link from "next/link";
import type { Game, Signup } from "@prisma/client";
import { formatGameDate } from "@/lib/format";
import { ClockIcon, MapPinIcon } from "@/components/icons";

type GameWithSignups = Game & { signups: Signup[] };

export function GameCard({
  game,
  index = 0,
}: {
  game: GameWithSignups;
  index?: number;
}) {
  const mainFilled = game.signups.filter((s) => s.listType === "MAIN").length;
  const waiting = game.signups.filter((s) => s.listType === "WAITING").length;
  const spotsLeft = Math.max(game.maxPlayers - mainFilled, 0);
  const full = spotsLeft === 0;
  const fillPct = Math.min(100, Math.round((mainFilled / game.maxPlayers) * 100));

  return (
    <article
      className="game-card animate-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="game-card-stripe" aria-hidden />
      <div className="game-card-top">
        <p className="game-card-date">{formatGameDate(game.date)}</p>
        <span className={`spot-pill ${full ? "spot-full" : "spot-open"}`}>
          {full ? `Full · ${waiting} waiting` : `${spotsLeft} open`}
        </span>
      </div>
      <h2 className="game-card-title">
        <Link href={`/games/${game.id}`}>{game.title}</Link>
      </h2>
      <ul className="meta-list">
        <li>
          <ClockIcon className="meta-icon" />
          {game.startTime}–{game.endTime}
        </li>
        <li>
          <MapPinIcon className="meta-icon" />
          {game.venueName}
        </li>
      </ul>

      <div className="fill-meter" aria-hidden>
        <div className="fill-meter-bar" style={{ width: `${fillPct}%` }} />
      </div>
      <p className="fill-meter-label">
        {mainFilled}/{game.maxPlayers} on the main list
        {waiting > 0 ? ` · ${waiting} waiting` : ""}
      </p>

      <div className="game-card-footer">
        <span>
          {game.format} ·{" "}
          {game.priceCzk === 0 ? "Free" : `${game.priceCzk} CZK`}
        </span>
        <Link href={`/games/${game.id}`} className="card-cta">
          {full ? "Join waitlist" : "Join list"} →
        </Link>
      </div>
    </article>
  );
}
