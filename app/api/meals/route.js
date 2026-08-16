import { prisma } from "@/lib/prisma";
import { json, readJson, requireUser, validationError } from "@/lib/api";
import { dateSchema, mealSchema } from "@/lib/validation";
import { summarizeDay } from "@/lib/day";

export async function GET(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const raw = request.nextUrl.searchParams.get("date");
  const parsed = dateSchema.safeParse(raw ?? "");
  if (!parsed.success) return validationError(parsed.error);

  const meals = await prisma.mealLog.findMany({
    where: { userId: user.id, date: parsed.data },
    orderBy: { createdAt: "asc" },
  });

  return json({ date: parsed.data, meals, ...summarizeDay(meals, user) });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await readJson(request);
  const parsed = mealSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const meal = await prisma.mealLog.create({
    data: { ...parsed.data, userId: user.id },
  });

  return json({ meal }, { status: 201 });
}
