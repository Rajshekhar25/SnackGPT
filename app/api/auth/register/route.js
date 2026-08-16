import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { error, json, publicUser, readJson, validationError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";

export async function POST(request) {
  const body = await readJson(request);
  const parsed = registerSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return error("An account with that email already exists.", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  await createSession(user.id);
  return json({ user: publicUser(user) }, { status: 201 });
}
