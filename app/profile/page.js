import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { publicUser } from "@/lib/api";
import { Header } from "@/app/components/Header";
import { ProfileForm } from "@/app/components/ProfileForm";

export const metadata = { title: "Profile — SnackGPT" };

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const safeUser = publicUser(user);

  return (
    <>
      <Header user={safeUser} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <h1 className="mb-5 text-xl font-semibold tracking-tight text-zinc-900">
          Profile &amp; targets
        </h1>
        <ProfileForm user={safeUser} />
      </main>
    </>
  );
}
