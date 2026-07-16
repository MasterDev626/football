import { compare, hash } from "bcryptjs";
import { nanoid } from "nanoid";

export function generateManageCode(): string {
  return nanoid(8);
}

export function generateLeaveToken(): string {
  return nanoid(24);
}

export async function hashManageCode(code: string): Promise<string> {
  return hash(code, 10);
}

export async function verifyManageCode(
  code: string,
  codeHash: string,
): Promise<boolean> {
  return compare(code, codeHash);
}

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
