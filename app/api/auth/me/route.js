import { getSession } from "@/lib/auth";
import { json, publicUser } from "@/lib/api";
import { aiUsageFor } from "@/lib/rate-limiter";

export async function GET() {
  const user = await getSession();
  if (!user) return json({ user: null });

  return json({ user: publicUser(user), aiUsage: aiUsageFor(user) });
}
