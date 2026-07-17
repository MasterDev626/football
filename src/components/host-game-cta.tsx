import Link from "next/link";

export function HostGameCta() {
  return (
    <section className="shell section" id="host">
      <div className="host-cta liquid-glass">
        <div>
          <p className="section-kicker">Got a pitch?</p>
          <h2>Request a game</h2>
          <p>
            Post your friendly for review. It stays off the homepage until Dome
            / MasterDevops approves it — then everyone can join the list.
          </p>
        </div>
        <Link href="/games/new" className="btn-primary glass-btn-solid">
          Submit a game for approval
        </Link>
      </div>
    </section>
  );
}
