import { format, parseISO, isValid } from "date-fns";

export function formatGameDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return String(date);
  return format(d, "EEEE d.MM");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return String(date);
  return format(d, "EEE d.MM");
}

export function weekdayKey(date: Date): string {
  return format(date, "EEEE").toLowerCase();
}
