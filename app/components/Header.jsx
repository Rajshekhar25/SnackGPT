"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Salad, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/client";
import { Button } from "./ui";

export function Header({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Salad className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold tracking-tight text-zinc-900">SnackGPT</span>
        </Link>

        <span className="ml-auto hidden text-sm text-zinc-500 sm:inline">
          {user.name}
        </span>

        {pathname !== "/profile" && (
          <Link href="/profile">
            <Button variant="ghost" title="Profile and targets">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
          </Link>
        )}

        <Button variant="ghost" onClick={logout} loading={loggingOut} title="Log out">
          {!loggingOut && <LogOut className="h-4 w-4" />}
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
