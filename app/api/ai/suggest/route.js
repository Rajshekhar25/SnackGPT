import { prisma } from "@/lib/prisma";
import { json, readJson, requireUser, validationError } from "@/lib/api";
import { suggestSchema } from "@/lib/validation";
import { summarizeDay } from "@/lib/day";
import { AI_REQUEST_LIMIT, consumeAiRequest } from "@/lib/rate-limiter";
import { AiError, suggestMeals } from "@/lib/gemini";
import { rateLimited } from "@/lib/ai-response";

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await readJson(request);
  const parsed = suggestSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const meals = await prisma.mealLog.findMany({
    where: { userId: user.id, date: parsed.data.date },
  });
  const { remaining } = summarizeDay(meals, user);

  const limit = await consumeAiRequest(user.id);
  if (!limit.allowed) return rateLimited(limit);

  try {
    const suggestions = await suggestMeals({
      remaining,
      healthConditions: user.healthConditions,
      dietaryPref: user.dietaryPref,
    });
    return json({
      suggestions,
      remaining,
      aiUsage: { limit: AI_REQUEST_LIMIT, remaining: limit.remaining },
    });
  } catch (err) {
    if (err instanceof AiError) return json({ error: err.message }, { status: err.status });
    throw err;
  }
}
