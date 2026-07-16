import Link from "next/link";
import { prisma } from "@/lib/db";
import { MapPinIcon, PitchIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Venues",
};

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { area: "asc" },
  });

  return (
    <div className="shell section" style={{ paddingTop: "2.5rem" }}>
      <h1 className="page-title">Where to play in Prague</h1>
      <p className="page-lead">
        Spots people use for friendlies. New in town and not in a WhatsApp group?
        Start here, then grab a game.
      </p>

      {venues.length === 0 ? (
        <div className="empty-state">
          No venues seeded yet.{" "}
          <Link href="/games/new" className="text-link">
            Post a game with a custom location →
          </Link>
        </div>
      ) : (
        <div className="venue-grid">
          {venues.map((venue) => (
            <article key={venue.id} className="venue-card animate-rise">
              <p className="venue-area">{venue.area}</p>
              <h2>{venue.name}</h2>
              <p>
                <MapPinIcon className="meta-icon" style={{ display: "inline" }} />{" "}
                {venue.address}
              </p>
              <p>
                <PitchIcon className="meta-icon" style={{ display: "inline" }} />{" "}
                {venue.surface}
              </p>
              {venue.notes ? <p>{venue.notes}</p> : null}
              <p>
                <a
                  href={venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  Open in Maps →
                </a>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
