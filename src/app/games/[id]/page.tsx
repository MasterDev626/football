import Link from "next/link";
import { notFound } from "next/navigation";
import { ListType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatGameDate } from "@/lib/format";
import { JoinForm } from "@/components/join-form";
import { LeavePanel } from "@/components/leave-panel";
import { ManageBanner } from "@/components/manage-banner";
import { PlayerList } from "@/components/player-list";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return { title: "Game" };
  return { title: game.title };
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ manageCode?: string }>;
}) {
  const { id } = await params;
  const { manageCode } = await searchParams;

  const game = await prisma.game.findUnique({
    where: { id },
    include: { signups: { orderBy: { position: "asc" } } },
  });

  if (!game) notFound();

  const main = game.signups.filter((s) => s.listType === ListType.MAIN);
  const waiting = game.signups.filter((s) => s.listType === ListType.WAITING);

  return (
    <div className="shell detail-layout">
      <div>
        <ManageBanner gameId={game.id} manageCode={manageCode} />
        <article className="panel animate-rise">
          <p className="detail-kicker">{formatGameDate(game.date)}</p>
          <h1>{game.title}</h1>
          <dl className="detail-meta">
            <div>
              <dt>Time</dt>
              <dd>
                {game.startTime}–{game.endTime}
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                {game.venueName}
                <br />
                {game.address}
                <br />
                <a
                  href={game.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  Open in Maps →
                </a>
              </dd>
            </div>
            <div>
              <dt>Pitch</dt>
              <dd>{game.surface}</dd>
            </div>
            <div>
              <dt>Format & price</dt>
              <dd>
                {game.format}
                {game.subsNote ? ` · ${game.subsNote}` : ""} ·{" "}
                {game.priceCzk === 0 ? "Free" : `${game.priceCzk} CZK each`}
              </dd>
            </div>
            <div>
              <dt>Organizer</dt>
              <dd>{game.organizerName}</dd>
            </div>
          </dl>

          {game.rules ? (
            <div className="rules-box">{game.rules}</div>
          ) : null}

          <PlayerList
            gameId={game.id}
            title="Main list"
            slots={game.maxPlayers}
            players={main}
            maxPlayers={game.maxPlayers}
            manageMode
          />
          <PlayerList
            gameId={game.id}
            title="Waiting list"
            slots={0}
            players={waiting}
            manageMode
          />
        </article>
      </div>

      <aside>
        <JoinForm gameId={game.id} />
        <LeavePanel gameId={game.id} />
        <p className="form-hint" style={{ marginTop: "1rem" }}>
          <Link href="/" className="text-link">
            ← Back to games
          </Link>
        </p>
      </aside>
    </div>
  );
}
