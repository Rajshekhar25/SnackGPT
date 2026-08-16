import Link from "next/link";
import { Salad } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Salad className="h-6 w-6 text-emerald-600" />
          <span className="text-xl font-semibold tracking-tight text-zinc-900">
            SnackGPT
          </span>
        </Link>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          <p className="mt-1 mb-5 text-sm text-zinc-500">{subtitle}</p>
          {children}
        </div>

        <p className="mt-5 text-center text-sm text-zinc-600">{footer}</p>
      </div>
    </main>
  );
}
