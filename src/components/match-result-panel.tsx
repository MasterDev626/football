"use client";

import { useActionState } from "react";
import type { MatchGoal, MatchResult, MotmVote } from "@prisma/client";
import { voteMotm, type ActionResult } from "@/lib/actions";
import { goalsByTeam, lineupPlayers, tallyMotmVotes } from "@/lib/motm";

type ResultWithRelations = MatchResult & {
  goals: MatchGoal[];
  votes: MotmVote[];
};

export function MatchResultPanel({
  gameId,
  result,
  candidates,
  alreadyVotedFor,
  signupNames = [],
  title,
}: {
  gameId: string;
  result: ResultWithRelations;
  candidates: string[];
  alreadyVotedFor?: string | null;
  signupNames?: string[];
  title?: string;
}) {
  const { a, b } = goalsByTeam(result.goals);
  const { teamA, teamB } = lineupPlayers(result);
  const tallies = tallyMotmVotes(result.votes);
  const announced = Boolean(result.motmName);
  const canVote = result.votingOpen && !announced;
  const hasLineups = teamA.length > 0 || teamB.length > 0;

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(voteMotm, null);

  return (
    <section className="match-result panel animate-rise">
      <p className="detail-kicker">Match result</p>
      {title ? <h2 className="match-result-title">{title}</h2> : null}

      <div className="scoreboard">
        <div className="scoreboard-team">
          <span>{result.teamAName}</span>
          <strong>{result.teamAScore}</strong>
        </div>
        <div className="scoreboard-vs">vs</div>
        <div className="scoreboard-team">
          <span>{result.teamBName}</span>
          <strong>{result.teamBScore}</strong>
        </div>
      </div>

      <div className="lineup-grid">
        <div>
          <h3>Who played · {result.teamAName}</h3>
          {hasLineups ? (
            teamA.length === 0 ? (
              <p className="dash-muted">—</p>
            ) : (
              <ul className="lineup-list">
                {teamA.map((name) => (
                  <li key={`a-${name}`}>{name}</li>
                ))}
              </ul>
            )
          ) : signupNames.length > 0 ? (
            <ul className="lineup-list">
              {signupNames.map((name) => (
                <li key={`s-${name}`}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="dash-muted">Lineups not posted yet.</p>
          )}
        </div>
        <div>
          <h3>Who played · {result.teamBName}</h3>
          {hasLineups ? (
            teamB.length === 0 ? (
              <p className="dash-muted">—</p>
            ) : (
              <ul className="lineup-list">
                {teamB.map((name) => (
                  <li key={`b-${name}`}>{name}</li>
                ))}
              </ul>
            )
          ) : (
            <p className="dash-muted">
              {signupNames.length > 0
                ? "Teams not split yet — full list on the left."
                : "Lineups not posted yet."}
            </p>
          )}
        </div>
      </div>

      <div className="scorer-grid">
        <div>
          <h3>Scorers · {result.teamAName}</h3>
          {a.length === 0 ? (
            <p className="dash-muted">No goals logged</p>
          ) : (
            <ul>
              {a.map((g) => (
                <li key={g.id}>
                  {g.scorerName}
                  {g.minute != null ? ` ${g.minute}'` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Scorers · {result.teamBName}</h3>
          {b.length === 0 ? (
            <p className="dash-muted">No goals logged</p>
          ) : (
            <ul>
              {b.map((g) => (
                <li key={g.id}>
                  {g.scorerName}
                  {g.minute != null ? ` ${g.minute}'` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.notes ? <p className="match-notes">{result.notes}</p> : null}

      {announced ? (
        <div className="motm-banner">
          <span>Player of the Match</span>
          <strong>{result.motmName}</strong>
        </div>
      ) : (
        <div className="motm-vote-block">
          <div className="motm-vote-head">
            <h3>Vote Player of the Match</h3>
            <p>
              {canVote
                ? "Pick anyone from Team A or Team B. Only the community votes — admin announces the winner."
                : "Voting is closed — waiting for the announcement."}
            </p>
          </div>

          {tallies.length > 0 ? (
            <ul className="motm-tally">
              {tallies.slice(0, 8).map((t) => (
                <li key={t.playerNameKey}>
                  <span>{t.playerName}</span>
                  <em>
                    {t.votes} vote{t.votes === 1 ? "" : "s"}
                  </em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="form-hint">No votes yet — be the first.</p>
          )}

          {canVote && candidates.length > 0 ? (
            <form action={formAction} className="motm-vote-form">
              <input type="hidden" name="gameId" value={gameId} />
              <label className="field">
                <span>Your name</span>
                <input
                  name="voterName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  placeholder="e.g. Will"
                />
              </label>
              <label className="field">
                <span>Your pick (Team A or Team B)</span>
                <select name="playerName" required defaultValue="">
                  <option value="" disabled>
                    Select a player
                  </option>
                  {candidates.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending
                  ? "Saving…"
                  : alreadyVotedFor
                    ? "Update my vote"
                    : "Cast vote"}
              </button>
              {alreadyVotedFor ? (
                <p className="form-hint">You voted for {alreadyVotedFor}.</p>
              ) : null}
              {state && !state.ok ? (
                <p className="form-error" role="alert">
                  {state.error}
                </p>
              ) : null}
              {state?.ok ? (
                <p className="form-hint" role="status">
                  Vote saved. Thanks!
                </p>
              ) : null}
            </form>
          ) : null}

          {canVote && candidates.length === 0 ? (
            <p className="form-hint">
              Voting opens once admin posts the Team A / Team B lineups.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
