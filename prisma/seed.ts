import { PrismaClient, ListType } from "@prisma/client";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  await prisma.signup.deleteMany();
  await prisma.game.deleteMany();
  await prisma.venue.deleteMany();

  const noveButovice = await prisma.venue.create({
    data: {
      name: "Nove Butovice (Mezi Skolami)",
      area: "Nove Butovice",
      address: "Mezi Skolami 2322, Praha 13",
      mapsUrl: "https://maps.app.goo.gl/CLAHKFApk2J4fgDT6",
      surface: "Artificial grass 3rd gen (turf, buttons)",
      notes: "Close to Nove Butovice metro station. Popular for weekend friendlies.",
    },
  });

  const letna = await prisma.venue.create({
    data: {
      name: "Letna park pitches",
      area: "Letna",
      address: "Letenske sady, Praha 7",
      mapsUrl: "https://maps.app.goo.gl/8nQbYxexample",
      surface: "Natural / mixed grass",
      notes: "Open park kickabouts — bring a ball. Weather dependent.",
    },
  });

  const manageCodeHash = await hash("demo1234", 10);

  // Next Saturday relative to seed run — use a fixed upcoming Saturday for demo
  const today = new Date();
  const day = today.getUTCDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setUTCDate(today.getUTCDate() + daysUntilSat);
  saturday.setUTCHours(12, 0, 0, 0);

  const friday = new Date(saturday);
  friday.setUTCDate(saturday.getUTCDate() - 1);

  const saturdayGame = await prisma.game.create({
    data: {
      title: "Saturday turf — Nove Butovice",
      date: saturday,
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
      rules:
        "Being on the list and not showing up results in a one week ban plus 60 CZK of the missed game.\nComplaining on the pitch will not be accepted and will result in a temporary ban.",
      organizerName: "Dome",
      manageCodeHash,
      venueId: noveButovice.id,
    },
  });

  const names = [
    "Dome (bibs+ball)",
    "antonio",
    "ricardo",
    "Will",
    "Zak",
    "Vineet",
    "Saini",
  ];

  for (let i = 0; i < names.length; i++) {
    await prisma.signup.create({
      data: {
        gameId: saturdayGame.id,
        name: names[i],
        listType: ListType.MAIN,
        position: i + 1,
        leaveToken: nanoid(24),
      },
    });
  }

  await prisma.game.create({
    data: {
      title: "Friday evening kickabout — Letna",
      date: friday,
      startTime: "18:00",
      endTime: "20:00",
      venueName: letna.name,
      address: letna.address,
      mapsUrl: letna.mapsUrl,
      surface: letna.surface,
      priceCzk: 0,
      format: "7vs7",
      maxPlayers: 14,
      subsNote: "Rolling subs",
      rules: "Friendly vibes only. Bring water. Prague friendlies — open to all levels.",
      organizerName: "Football PRG",
      manageCodeHash,
      venueId: letna.id,
    },
  });

  console.log("Seeded venues + demo games.");
  console.log("Demo organizer manage code: demo1234");
  console.log(`Saturday game: /games/${saturdayGame.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
