import { prisma } from "@/lib/db";
import { nextWeekdayOnOrAfter, pragueCalendarDate } from "@/lib/time";

/**
 * For each weekly series, if the latest published game is in the past and
 * there is no upcoming instance, create the next week with an empty list (0).
 * Safe to call on every homepage / admin load.
 */
export async function ensureWeeklyGames(): Promise<number> {
  const today = pragueCalendarDate();

  const recurring = await prisma.game.findMany({
    where: {
      status: "APPROVED",
      seriesKey: { not: null },
      recurringWeekday: { not: null },
    },
    orderBy: { date: "desc" },
  });

  const bySeries = new Map<string, (typeof recurring)[number][]>();
  for (const game of recurring) {
    if (!game.seriesKey) continue;
    const list = bySeries.get(game.seriesKey) ?? [];
    list.push(game);
    bySeries.set(game.seriesKey, list);
  }

  let created = 0;

  for (const [, games] of bySeries) {
    const hasUpcoming = games.some((g) => g.date.getTime() >= today.getTime());
    if (hasUpcoming) continue;

    const template = games[0];
    if (template.recurringWeekday == null) continue;

    const nextDate = nextWeekdayOnOrAfter(template.recurringWeekday, today);

    const exists = await prisma.game.findFirst({
      where: {
        seriesKey: template.seriesKey!,
        date: nextDate,
        status: { in: ["APPROVED", "PENDING"] },
      },
    });
    if (exists) continue;

    await prisma.game.create({
      data: {
        title: template.title,
        date: nextDate,
        startTime: template.startTime,
        endTime: template.endTime,
        venueName: template.venueName,
        address: template.address,
        mapsUrl: template.mapsUrl,
        surface: template.surface,
        priceCzk: template.priceCzk,
        format: template.format,
        maxPlayers: template.maxPlayers,
        subsNote: template.subsNote,
        allowPlusOne: template.allowPlusOne,
        paymentAccount: template.paymentAccount,
        paymentBankCode: template.paymentBankCode,
        paymentMessage: template.paymentMessage,
        rules: template.rules,
        organizerName: template.organizerName,
        manageCodeHash: template.manageCodeHash,
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: "auto-roll",
        seriesKey: template.seriesKey,
        recurringWeekday: template.recurringWeekday,
        venueId: template.venueId,
      },
    });
    created += 1;
  }

  return created;
}
