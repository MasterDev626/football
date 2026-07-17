"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions";

type ActionFn = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

export function AdminRemoveButton({
  gameId,
  signupId,
  action,
}: {
  gameId: string;
  signupId: string;
  action: ActionFn;
}) {
  const [, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="signupId" value={signupId} />
      <button type="submit" className="dash-btn dash-btn-ghost" disabled={pending}>
        Remove
      </button>
    </form>
  );
}

export function AdminBanForm({
  name,
  feeCzk,
  action,
}: {
  name: string;
  feeCzk: number;
  action: ActionFn;
}) {
  const [, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="feeCzk" value={feeCzk} />
      <input type="hidden" name="reason" value="No-show / late cancel" />
      <button type="submit" className="dash-btn dash-btn-danger" disabled={pending}>
        Ban
      </button>
    </form>
  );
}

export function AdminLiftButton({
  banId,
  action,
}: {
  banId: string;
  action: ActionFn;
}) {
  const [, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="banId" value={banId} />
      <button type="submit" className="dash-btn dash-btn-ghost" disabled={pending}>
        {pending ? "…" : "Clear"}
      </button>
    </form>
  );
}

export function ApproveRejectButtons({
  gameId,
  approveAction,
  rejectAction,
}: {
  gameId: string;
  approveAction: ActionFn;
  rejectAction: ActionFn;
}) {
  const [, approve, approving] = useActionState(approveAction, null);
  const [, reject, rejecting] = useActionState(rejectAction, null);

  return (
    <div className="dash-row-actions">
      <form action={approve}>
        <input type="hidden" name="gameId" value={gameId} />
        <button type="submit" className="dash-btn dash-btn-primary" disabled={approving}>
          {approving ? "…" : "Publish"}
        </button>
      </form>
      <form action={reject}>
        <input type="hidden" name="gameId" value={gameId} />
        <button type="submit" className="dash-btn dash-btn-ghost" disabled={rejecting}>
          Reject
        </button>
      </form>
    </div>
  );
}
