import { AI_REQUEST_LIMIT } from "./rate-limiter.js";

/** Shared 429 payload for both AI endpoints. */
export function rateLimited({ retryAfter }) {
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));

  return Response.json(
    {
      error: `AI limit reached (${AI_REQUEST_LIMIT} requests per hour). Try again in about ${minutes} minute${
        minutes === 1 ? "" : "s"
      }, or add the food manually.`,
      retryAfter,
      aiUsage: { limit: AI_REQUEST_LIMIT, remaining: 0 },
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
