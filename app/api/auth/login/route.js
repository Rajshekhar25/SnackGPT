import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { error, json, publicUser, readJson, validationError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export async function POST(request) {
  const body = await readJson(request);
  const parsed = loginSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message for "no such user" and "wrong password" so the endpoint
  // cannot be used to enumerate registered emails.
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return error("Incorrect email or password.", 401);

  await createSession(user.id);
  return json({ user: publicUser(user) });
}
