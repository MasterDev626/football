import { fromZonedTime } from "date-fns-tz";

const PRAGUE = "Europe/Prague";

/** Today's calendar date in Prague, noon UTC (for @db.Date comparisons). */
export function pragueCalendarDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAGUE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Kickoff instant for a game date (@db.Date) + HH:mm wall time in Prague. */
export function gameKickoff(date: Date, startTime: string): Date {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const time = String(startTime).slice(0, 5);
  return fromZonedTime(`${y}-${m}-${d}T${time}:00`, PRAGUE);
}

export function leaveCutoffAt(date: Date, startTime: string): Date {
  return new Date(gameKickoff(date, startTime).getTime() - 60 * 60 * 1000);
}

export function isWithinLeaveCutoff(
  date: Date,
  startTime: string,
  now = new Date(),
): boolean {
  return now.getTime() >= leaveCutoffAt(date, startTime).getTime();
}

export function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Next occurrence of weekday (0=Sun … 6=Sat), noon UTC for @db.Date storage.
 *  If `from` is already that weekday, returns the following week. */
export function nextWeekdayDate(weekday: number, from = new Date()): Date {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12),
  );
  const current = d.getUTCDay();
  let add = (weekday - current + 7) % 7;
  if (add === 0) add = 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d;
}

/** Same weekday on or after `from` (includes today when it matches). */
export function nextWeekdayOnOrAfter(weekday: number, from = new Date()): Date {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12),
  );
  const current = d.getUTCDay();
  const add = (weekday - current + 7) % 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d;
}
