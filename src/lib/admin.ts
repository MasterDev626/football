import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "football_prg_admin";

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "football-prg-dev-secret-change-me"
  );
}

export function expectedAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "dome@footballprg.cz").toLowerCase();
}

export function expectedAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "dome-admin";
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
    if (email.toLowerCase() !== expectedAdminEmail()) return false;
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
