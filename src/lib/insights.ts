import type { PlayerEvent } from "@prisma/client";

export type PlayerInsight = {
  nameKey: string;
  displayName: string;
  joins: number;
  leaves: number;
  removed: number;
  lateBlocked: number;
  bans: number;
  netShows: number;
  flakeScore: number;
};

export function buildPlayerInsights(events: PlayerEvent[]): {
  regulars: PlayerInsight[];
  flakes: PlayerInsight[];
  all: PlayerInsight[];
} {
  const map = new Map<string, PlayerInsight>();

  for (const e of events) {
    const row =
      map.get(e.nameKey) ??
      ({
        nameKey: e.nameKey,
        displayName: e.displayName.split(" + ")[0] || e.displayName,
        joins: 0,
        leaves: 0,
        removed: 0,
        lateBlocked: 0,
        bans: 0,
        netShows: 0,
        flakeScore: 0,
      } satisfies PlayerInsight);

    if (e.type === "JOINED") row.joins += 1;
    if (e.type === "LEFT") row.leaves += 1;
    if (e.type === "REMOVED") row.removed += 1;
    if (e.type === "LATE_LEAVE_BLOCKED") row.lateBlocked += 1;
    if (e.type === "BANNED") row.bans += 1;
    // Prefer latest display name casing
    row.displayName = e.displayName.split(" + ")[0] || e.displayName;
    map.set(e.nameKey, row);
  }

  const all = [...map.values()].map((r) => {
    const dropouts = r.leaves + r.removed;
    const denom = Math.max(r.joins, 1);
    return {
      ...r,
      netShows: Math.max(r.joins - dropouts, 0),
      flakeScore: dropouts / denom,
    };
  });

  // Only surface regulars after real repeat play — never invent history.
  const regulars = [...all]
    .filter((r) => r.joins >= 2)
    .sort((a, b) => b.joins - a.joins || a.flakeScore - b.flakeScore)
    .slice(0, 12);

  const flakes = [...all]
    .filter((r) => r.leaves + r.removed + r.lateBlocked > 0)
    .sort(
      (a, b) =>
        b.leaves + b.removed + b.lateBlocked - (a.leaves + a.removed + a.lateBlocked) ||
        b.flakeScore - a.flakeScore,
    )
    .slice(0, 12);

  return { regulars, flakes, all };
}
