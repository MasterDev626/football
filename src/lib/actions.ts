"use server";

import { ListType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  expectedAdminPassword,
  isAdminAuthed,
  isAllowedAdminEmail,
} from "@/lib/admin";
import {
  generateLeaveToken,
  generateManageCode,
  hashManageCode,
  normalizePlayerName,
  verifyManageCode,
} from "@/lib/codes";
import { prisma } from "@/lib/db";
import { recordPlayerEvent } from "@/lib/events";
import { parseScorerLines, motmCandidateNames, VOTER_COOKIE } from "@/lib/motm";
import { isWithinLeaveCutoff, nameKey } from "@/lib/time";
import { nanoid } from "nanoid";

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
  const paymentAccount =
    String(formData.get("paymentAccount") || "").trim() || "8013985001";
  const paymentBankCode =
    String(formData.get("paymentBankCode") || "").trim() || "5500";
  const paymentMessage =
    String(formData.get("paymentMessage") || "").trim() || null;
  const allowPlusOne = formData.get("allowPlusOne") === "on";

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
  const admin = await isAdminAuthed();

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
      paymentAccount,
      paymentBankCode,
      paymentMessage,
      allowPlusOne,
      status: admin ? "APPROVED" : "PENDING",
      reviewedAt: admin ? new Date() : null,
      reviewedBy: admin ? "admin" : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/venues");
  revalidatePath("/admin");
  if (admin) {
    redirect(`/games/${game.id}?manageCode=${manageCode}`);
  }
  redirect(`/games/${game.id}?manageCode=${manageCode}&pending=1`);
}

export async function joinGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") || "");
  const name = normalizePlayerName(String(formData.get("name") || ""));
  const guestName =
    normalizePlayerName(String(formData.get("guestName") || "")) || null;
  const bringingPlusOne = formData.get("plusOne") === "on";

  if (!gameId || name.length < 2) {
    return { ok: false, error: "Enter a name with at least 2 characters." };
  }

  if (bringingPlusOne && (!guestName || guestName.length < 2)) {
    return {
      ok: false,
      error: "You can bring +1 only if you share their name.",
    };
  }

  try {
    const leaveToken = await prisma.$transaction(async (tx) => {
      const ban = await tx.ban.findUnique({
        where: { nameKey: nameKey(name) },
      });
      if (ban?.active) {
        throw new Error(
          `You're banned from registering (${ban.reason}). Pay any outstanding fee and ask Dome to clear you.`,
        );
      }

      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: { signups: true },
      });

      if (!game) {
        throw new Error("Game not found.");
      }

      if (game.status !== "APPROVED") {
        throw new Error(
          "This game is not live yet — waiting for organizer approval.",
        );
      }

      if (bringingPlusOne && !game.allowPlusOne) {
        throw new Error("This game does not allow +1 guests.");
      }

      const exists = game.signups.some(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      );
      if (exists) {
        throw new Error("That name is already on the list.");
      }

      const slotsNeeded = bringingPlusOne ? 2 : 1;
      const mainCount = game.signups.filter(
        (s) => s.listType === ListType.MAIN,
      ).length;
      const mainLeft = game.maxPlayers - mainCount;

      const token = generateLeaveToken();
      const displayName = bringingPlusOne
        ? `${name} + ${guestName}`
        : name;

      // Primary signup
      const listType =
        mainLeft >= 1 ? ListType.MAIN : ListType.WAITING;
      const position =
        game.signups.filter((s) => s.listType === listType).length + 1;

      await tx.signup.create({
        data: {
          gameId,
          name: displayName,
          guestName: bringingPlusOne ? guestName : null,
          listType,
          position,
          leaveToken: token,
        },
      });

      await recordPlayerEvent(tx, {
        displayName,
        gameId,
        type: "JOINED",
      });

      return token;
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    revalidatePath("/admin");
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
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) throw new Error("Game not found.");

      const signup = await tx.signup.findFirst({
        where: { gameId, leaveToken },
      });
      if (!signup) {
        throw new Error("Spot not found — check your leave token.");
      }

      if (isWithinLeaveCutoff(game.date, game.startTime)) {
        await recordPlayerEvent(tx, {
          displayName: signup.name,
          gameId,
          type: "LATE_LEAVE_BLOCKED",
        });
        throw new Error(
          `Too late to remove yourself (cutoff is 1 hour before kickoff). Stay on the list or pay ${game.priceCzk} CZK and ask Dome — late drops get a ban until Dome clears you.`,
        );
      }

      await tx.signup.delete({ where: { id: signup.id } });
      await recordPlayerEvent(tx, {
        displayName: signup.name,
        gameId,
        type: "LEFT",
      });
      await compactList(tx, gameId, signup.listType);

      if (signup.listType === ListType.MAIN) {
        await promoteFromWaiting(tx, gameId);
      }
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    revalidatePath("/admin");
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

  if (!gameId || !signupId) {
    return { ok: false, error: "Missing player." };
  }

  const admin = await isAdminAuthed();

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) throw new Error("Game not found.");

      if (!admin) {
        if (!manageCode) throw new Error("Missing manage code.");
        const valid = await verifyManageCode(manageCode, game.manageCodeHash);
        if (!valid) throw new Error("Incorrect manage code.");
      }

      const signup = await tx.signup.findFirst({
        where: { id: signupId, gameId },
      });
      if (!signup) throw new Error("Player not found.");

      await tx.signup.delete({ where: { id: signup.id } });
      await recordPlayerEvent(tx, {
        displayName: signup.name,
        gameId,
        type: "REMOVED",
      });
      await compactList(tx, gameId, signup.listType);

      if (signup.listType === ListType.MAIN) {
        await promoteFromWaiting(tx, gameId);
      }
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not remove the player.",
    };
  }
}

