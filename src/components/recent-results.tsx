import Link from "next/link";
import type { Game, MatchResult } from "@prisma/client";
import { formatGameDate } from "@/lib/format";

type Row = MatchResult & {
  game: Pick<Game, "id" | "title" | "date" | "venueName">;
};

export function RecentResults({ results }: { results: Row[] }) {
  if (results.length === 0) return null;

  return (
    <section className="shell section results-section" id="results">
      <div className="section-head">
        <div>
          <p className="section-kicker">Community</p>
          <h2>Recent results</h2>
        </div>
      </div>
      <div className="results-grid">
        {results.map((r) => (
          <Link key={r.id} href={`/games/${r.game.id}`} className="result-card">
            <p className="result-date">{formatGameDate(r.game.date)}</p>
            <h3>{r.game.title}</h3>
            <div className="result-score">
              <span>
                {r.teamAName} <strong>{r.teamAScore}</strong>
              </span>
              <em>–</em>
              <span>
                <strong>{r.teamBScore}</strong> {r.teamBName}
              </span>
            </div>
            {r.motmName ? (
              <p className="result-motm">
                POTM <strong>{r.motmName}</strong>
              </p>
            ) : r.votingOpen ? (
              <p className="result-motm open">Vote for Player of the Match →</p>
            ) : (
              <p className="result-motm muted">{r.game.venueName}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
