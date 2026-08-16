import { prisma } from "@/lib/prisma";
import { error, json, requireUser } from "@/lib/api";

export async function DELETE(request, { params }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const meal = await prisma.mealLog.findUnique({ where: { id } });
  // 404 rather than 403 when it belongs to someone else, so the response can't
  // confirm that another user's meal id exists.
  if (!meal || meal.userId !== user.id) return error("Meal not found.", 404);

  await prisma.mealLog.delete({ where: { id } });
  return json({ ok: true });
}
