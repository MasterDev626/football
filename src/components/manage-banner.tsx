"use client";

import { useEffect, useState } from "react";

export function ManageBanner({
  gameId,
  manageCode,
}: {
  gameId: string;
  manageCode?: string;
}) {
  const [code, setCode] = useState<string | null>(manageCode ?? null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (manageCode) {
      localStorage.setItem(`football-prg-manage:${gameId}`, manageCode);
      setCode(manageCode);
      const url = new URL(window.location.href);
      url.searchParams.delete("manageCode");
      window.history.replaceState({}, "", url.pathname);
    } else {
      setCode(localStorage.getItem(`football-prg-manage:${gameId}`));
    }
  }, [gameId, manageCode]);

  if (!code) return null;

  return (
    <div className="manage-banner animate-rise" role="status">
      <div>
        <strong>Organizer manage code</strong>
        <p>
          Save this code — you need it to remove players. It won&apos;t be shown
          again from the server.
        </p>
        <code>{code}</code>
      </div>
      <button
        type="button"
        className="btn-ghost"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
