import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "football_prg_admin";

/** Only these emails may open /admin. Everyone else is refused. */
const ALLOWED_ADMIN_EMAILS = [
  "masterdevops05@gmail.com",
  // TODO: replace with Dome's real email when you send it
  "dome@footballprg.cz",
] as const;

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "football-prg-dev-secret-change-me"
  );
}

export function allowedAdminEmails(): string[] {
  return ALLOWED_ADMIN_EMAILS.map((e) => e.toLowerCase());
}

export function isAllowedAdminEmail(email: string): boolean {
  return allowedAdminEmails().includes(email.trim().toLowerCase());
}

/** @deprecated use isAllowedAdminEmail — kept for callers expecting a single email */
export function expectedAdminEmail(): string {
  return ALLOWED_ADMIN_EMAILS[0].toLowerCase();
}

export function expectedAdminPassword(): string {
  return "Asdf2026!";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createAdminSessionToken(email: string): string {
  const body = `${email.toLowerCase()}:${Date.now()}`;
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return false;
  try {
    const body = Buffer.from(encoded, "base64url").toString("utf8");
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const [email, ts] = body.split(":");
    if (!isAllowedAdminEmail(email)) return false;
    const age = Date.now() - Number(ts);
    if (!Number.isFinite(age) || age > 1000 * 60 * 60 * 24 * 14) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE)?.value);
}

export { COOKIE as ADMIN_COOKIE };
