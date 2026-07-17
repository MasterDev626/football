import { cookies } from "next/headers";
import Link from "next/link";
import { ListType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatGameDate } from "@/lib/format";
import { motmCandidateNames, VOTER_COOKIE } from "@/lib/motm";
import { MatchResultPanel } from "@/components/match-result-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Results",
};

export default async function ResultsPage() {
  const results = await prisma.matchResult.findMany({
    include: {
      goals: { orderBy: { createdAt: "asc" } },
      votes: true,
      game: {
        include: {
          signups: {
            where: { listType: ListType.MAIN },
            orderBy: { position: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const jar = await cookies();
  const voterKey = jar.get(VOTER_COOKIE)?.value;

  return (
    <div className="shell section" style={{ paddingTop: "2.2rem" }}>
      <div className="section-head">
        <div>
          <p className="section-kicker">Community</p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Results
          </h1>
          <p className="page-lead" style={{ marginTop: "0.55rem" }}>
            Scores, who played, and who scored. Your only action here is voting
            Player of the Match — admins post lineups and goals.
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <p>No results posted yet.</p>
          <p className="form-hint">
            After a friendly, Dome / MasterDevops will add the score here.
          </p>
          <Link href="/#games" className="text-link">
            Browse upcoming games →
          </Link>
        </div>
      ) : (
        <div className="results-feed">
          {results.map((result) => {
            const signupNames = result.game.signups.map((s) =>
              s.name.split(" + ")[0].trim(),
            );
            const candidates = motmCandidateNames({
              teamALineup: result.teamALineup,
              teamBLineup: result.teamBLineup,
              goals: result.goals,
              signupNames,
            });
            const myVote = voterKey
              ? result.votes.find((v) => v.voterKey === voterKey)
              : null;

            return (
              <article key={result.id} className="results-feed-item">
                <div className="results-feed-meta">
                  <p className="result-date">
                    {formatGameDate(result.game.date)} · {result.game.venueName}
                  </p>
                  <Link href={`/games/${result.game.id}`} className="text-link">
                    Open game page →
                  </Link>
                </div>
                <MatchResultPanel
                  gameId={result.gameId}
                  result={result}
                  candidates={candidates}
                  alreadyVotedFor={myVote?.playerName}
                  signupNames={signupNames}
                  title={result.game.title}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
