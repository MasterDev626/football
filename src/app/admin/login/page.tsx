"use client";

import { useActionState } from "react";
import { adminLogin, type ActionResult } from "@/lib/actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(adminLogin, null);

  return (
    <div className="shell section admin-shell">
      <h1 className="page-title">Dome admin</h1>
      <p className="page-lead">
        Sign in with your admin email to see who&apos;s joining, remove players
        after cutoff, and clear bans.
      </p>
      <form action={formAction} className="create-form animate-rise">
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="your@email.com"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Signing in…" : "Open dashboard"}
        </button>
        {state && !state.ok ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
