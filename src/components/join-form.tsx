"use client";

import { useActionState, useEffect } from "react";
import { joinGame, type ActionResult } from "@/lib/actions";

const STORAGE_PREFIX = "football-prg-leave:";

export function JoinForm({ gameId }: { gameId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    joinGame,
    null,
  );

  useEffect(() => {
    if (state?.ok && state.leaveToken) {
      localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, state.leaveToken);
      window.dispatchEvent(new Event("football-prg-joined"));
    }
  }, [state, gameId]);

  return (
    <form action={formAction} className="join-form animate-rise">
      <input type="hidden" name="gameId" value={gameId} />
      <label className="field">
        <span>Your name</span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={40}
          placeholder="e.g. Will"
          autoComplete="nickname"
        />
      </label>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Joining…" : "Join the list"}
      </button>
      {state && !state.ok ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="form-success" role="status">
          You&apos;re on the list. Keep this tab — you can leave anytime from
          below.
        </p>
      ) : null}
    </form>
  );
}
