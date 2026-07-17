import { parseISO, isValid } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/** Format @db.Date game days using UTC calendar parts (stable across servers). */
export function formatGameDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return String(date);
  return formatInTimeZone(d, "UTC", "EEEE d.MM");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return String(date);
  return formatInTimeZone(d, "UTC", "EEE d.MM");
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function weekdayKey(date: Date): string {
  return WEEKDAYS[date.getUTCDay()];
}
