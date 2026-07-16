"use server";

import { ListType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateLeaveToken,
  generateManageCode,
  hashManageCode,
  normalizePlayerName,
  verifyManageCode,
} from "@/lib/codes";
import { prisma } from "@/lib/db";

export type ActionResult =
  | { ok: true; leaveToken?: string; manageCode?: string; gameId?: string }
  | { ok: false; error: string };

export async function createGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const venueName = String(formData.get("venueName") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const mapsUrl = String(formData.get("mapsUrl") || "").trim();
  const surface = String(formData.get("surface") || "").trim();
  const format = String(formData.get("format") || "").trim();
  const organizerName = String(formData.get("organizerName") || "").trim();
  const priceCzk = Number(formData.get("priceCzk"));
  const maxPlayers = Number(formData.get("maxPlayers") || 18);
  const subsNote = String(formData.get("subsNote") || "").trim() || null;
  const rules = String(formData.get("rules") || "").trim() || null;
  const venueId = String(formData.get("venueId") || "").trim() || null;

  if (
    !title ||
    !date ||
    !startTime ||
    !endTime ||
    !venueName ||
    !address ||
    !mapsUrl ||
    !surface ||
    !format ||
    !organizerName ||
    !Number.isFinite(priceCzk) ||
    priceCzk < 0 ||
    !Number.isFinite(maxPlayers) ||
    maxPlayers < 2
  ) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const manageCode = generateManageCode();
  const manageCodeHash = await hashManageCode(manageCode);

  const game = await prisma.game.create({
    data: {
      title,
      date: new Date(`${date}T12:00:00.000Z`),
      startTime,
      endTime,
      venueName,
      address,
      mapsUrl,
      surface,
      priceCzk,
      format,
      maxPlayers,
      subsNote,
      rules,
      organizerName,
      manageCodeHash,
      venueId,
    },
  });

  revalidatePath("/");
  revalidatePath("/venues");
  redirect(`/games/${game.id}?manageCode=${manageCode}`);
}

export async function joinGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") || "");
  const name = normalizePlayerName(String(formData.get("name") || ""));

  if (!gameId || name.length < 2) {
    return { ok: false, error: "Enter a name with at least 2 characters." };
  }

  try {
    const leaveToken = await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: { signups: true },
      });

      if (!game) {
        throw new Error("Game not found.");
      }

      const exists = game.signups.some(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      );
      if (exists) {
        throw new Error("That name is already on the list.");
      }

      const mainCount = game.signups.filter(
        (s) => s.listType === ListType.MAIN,
      ).length;
      const listType =
        mainCount < game.maxPlayers ? ListType.MAIN : ListType.WAITING;
      const position =
        game.signups.filter((s) => s.listType === listType).length + 1;
      const token = generateLeaveToken();

      await tx.signup.create({
        data: {
          gameId,
          name,
          listType,
          position,
          leaveToken: token,
        },
      });

      return token;
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    return { ok: true, leaveToken };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not join the game.",
    };
  }
}

export async function leaveGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") || "");
  const leaveToken = String(formData.get("leaveToken") || "");

  if (!gameId || !leaveToken) {
    return { ok: false, error: "Missing leave token." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const signup = await tx.signup.findFirst({
        where: { gameId, leaveToken },
      });
      if (!signup) {
        throw new Error("Spot not found — check your leave token.");
      }

      await tx.signup.delete({ where: { id: signup.id } });
      await compactList(tx, gameId, signup.listType);

      if (signup.listType === ListType.MAIN) {
        await promoteFromWaiting(tx, gameId);
      }
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not leave the game.",
    };
  }
}

export async function removePlayer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") || "");
  const signupId = String(formData.get("signupId") || "");
  const manageCode = String(formData.get("manageCode") || "");

  if (!gameId || !signupId || !manageCode) {
    return { ok: false, error: "Missing manage code or player." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) throw new Error("Game not found.");

      const valid = await verifyManageCode(manageCode, game.manageCodeHash);
      if (!valid) throw new Error("Incorrect manage code.");

      const signup = await tx.signup.findFirst({
        where: { id: signupId, gameId },
      });
      if (!signup) throw new Error("Player not found.");

      await tx.signup.delete({ where: { id: signup.id } });
      await compactList(tx, gameId, signup.listType);

      if (signup.listType === ListType.MAIN) {
        await promoteFromWaiting(tx, gameId);
      }
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not remove the player.",
    };
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function compactList(tx: Tx, gameId: string, listType: ListType) {
  const remaining = await tx.signup.findMany({
    where: { gameId, listType },
    orderBy: { position: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].position !== i + 1) {
      await tx.signup.update({
        where: { id: remaining[i].id },
        data: { position: i + 1 },
      });
    }
  }
}

async function promoteFromWaiting(tx: Tx, gameId: string) {
  const game = await tx.game.findUnique({
    where: { id: gameId },
    include: { signups: true },
  });
  if (!game) return;

  const mainCount = game.signups.filter(
    (s) => s.listType === ListType.MAIN,
  ).length;
  if (mainCount >= game.maxPlayers) return;

  const next = await tx.signup.findFirst({
    where: { gameId, listType: ListType.WAITING },
    orderBy: { position: "asc" },
  });
  if (!next) return;

  await tx.signup.update({
    where: { id: next.id },
    data: {
      listType: ListType.MAIN,
      position: mainCount + 1,
    },
  });
  await compactList(tx, gameId, ListType.WAITING);
}
