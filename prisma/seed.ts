import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { nextWeekdayDate } from "../src/lib/time";

const prisma = new PrismaClient();

async function main() {
  await prisma.playerEvent.deleteMany();
  await prisma.signup.deleteMany();
  await prisma.game.deleteMany();
  await prisma.ban.deleteMany();
  await prisma.venue.deleteMany();

  const letna = await prisma.venue.create({
    data: {
      name: "Letna Park",
      area: "Letna",
      address: "Letenske sady, Praha 7",
      mapsUrl: "https://maps.app.goo.gl/hPS65gxfvNNwuBci9",
      surface: "Artificial grass 3rd gen (turf)",
      notes: "Monday friendlies — 7vs7. You can bring +1 (name required).",
    },
  });

  const noveButovice = await prisma.venue.create({
    data: {
      name: "Nove Butovice (Mezi Skolami)",
      area: "Nove Butovice",
      address: "Mezi Skolami 2322, Praha 13",
      mapsUrl: "https://maps.app.goo.gl/CLAHKFApk2J4fgDT6",
      surface: "Artificial grass 3rd gen (turf, buttons)",
      notes: "Close to Nove Butovice metro. Tuesday + Saturday friendlies.",
    },
  });

  const manageCodeHash = await hash("demo1234", 10);
  const reviewedAt = new Date();

  const monday = await prisma.game.create({
    data: {
      title: "Monday night — Letna Park",
      date: nextWeekdayDate(1),
      startTime: "21:00",
      endTime: "23:00",
      venueName: letna.name,
      address: letna.address,
      mapsUrl: letna.mapsUrl,
      surface: letna.surface,
      priceCzk: 100,
      format: "7vs7",
      maxPlayers: 21,
      subsNote: "Teams 7vs7",
      allowPlusOne: true,
      paymentAccount: "8013985001",
      paymentBankCode: "5500",
      paymentMessage: "Monday",
      rules:
        "You can bring only +1 and I need to know the name.\nList goes up — feel free to invite a friend.\nDon't turn up on the day = banned until you pay + 1 week.\nBad behaviour and complaints on the pitch will result in a temporary ban.\nLeave cutoff: 1 hour before kickoff (after that only Dome can remove you).",
      organizerName: "Dome",
      manageCodeHash,
      status: "APPROVED",
      reviewedAt,
      reviewedBy: "seed",
      seriesKey: "mon-letna",
      recurringWeekday: 1,
      venueId: letna.id,
    },
  });

  const tuesday = await prisma.game.create({
    data: {
      title: "Tuesday turf — Nove Butovice",
      date: nextWeekdayDate(2),
      startTime: "17:45",
      endTime: "20:00",
      venueName: noveButovice.name,
      address: noveButovice.address,
      mapsUrl: noveButovice.mapsUrl,
      surface: noveButovice.surface,
      priceCzk: 60,
      format: "9vs9",
      maxPlayers: 18,
      subsNote: "9vs9, each team",
      allowPlusOne: false,
      paymentAccount: "8013985001",
      paymentBankCode: "5500",
      paymentMessage: "Tuesday",
      rules:
        "Being on the list and not showing up on the day results in a one week ban plus 60 CZK of the missed game.\nComplaining on the pitch will not be accepted and will result in a temporary ban.\nLeave cutoff: 1 hour before kickoff (after that only Dome can remove you).",
      organizerName: "Dome",
      manageCodeHash,
      status: "APPROVED",
      reviewedAt,
      reviewedBy: "seed",
      seriesKey: "tue-butovice",
      recurringWeekday: 2,
      venueId: noveButovice.id,
    },
  });

  const saturday = await prisma.game.create({
    data: {
      title: "Saturday turf — Nove Butovice",
      date: nextWeekdayDate(6),
      startTime: "13:30",
      endTime: "16:00",
      venueName: noveButovice.name,
      address: noveButovice.address,
      mapsUrl: noveButovice.mapsUrl,
      surface: noveButovice.surface,
      priceCzk: 60,
      format: "9vs9",
      maxPlayers: 18,
      subsNote: "0 sub each team",
      allowPlusOne: false,
      paymentAccount: "8013985001",
      paymentBankCode: "5500",
      paymentMessage: "Saturday",
      rules:
        "Being on the list and not showing up results in a one week ban plus 60 CZK of the missed game.\nComplaining on the pitch will not be accepted and will result in a temporary ban.\nLeave cutoff: 1 hour before kickoff (after that only Dome can remove you).",
      organizerName: "Dome",
      manageCodeHash,
      status: "APPROVED",
      reviewedAt,
      reviewedBy: "seed",
      seriesKey: "sat-butovice",
      recurringWeekday: 6,
      venueId: noveButovice.id,
    },
  });

  console.log("Seeded empty weekly series (0 signups, 0 player history).");
  console.log("Organizer manage code: demo1234");
  console.log(`Monday:   /games/${monday.id}`);
  console.log(`Tuesday:  /games/${tuesday.id}`);
  console.log(`Saturday: /games/${saturday.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
