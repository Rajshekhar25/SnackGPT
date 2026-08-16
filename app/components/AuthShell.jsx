import Link from "next/link";
import { Brand } from "./Brand";
import { LABEL } from "./ui";

export function AuthShell({ index, title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 sm:px-14">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex justify-center">
          <Brand size="lg" />
        </Link>

        <div className="border-2 border-ink bg-paper">
          <div className="border-b-2 border-ink px-6 py-4">
            <span className={`${LABEL} tracking-[0.24em] text-vermilion`}>{index}</span>
          </div>

          <div className="px-6 py-7">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-ink">{title}</h1>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-ink/66">{subtitle}</p>
            {children}
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
          {footer}
        </p>
      </div>
    </main>
  );
}
