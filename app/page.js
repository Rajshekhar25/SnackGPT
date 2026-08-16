import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { publicUser } from "@/lib/api";
import { aiUsageFor } from "@/lib/rate-limiter";
import { Header } from "@/app/components/Header";
import { Dashboard } from "@/app/components/Dashboard";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const safeUser = publicUser(user);

  return (
    <>
      <Header user={safeUser} />
      <Dashboard user={safeUser} initialAiUsage={aiUsageFor(user)} />
    </>
  );
}
