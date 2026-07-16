"use client";

import { useActionState, useEffect, useState } from "react";
import { leaveGame, type ActionResult } from "@/lib/actions";

const STORAGE_PREFIX = "football-prg-leave:";

export function LeavePanel({ gameId }: { gameId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    leaveGame,
    null,
  );

  useEffect(() => {
    function sync() {
      setToken(localStorage.getItem(`${STORAGE_PREFIX}${gameId}`));
    }
    sync();
    window.addEventListener("football-prg-joined", sync);
    return () => window.removeEventListener("football-prg-joined", sync);
  }, [gameId]);

  useEffect(() => {
    if (state?.ok) {
      localStorage.removeItem(`${STORAGE_PREFIX}${gameId}`);
      setToken(null);
    }
  }, [state, gameId]);

  if (!token) return null;

  return (
    <form action={formAction} className="leave-panel">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="leaveToken" value={token} />
      <p>You&apos;re signed up on this device.</p>
      <button type="submit" className="btn-ghost" disabled={pending}>
        {pending ? "Leaving…" : "Leave the list"}
      </button>
      {state && !state.ok ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
