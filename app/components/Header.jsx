"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/client";
import { Brand } from "./Brand";
import { Button, LABEL } from "./ui";

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
    <header className="border-b-2 border-ink bg-bone">
      <div className="mx-auto flex w-full max-w-310 items-center gap-4 px-6 py-4 sm:px-14">
        <Link href="/">
          <Brand size="sm" />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span className={`${LABEL} hidden text-ink/50 sm:inline`}>{user.name}</span>

          {pathname !== "/profile" && (
            <Link href="/profile">
              <Button variant="ghost" title="Profile and targets">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
          )}

          <Button variant="ghost" onClick={logout} loading={loggingOut} title="Log out">
            {!loggingOut && <LogOut className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
