import { PrismaClient, ListType } from "@prisma/client";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { nextWeekdayDate } from "../src/lib/time";

const prisma = new PrismaClient();

async function addSignups(
  gameId: string,
  names: string[],
  listType: ListType = ListType.MAIN,
) {
  for (let i = 0; i < names.length; i++) {
    await prisma.signup.create({
      data: {
        gameId,
        name: names[i],
        listType,
        position: i + 1,
        leaveToken: nanoid(24),
      },
    });
  }
}

async function main() {
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

  const monday = nextWeekdayDate(1);
  const tuesday = nextWeekdayDate(2);
  const saturday = nextWeekdayDate(6);

  const mondayGame = await prisma.game.create({
    data: {
      title: "Monday night — Letna Park",
      date: monday,
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
      venueId: letna.id,
    },
  });

  await addSignups(mondayGame.id, [
    "Filip",
    "Filip+1",
    "Filip+2",
    "Ivan",
    "Valentyn",
    "Amir",
    "Alex",
    "Evgeny",
    "Vlad",
    "Denis",
    "David",
    "Yevhen+1",
    "Wahid",
    "Mahmud",
    "Andrii",
    "Yevhen",
    "Cesar",
    "Fernando",
    "Adys",
    "Amir+1",
  ]);

  const tuesdayGame = await prisma.game.create({
    data: {
      title: "Tuesday turf — Nove Butovice",
      date: tuesday,
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
      venueId: noveButovice.id,
    },
  });

  await addSignups(tuesdayGame.id, [
    "Daniel (bibs+ball)",
    "Alex",
    "Efrain Sandoval Gamarra",
    "Will",
    "Fahed",
  ]);

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
      allowPlusOne: false,
      paymentAccount: "8013985001",
      paymentBankCode: "5500",
      paymentMessage: "Saturday",
      rules:
        "Being on the list and not showing up results in a one week ban plus 60 CZK of the missed game.\nComplaining on the pitch will not be accepted and will result in a temporary ban.\nLeave cutoff: 1 hour before kickoff (after that only Dome can remove you).",
      organizerName: "Dome",
      manageCodeHash,
      venueId: noveButovice.id,
    },
  });

  await addSignups(saturdayGame.id, [
    "Dome (bibs+ball)",
    "antonio",
    "ricardo",
    "Will",
    "Zak",
    "Vineet",
    "Saini",
  ]);

  console.log("Seeded Monday / Tuesday / Saturday friendlies.");
  console.log("Organizer manage code: demo1234");
  console.log(`Monday:   /games/${mondayGame.id}`);
  console.log(`Tuesday:  /games/${tuesdayGame.id}`);
  console.log(`Saturday: /games/${saturdayGame.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
