import { json, readJson, requireUser, validationError } from "@/lib/api";
import { parseFoodSchema } from "@/lib/validation";
import { AI_REQUEST_LIMIT, consumeAiRequest } from "@/lib/rate-limiter";
import { AiError, parseFoodText } from "@/lib/gemini";
import { rateLimited } from "@/lib/ai-response";

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await readJson(request);
  const parsed = parseFoodSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const limit = await consumeAiRequest(user.id);
  if (!limit.allowed) return rateLimited(limit);

  try {
    const items = await parseFoodText(parsed.data.text);
    // Returned as a preview only — the client confirms, then POSTs to /api/meals.
    return json({
      items,
      aiUsage: { limit: AI_REQUEST_LIMIT, remaining: limit.remaining },
    });
  } catch (err) {
    if (err instanceof AiError) return json({ error: err.message }, { status: err.status });
    throw err;
  }
}
