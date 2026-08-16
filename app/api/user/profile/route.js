import { prisma } from "@/lib/prisma";
import { error, json, publicUser, readJson, requireUser, validationError } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { calculateTargets } from "@/lib/nutrition";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  return json({ user: publicUser(user) });
}

export async function PUT(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await readJson(request);
  const parsed = profileSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const { autoCalculate, ...fields } = parsed.data;

  // Only overwrite keys the client actually sent, so a partial update from the
  // settings page can't blank out metrics it didn't render.
  const data = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) data[key] = value === "" ? null : value;
  }

  if (autoCalculate) {
    const merged = { ...user, ...data };
    const targets = calculateTargets(merged);
    if (!targets) {
      return error(
        "Add age, sex, height, weight and activity level before auto-calculating targets.",
        400
      );
    }
    Object.assign(data, targets);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return json({ user: publicUser(updated) });
}
