import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { publicUser } from "@/lib/api";
import { Header } from "@/app/components/Header";
import { ProfileForm } from "@/app/components/ProfileForm";
import { LABEL } from "@/app/components/ui";

export const metadata = { title: "Profile — SnackGPT" };

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const safeUser = publicUser(user);

  return (
    <>
      <Header user={safeUser} />
      <main className="mx-auto w-full max-w-310 flex-1 px-6 py-10 sm:px-14">
        <div className="mb-8">
          <span className={`${LABEL} tracking-[0.24em] text-cobalt`}>Settings</span>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
            Profile &amp; targets
          </h1>
        </div>
        <ProfileForm user={safeUser} />
      </main>
    </>
  );
}
