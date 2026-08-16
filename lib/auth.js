import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma.js";

export const SESSION_COOKIE = "session_token";
const SESSION_TTL_DAYS = 7;

function expiryDate() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Create a database-backed session and set it as an HttpOnly cookie.
 *
 * The token is 32 random bytes used directly as the Session row's primary key.
 * There is no signature and no secret: an attacker cannot forge a token because
 * guessing a row that exists in Postgres is the whole attack, and the lookup in
 * getSession() *is* the validation step.
 */
export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.session.create({
    data: { id: token, userId, expiresAt: expiryDate() },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiryDate(),
  });

  return token;
}

/** Returns the logged-in User row, or null. */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Expired tokens are garbage-collected lazily, on the request that finds them.
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}
