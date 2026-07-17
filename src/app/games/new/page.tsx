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
        Submit your game for review. It appears on the homepage only after
        Dome / MasterDevops approves it in Admin.
      </p>
      <CreateGameForm venues={venues} />
    </div>
  );
}
