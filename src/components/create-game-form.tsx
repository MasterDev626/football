"use client";

import { useActionState } from "react";
import { createGame, type ActionResult } from "@/lib/actions";

type VenueOption = {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  surface: string;
};

const DEFAULT_RULES = `Being on the list and not showing up on the day results in a one week ban plus the fee of the missed game.
Complaining on the pitch will not be accepted and will result in a temporary ban.`;

export function CreateGameForm({ venues }: { venues: VenueOption[] }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createGame,
    null,
  );

  function applyVenue(e: React.ChangeEvent<HTMLSelectElement>) {
    const venue = venues.find((v) => v.id === e.target.value);
    if (!venue) return;
    const form = e.target.form;
    if (!form) return;
    (form.elements.namedItem("venueName") as HTMLInputElement).value = venue.name;
    (form.elements.namedItem("address") as HTMLInputElement).value = venue.address;
    (form.elements.namedItem("mapsUrl") as HTMLInputElement).value = venue.mapsUrl;
    (form.elements.namedItem("surface") as HTMLInputElement).value = venue.surface;
  }

  return (
    <form action={formAction} className="create-form animate-rise">
      <label className="field">
        <span>Title</span>
        <input
          name="title"
          required
          placeholder="Saturday turf — Nove Butovice"
        />
      </label>

      <label className="field">
        <span>Prefill from venue</span>
        <select name="venueId" defaultValue="" onChange={applyVenue}>
          <option value="">Custom location</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>

      <div className="field-grid">
        <label className="field">
          <span>Date</span>
          <input name="date" type="date" required />
        </label>
        <label className="field">
          <span>Start</span>
          <input name="startTime" type="time" required defaultValue="13:30" />
        </label>
        <label className="field">
          <span>End</span>
          <input name="endTime" type="time" required defaultValue="16:00" />
        </label>
      </div>

      <label className="field">
        <span>Venue name</span>
        <input name="venueName" required placeholder="Nove Butovice" />
      </label>
      <label className="field">
        <span>Address</span>
        <input
          name="address"
          required
          placeholder="Mezi Skolami 2322"
        />
      </label>
      <label className="field">
        <span>Maps link</span>
        <input
          name="mapsUrl"
          type="url"
          required
          placeholder="https://maps.app.goo.gl/..."
        />
      </label>
      <label className="field">
        <span>Surface</span>
        <input
          name="surface"
          required
          placeholder="Artificial grass 3rd gen"
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>Format</span>
          <input name="format" required defaultValue="9vs9" />
        </label>
        <label className="field">
          <span>Price (CZK)</span>
          <input name="priceCzk" type="number" min={0} required defaultValue={60} />
        </label>
        <label className="field">
          <span>Main list size</span>
          <input
            name="maxPlayers"
            type="number"
            min={2}
            max={40}
            required
            defaultValue={18}
          />
        </label>
      </div>

      <label className="field">
        <span>Subs note</span>
        <input name="subsNote" placeholder="0 sub each team" />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Pay account</span>
          <input name="paymentAccount" defaultValue="8013985001" />
        </label>
        <label className="field">
          <span>Bank code</span>
          <input name="paymentBankCode" defaultValue="5500" />
        </label>
        <label className="field">
          <span>Payment message</span>
          <input name="paymentMessage" placeholder="Tuesday" />
        </label>
      </div>
      <label className="check-row">
        <input type="checkbox" name="allowPlusOne" />
        <span>Allow +1 (guest name required)</span>
      </label>
      <label className="field">
        <span>Your name (organizer)</span>
        <input name="organizerName" required placeholder="Dome" defaultValue="Dome" />
      </label>
      <label className="field">
        <span>House rules</span>
        <textarea name="rules" rows={4} defaultValue={DEFAULT_RULES} />
      </label>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Posting…" : "Post friendly"}
      </button>
      {state && !state.ok ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <p className="form-hint">
        After posting you get a manage code — save it to edit the list.
      </p>
    </form>
  );
}
