import type { PlayerEventType, PrismaClient } from "@prisma/client";
import { nameKey } from "@/lib/time";

type EventDb = Pick<PrismaClient, "playerEvent">;

export async function recordPlayerEvent(
  db: EventDb,
  opts: {
    displayName: string;
    gameId?: string | null;
    type: PlayerEventType;
  },
) {
  const displayName = opts.displayName.trim();
  if (!displayName) return;
  const base = displayName.split(" + ")[0] || displayName;
  await db.playerEvent.create({
    data: {
      nameKey: nameKey(base),
      displayName,
      gameId: opts.gameId ?? null,
      type: opts.type,
    },
  });
}
