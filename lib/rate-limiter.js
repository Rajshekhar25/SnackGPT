import { prisma } from "./prisma.js";

export const AI_REQUEST_LIMIT = 5;
export const AI_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fixed-window rate limiter for the AI endpoints.
 *
 * The counter lives on the User row rather than in module scope because Vercel
 * runs each request in a stateless serverless invocation — an in-memory Map
 * would reset unpredictably and effectively disable the limit.
 *
 * Returns { allowed, remaining, retryAfter } where retryAfter is in seconds.
 */
export async function consumeAiRequest(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiRequestCount: true, aiRequestWindowStart: true },
  });
  if (!user) return { allowed: false, remaining: 0, retryAfter: AI_WINDOW_MS / 1000 };

  const now = Date.now();
  const windowAge = now - user.aiRequestWindowStart.getTime();

  // Window has rolled over: start a fresh one, this request being its first.
  if (windowAge >= AI_WINDOW_MS) {
    await prisma.user.update({
      where: { id: userId },
      data: { aiRequestCount: 1, aiRequestWindowStart: new Date(now) },
    });
    return { allowed: true, remaining: AI_REQUEST_LIMIT - 1, retryAfter: 0 };
  }

  if (user.aiRequestCount >= AI_REQUEST_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((AI_WINDOW_MS - windowAge) / 1000),
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { aiRequestCount: { increment: 1 } },
    select: { aiRequestCount: true },
  });

  return {
    allowed: true,
    remaining: Math.max(0, AI_REQUEST_LIMIT - updated.aiRequestCount),
    retryAfter: 0,
  };
}

/** Read-only view of the same window, for the "X of 5 left" UI counter. */
export function aiUsageFor(user) {
  const windowAge = Date.now() - user.aiRequestWindowStart.getTime();
  const used = windowAge >= AI_WINDOW_MS ? 0 : user.aiRequestCount;

  return {
    limit: AI_REQUEST_LIMIT,
    used,
    remaining: Math.max(0, AI_REQUEST_LIMIT - used),
  };
}
