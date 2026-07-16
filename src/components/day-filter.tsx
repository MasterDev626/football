"use client";

import { useRouter, useSearchParams } from "next/navigation";

const DAYS = [
  { key: "all", label: "All" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
  { key: "weekday", label: "Weekdays" },
] as const;

export function DayFilter({ active }: { active: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(day: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (day === "all") params.delete("day");
    else params.set("day", day);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="day-filter" role="tablist" aria-label="Filter by day">
      {DAYS.map((day) => (
        <button
          key={day.key}
          type="button"
          role="tab"
          aria-selected={active === day.key}
          className={`day-chip ${active === day.key ? "is-active" : ""}`}
          onClick={() => select(day.key)}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
}
