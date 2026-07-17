"use client";

import { useActionState } from "react";
import Link from "next/link";
import { adminLogin, type ActionResult } from "@/lib/actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(adminLogin, null);

  return (
    <div className="dash-login">
      <form action={formAction} className="dash-login-card">
        <div className="dash-brand compact">
          <span className="dash-brand-mark">FP</span>
          <div>
            <strong>Organizer login</strong>
            <p>MasterDevops & Dome only</p>
          </div>
        </div>
        <label className="dash-field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="you@email.com"
          />
        </label>
        <label className="dash-field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="dash-btn dash-btn-primary wide" disabled={pending}>
          {pending ? "Signing in…" : "Open dashboard"}
        </button>
        {state && !state.ok ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <Link href="/" className="dash-muted center">
          ← Back to public site
        </Link>
      </form>
    </div>
  );
}