export async function adminLogin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!isAllowedAdminEmail(email) || password !== expectedAdminPassword()) {
    return {
      ok: false,
      error: "Access denied. Only authorized organizer emails can sign in.",
    };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createAdminSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function banPlayer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }

  const displayName = normalizePlayerName(String(formData.get("name") || ""));
  const reason = String(formData.get("reason") || "Late cancel / no-show").trim();
  const feeCzk = Number(formData.get("feeCzk") || 0);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (displayName.length < 2) {
    return { ok: false, error: "Enter a player name." };
  }

  await prisma.ban.upsert({
    where: { nameKey: nameKey(displayName) },
    create: {
      nameKey: nameKey(displayName),
      displayName,
      reason,
      feeCzk: Number.isFinite(feeCzk) ? feeCzk : 0,
      notes,
      active: true,
    },
    update: {
      displayName,
      reason,
      feeCzk: Number.isFinite(feeCzk) ? feeCzk : 0,
      notes,
      active: true,
      liftedAt: null,
      liftedBy: null,
    },
  });

  await recordPlayerEvent(prisma, {
    displayName,
    type: "BANNED",
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function liftBan(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }

  const banId = String(formData.get("banId") || "");
  if (!banId) return { ok: false, error: "Missing ban." };

  await prisma.ban.update({
    where: { id: banId },
    data: {
      active: false,
      liftedAt: new Date(),
      liftedBy: "Dome",
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function approveGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }
  const gameId = String(formData.get("gameId") || "");
  if (!gameId) return { ok: false, error: "Missing game." };

  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: "admin",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

export async function rejectGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }
  const gameId = String(formData.get("gameId") || "");
  if (!gameId) return { ok: false, error: "Missing game." };

  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: "admin",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

export async function adminForceLeave(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }

  formData.set("manageCode", "__admin__");
  // reuse remove with admin path
  const gameId = String(formData.get("gameId") || "");
  const signupId = String(formData.get("signupId") || "");
  if (!gameId || !signupId) return { ok: false, error: "Missing player." };

  try {
    await prisma.$transaction(async (tx) => {
      const signup = await tx.signup.findFirst({
        where: { id: signupId, gameId },
      });
      if (!signup) throw new Error("Player not found.");

      await tx.signup.delete({ where: { id: signup.id } });
      await recordPlayerEvent(tx, {
        displayName: signup.name,
        gameId,
        type: "REMOVED",
      });
      await compactList(tx, gameId, signup.listType);
      if (signup.listType === ListType.MAIN) {
        await promoteFromWaiting(tx, gameId);
      }
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not remove.",
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

export async function saveMatchResult(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }

  const gameId = String(formData.get("gameId") || "");
  const teamAName = String(formData.get("teamAName") || "Team A").trim() || "Team A";
  const teamBName = String(formData.get("teamBName") || "Team B").trim() || "Team B";
  const teamAScore = Number(formData.get("teamAScore"));
  const teamBScore = Number(formData.get("teamBScore"));
  const scorersA = String(formData.get("scorersA") || "");
  const scorersB = String(formData.get("scorersB") || "");
  const teamALineup =
    String(formData.get("teamALineup") || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n") || null;
  const teamBLineup =
    String(formData.get("teamBLineup") || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n") || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const votingOpen = formData.get("votingOpen") === "on";

  if (!gameId) return { ok: false, error: "Missing game." };
  if (
    !Number.isFinite(teamAScore) ||
    !Number.isFinite(teamBScore) ||
    teamAScore < 0 ||
    teamBScore < 0
  ) {
    return { ok: false, error: "Enter a valid score." };
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.status !== "APPROVED") {
    return { ok: false, error: "Game not found or not published." };
  }

  const goals = [
    ...parseScorerLines(scorersA, "A"),
    ...parseScorerLines(scorersB, "B"),
  ];

  await prisma.$transaction(async (tx) => {
    const existing = await tx.matchResult.findUnique({ where: { gameId } });
    if (existing) {
      await tx.matchGoal.deleteMany({ where: { matchResultId: existing.id } });
      await tx.matchResult.update({
        where: { id: existing.id },
        data: {
          teamAName,
          teamBName,
          teamAScore,
          teamBScore,
          teamALineup,
          teamBLineup,
          notes,
          votingOpen: existing.motmName ? false : votingOpen,
          goals: { create: goals },
        },
      });
    } else {
      await tx.matchResult.create({
        data: {
          gameId,
          teamAName,
          teamBName,
          teamAScore,
          teamBScore,
          teamALineup,
          teamBLineup,
          notes,
          votingOpen,
          goals: { create: goals },
        },
      });
    }
  });

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/");
  revalidatePath("/results");
  revalidatePath("/admin");
  return { ok: true };
}

export async function voteMotm(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") || "");
  const voterName = normalizePlayerName(String(formData.get("voterName") || ""));
  const playerName = normalizePlayerName(String(formData.get("playerName") || ""));

  if (!gameId) return { ok: false, error: "Missing game." };
  if (voterName.length < 2) return { ok: false, error: "Enter your name." };
  if (playerName.length < 2) {
    return { ok: false, error: "Pick a Player of the Match." };
  }

  const result = await prisma.matchResult.findUnique({
    where: { gameId },
    include: {
      game: { include: { signups: true } },
      goals: true,
    },
  });

  if (!result) return { ok: false, error: "No result posted yet." };
  if (!result.votingOpen || result.motmName) {
    return { ok: false, error: "Voting is closed for this match." };
  }

  const playerNameKey = nameKey(playerName);
  const candidates = new Set(
    motmCandidateNames({
      teamALineup: result.teamALineup,
      teamBLineup: result.teamBLineup,
      goals: result.goals,
      signupNames: result.game.signups.map((s) => s.name.split(" + ")[0]),
    }).map((n) => nameKey(n)),
  );

  if (candidates.size > 0 && !candidates.has(playerNameKey)) {
    return { ok: false, error: "Pick someone from Team A or Team B." };
  }

  const jar = await cookies();
  let voterKey = jar.get(VOTER_COOKIE)?.value;
  if (!voterKey) {
    voterKey = nanoid(24);
    jar.set(VOTER_COOKIE, voterKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  await prisma.motmVote.upsert({
    where: {
      matchResultId_voterKey: {
        matchResultId: result.id,
        voterKey,
      },
    },
    create: {
      matchResultId: result.id,
      voterKey,
      voterName,
      playerName,
      playerNameKey,
    },
    update: {
      voterName,
      playerName,
      playerNameKey,
    },
  });

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/admin");
  revalidatePath("/results");
  return { ok: true };
}

export async function announceMotm(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }

  const gameId = String(formData.get("gameId") || "");
  const playerName = normalizePlayerName(String(formData.get("playerName") || ""));
  if (!gameId || playerName.length < 2) {
    return { ok: false, error: "Pick a player to announce." };
  }

  const result = await prisma.matchResult.findUnique({ where: { gameId } });
  if (!result) return { ok: false, error: "Post the score first." };

  await prisma.matchResult.update({
    where: { id: result.id },
    data: {
      motmName: playerName,
      motmNameKey: nameKey(playerName),
      announcedAt: new Date(),
      votingOpen: false,
    },
  });

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/");
  revalidatePath("/results");
  revalidatePath("/admin");
  return { ok: true };
}

export async function setMotmVoting(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdminAuthed())) {
    return { ok: false, error: "Admin only." };
  }

  const gameId = String(formData.get("gameId") || "");
  const open = formData.get("open") === "1";
  if (!gameId) return { ok: false, error: "Missing game." };

  const result = await prisma.matchResult.findUnique({ where: { gameId } });
  if (!result) return { ok: false, error: "Post the score first." };
  if (result.motmName && open) {
    return { ok: false, error: "MOTM already announced — clear announcement first." };
  }

  await prisma.matchResult.update({
    where: { id: result.id },
    data: { votingOpen: open },
  });

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/admin");
  revalidatePath("/results");
  return { ok: true };
}
