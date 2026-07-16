import Link from "next/link";
import type { Game, Signup } from "@prisma/client";
import { formatGameDate } from "@/lib/format";
import { ClockIcon, MapPinIcon } from "@/components/icons";

type GameWithSignups = Game & { signups: Signup[] };

export function GameCard({ game }: { game: GameWithSignups }) {
  const mainFilled = game.signups.filter((s) => s.listType === "MAIN").length;
  const waiting = game.signups.filter((s) => s.listType === "WAITING").length;
  const spotsLeft = Math.max(game.maxPlayers - mainFilled, 0);
  const full = spotsLeft === 0;

  return (
    <article className="game-card animate-rise">
      <div className="game-card-top">
        <p className="game-card-date">{formatGameDate(game.date)}</p>
        <span className={`spot-pill ${full ? "spot-full" : "spot-open"}`}>
          {full ? `Full · ${waiting} waiting` : `${spotsLeft} spots left`}
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
      <div className="game-card-footer">
        <span>
          {game.format} · {game.priceCzk === 0 ? "Free" : `${game.priceCzk} CZK`}
        </span>
        <Link href={`/games/${game.id}`} className="text-link">
          View list →
        </Link>
      </div>
    </article>
  );
}
