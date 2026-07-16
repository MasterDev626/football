"use client";

import { useActionState, useEffect, useState } from "react";
import { joinGame, type ActionResult } from "@/lib/actions";

const STORAGE_PREFIX = "football-prg-leave:";

export function JoinForm({
  gameId,
  allowPlusOne,
}: {
  gameId: string;
  allowPlusOne: boolean;
}) {
  const [plusOne, setPlusOne] = useState(false);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(joinGame, null);

  useEffect(() => {
    if (state?.ok && state.leaveToken) {
      localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, state.leaveToken);
      window.dispatchEvent(new Event("football-prg-joined"));
    }
  }, [state, gameId]);

  return (
    <form action={formAction} className="join-form animate-rise">
      <div className="join-form-badge">Say &quot;in&quot; here</div>
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

      {allowPlusOne ? (
        <>
          <label className="check-row">
            <input
              type="checkbox"
              name="plusOne"
              checked={plusOne}
              onChange={(e) => setPlusOne(e.target.checked)}
            />
            <span>Bringing +1 (name required)</span>
          </label>
          {plusOne ? (
            <label className="field">
              <span>Guest name</span>
              <input
                name="guestName"
                type="text"
                required
                minLength={2}
                maxLength={40}
                placeholder="Friend's name"
              />
            </label>
          ) : null}
        </>
      ) : null}

      <button type="submit" className="btn-primary btn-pulse" disabled={pending}>
        {pending ? "Joining…" : "Join the list"}
      </button>
      {state && !state.ok ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="form-success" role="status">
          You&apos;re on the list. You can leave until 1 hour before kickoff.
        </p>
      ) : null}
    </form>
  );
}
