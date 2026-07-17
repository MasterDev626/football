import Link from "next/link";
import { notFound } from "next/navigation";
import { ListType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatGameDate } from "@/lib/format";
import { isWithinLeaveCutoff, leaveCutoffAt } from "@/lib/time";
import { JoinForm } from "@/components/join-form";
import { LeavePanel } from "@/components/leave-panel";
import { ManageBanner } from "@/components/manage-banner";
import { PaymentPanel } from "@/components/payment-panel";
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
  searchParams: Promise<{ manageCode?: string; pending?: string }>;
}) {
  const { id } = await params;
  const { manageCode, pending } = await searchParams;

  const game = await prisma.game.findUnique({
    where: { id },
    include: { signups: { orderBy: { position: "asc" } } },
  });

  if (!game) notFound();
  if (game.status === "REJECTED") notFound();

  const main = game.signups.filter((s) => s.listType === ListType.MAIN);
  const waiting = game.signups.filter((s) => s.listType === ListType.WAITING);
  const cutoffLocked = isWithinLeaveCutoff(game.date, game.startTime);
  const cutoff = leaveCutoffAt(game.date, game.startTime);
  const paymentMessage =
    game.paymentMessage ||
    formatGameDate(game.date).split(" ")[0] ||
    "Game";
  const isPending = game.status === "PENDING" || pending === "1";
  const canJoin = game.status === "APPROVED";

  return (
    <div className="shell detail-layout">
      <div>
        {isPending ? (
          <div className="pending-banner animate-rise" role="status">
            <strong>Awaiting admin approval</strong>
            <p>
              This game is not on the homepage yet. Players can&apos;t join until
              Dome / MasterDevops publishes it.
            </p>
          </div>
        ) : null}
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
            <div>
              <dt>Leave cutoff</dt>
              <dd>
                {cutoff.toLocaleString("en-GB", {
                  timeZone: "Europe/Prague",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                (1h before){" "}
                {cutoffLocked ? (
                  <span className="cutoff-badge locked">Locked</span>
                ) : (
                  <span className="cutoff-badge open">Open</span>
                )}
              </dd>
            </div>
          </dl>

          {game.rules ? <div className="rules-box">{game.rules}</div> : null}

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

        <PaymentPanel
          priceCzk={game.priceCzk}
          account={game.paymentAccount || "8013985001"}
          bankCode={game.paymentBankCode || "5500"}
          message={paymentMessage}
        />
      </div>

      <aside className="sticky-aside">
        {canJoin ? (
          <>
            <JoinForm gameId={game.id} allowPlusOne={game.allowPlusOne} />
            <LeavePanel
              gameId={game.id}
              cutoffLocked={cutoffLocked}
              priceCzk={game.priceCzk}
            />
          </>
        ) : (
          <div className="join-form">
            <p className="form-hint" style={{ margin: 0 }}>
              Joining opens after an admin publishes this game.
            </p>
          </div>
        )}
        <p className="form-hint" style={{ marginTop: "1rem" }}>
          <Link href="/" className="text-link">
            ← Back to games
          </Link>
        </p>
      </aside>
    </div>
  );
}
