"use client";

import { useActionState } from "react";
import type { MatchGoal, MatchResult, MotmVote } from "@prisma/client";
import {
  announceMotm,
  saveMatchResult,
  setMotmVoting,
  type ActionResult,
} from "@/lib/actions";
import { tallyMotmVotes } from "@/lib/motm";

type ResultWithRelations = MatchResult & {
  goals: MatchGoal[];
  votes: MotmVote[];
};

export function AdminMatchResultForm({
  gameId,
  playerNames,
  existing,
}: {
  gameId: string;
  playerNames: string[];
  existing?: ResultWithRelations | null;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(saveMatchResult, null);

  const scorersA =
    existing?.goals
      .filter((g) => g.team === "A")
      .map((g) => (g.minute != null ? `${g.scorerName}|${g.minute}` : g.scorerName))
      .join("\n") ?? "";
  const scorersB =
    existing?.goals
      .filter((g) => g.team === "B")
      .map((g) => (g.minute != null ? `${g.scorerName}|${g.minute}` : g.scorerName))
      .join("\n") ?? "";

  const tallies = existing ? tallyMotmVotes(existing.votes) : [];

  return (
    <div className="admin-match-box">
      <form action={formAction} className="admin-match-form">
        <input type="hidden" name="gameId" value={gameId} />
        <div className="admin-match-row">
          <label>
            <span>Team A</span>
            <input
              name="teamAName"
              defaultValue={existing?.teamAName ?? "Team A"}
              required
            />
          </label>
          <label>
            <span>Score</span>
            <input
              name="teamAScore"
              type="number"
              min={0}
              defaultValue={existing?.teamAScore ?? 0}
              required
            />
          </label>
          <label>
            <span>Team B</span>
            <input
              name="teamBName"
              defaultValue={existing?.teamBName ?? "Team B"}
              required
            />
          </label>
          <label>
            <span>Score</span>
            <input
              name="teamBScore"
              type="number"
              min={0}
              defaultValue={existing?.teamBScore ?? 0}
              required
            />
          </label>
        </div>
        <div className="admin-match-row">
          <label>
            <span>Scorers A (one per line, optional min e.g. Will|23)</span>
            <textarea name="scorersA" rows={3} defaultValue={scorersA} />
          </label>
          <label>
            <span>Scorers B</span>
            <textarea name="scorersB" rows={3} defaultValue={scorersB} />
          </label>
        </div>
        <label>
          <span>Notes (optional)</span>
          <input name="notes" defaultValue={existing?.notes ?? ""} />
        </label>
        {!existing?.motmName ? (
          <label className="admin-check">
            <input
              type="checkbox"
              name="votingOpen"
              value="on"
              defaultChecked={existing?.votingOpen ?? true}
            />
            Open Player of the Match voting
          </label>
        ) : (
          <input type="hidden" name="votingOpen" value="off" />
        )}
        <button type="submit" className="dash-btn dash-btn-primary" disabled={pending}>
          {pending ? "Saving…" : existing ? "Update result" : "Post result"}
        </button>
        {state && !state.ok ? (
          <p className="form-error">{state.error}</p>
        ) : null}
        {state?.ok ? <p className="form-hint">Result saved.</p> : null}
      </form>

      {existing ? (
        <div className="admin-motm-tools">
          <h4>Player of the Match votes</h4>
          {tallies.length === 0 ? (
            <p className="dash-muted">No votes yet.</p>
          ) : (
            <ul className="motm-tally compact">
              {tallies.map((t) => (
                <li key={t.playerNameKey}>
                  <span>{t.playerName}</span>
                  <em>{t.votes}</em>
                </li>
              ))}
            </ul>
          )}

          {existing.motmName ? (
            <p className="motm-announced">
              Announced: <strong>{existing.motmName}</strong>
            </p>
          ) : (
            <>
              <AnnounceForm
                gameId={gameId}
                candidates={
                  tallies.length > 0
                    ? tallies.map((t) => t.playerName)
                    : playerNames
                }
                leading={tallies[0]?.playerName}
              />
              <VotingToggle gameId={gameId} open={existing.votingOpen} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AnnounceForm({
  gameId,
  candidates,
  leading,
}: {
  gameId: string;
  candidates: string[];
  leading?: string;
}) {
  const [state, formAction, pending] = useActionState(announceMotm, null);
  return (
    <form action={formAction} className="admin-announce-form">
      <input type="hidden" name="gameId" value={gameId} />
      <label>
        <span>Announce Player of the Match</span>
        <select name="playerName" required defaultValue={leading || ""}>
          <option value="" disabled>
            Select winner
          </option>
          {candidates.map((name) => (
            <option key={name} value={name}>
              {name}
              {leading === name ? " (leading)" : ""}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="dash-btn dash-btn-primary" disabled={pending}>
        {pending ? "…" : "Announce MOTM"}
      </button>
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
    </form>
  );
}

function VotingToggle({ gameId, open }: { gameId: string; open: boolean }) {
  const [, formAction, pending] = useActionState(setMotmVoting, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="open" value={open ? "0" : "1"} />
      <button type="submit" className="dash-btn dash-btn-ghost" disabled={pending}>
        {open ? "Close voting" : "Re-open voting"}
      </button>
    </form>
  );
}
