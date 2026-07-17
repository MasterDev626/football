import type { MatchGoal, MotmVote } from "@prisma/client";
import { nameKey } from "@/lib/time";

export type MotmTally = {
  playerName: string;
  playerNameKey: string;
  votes: number;
};

export function tallyMotmVotes(votes: MotmVote[]): MotmTally[] {
  const map = new Map<string, MotmTally>();
  for (const v of votes) {
    const row =
      map.get(v.playerNameKey) ??
      ({
        playerName: v.playerName,
        playerNameKey: v.playerNameKey,
        votes: 0,
      } satisfies MotmTally);
    row.votes += 1;
    row.playerName = v.playerName;
    map.set(v.playerNameKey, row);
  }
  return [...map.values()].sort(
    (a, b) => b.votes - a.votes || a.playerName.localeCompare(b.playerName),
  );
}

export function parseScorerLines(
  text: string,
  team: "A" | "B",
): { scorerName: string; scorerNameKey: string; team: string; minute: number | null }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, minutePart] = line.split(/[|,]/).map((s) => s.trim());
      const minute = minutePart ? Number(minutePart) : null;
      return {
        scorerName: namePart,
        scorerNameKey: nameKey(namePart),
        team,
        minute: Number.isFinite(minute) ? minute : null,
      };
    })
    .filter((g) => g.scorerName.length >= 2);
}

export function goalsByTeam(goals: MatchGoal[]) {
  return {
    a: goals.filter((g) => g.team === "A"),
    b: goals.filter((g) => g.team === "B"),
  };
}

export const VOTER_COOKIE = "football_prg_voter";
