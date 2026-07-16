import { prisma } from "@/lib/db";
import { CreateGameForm } from "@/components/create-game-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Post a friendly",
};

export default async function NewGamePage() {
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      mapsUrl: true,
      surface: true,
    },
  });

  return (
    <div className="shell section" style={{ paddingTop: "2.5rem" }}>
      <h1 className="page-title">Post a friendly</h1>
      <p className="page-lead">
        Same details as the group chat message — date, pitch, price, house rules
        — plus a live main list and waiting list.
      </p>
      <CreateGameForm venues={venues} />
    </div>
  );
}
