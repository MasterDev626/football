"use client";

import { useActionState, useState } from "react";
import type { Signup } from "@prisma/client";
import { removePlayer, type ActionResult } from "@/lib/actions";

export function PlayerList({
  gameId,
  title,
  slots,
  players,
  maxPlayers,
  manageMode,
}: {
  gameId: string;
  title: string;
  slots: number;
  players: Signup[];
  maxPlayers?: number;
  manageMode?: boolean;
}) {
  const rows =
    slots > 0
      ? Array.from({ length: slots }, (_, i) => players[i] ?? null)
      : players;

  return (
    <section className="player-list animate-rise">
      <div className="player-list-head">
        <h2>{title}</h2>
        {typeof maxPlayers === "number" ? (
          <span>
            {players.length}/{maxPlayers}
          </span>
        ) : (
          <span>{players.length}</span>
        )}
      </div>
      <ol className="roster">
        {rows.length === 0 ? (
          <li className="roster-empty">No one waiting yet</li>
        ) : (
          rows.map((player, index) => (
            <li
              key={player?.id ?? `empty-${index}`}
              className={`roster-row ${player ? "is-filled" : ""}`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="roster-num">{index + 1}.</span>
              <span className="roster-name">{player?.name ?? ""}</span>
              {manageMode && player ? (
                <ManageRemove gameId={gameId} signupId={player.id} />
              ) : null}
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

function ManageRemove({
  gameId,
  signupId,
}: {
  gameId: string;
  signupId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    removePlayer,
    null,
  );

  if (!open) {
    return (
      <button
        type="button"
        className="btn-tiny"
        onClick={() => setOpen(true)}
        aria-label="Remove player"
      >
        ×
      </button>
    );
  }

  return (
    <form action={formAction} className="inline-manage">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="signupId" value={signupId} />
      <input
        name="manageCode"
        type="password"
        placeholder="Manage code"
        required
        autoComplete="off"
      />
      <button type="submit" className="btn-tiny" disabled={pending}>
        OK
      </button>
      {state && !state.ok ? <span className="form-error">{state.error}</span> : null}
    </form>
  );
}
