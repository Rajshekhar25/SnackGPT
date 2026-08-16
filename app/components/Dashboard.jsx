"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Loader2, PencilLine, Sparkles } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { toDateKey } from "@/lib/day";
import { AiQuickAdd } from "./AiQuickAdd";
import { DateNavigator } from "./DateNavigator";
import { MacroSummary } from "./MacroSummary";
import { ManualMealForm } from "./ManualMealForm";
import { MealList } from "./MealList";
import { Suggestions } from "./Suggestions";
import { Alert, LABEL } from "./ui";

// Today is a browser-local value: the server renders in its own timezone (UTC on
// Vercel) and would hand the client a different day. useSyncExternalStore lets the
// server snapshot be null and the client snapshot be the real date, with no
// hydration mismatch and no setState-in-effect.
const neverChanges = () => () => {};
const clientToday = () => toDateKey(new Date());
const serverToday = () => null;

export function Dashboard({ user, initialAiUsage }) {
  const today = useSyncExternalStore(neverChanges, clientToday, serverToday);

  const [picked, setPicked] = useState(null);
  const [day, setDay] = useState(null);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);
  const [aiUsage, setAiUsage] = useState(initialAiUsage);
  // Bumped by children after they add or delete something, to re-run the fetch.
  const [reloadToken, setReloadToken] = useState(0);

  const date = picked ?? today;
  const reload = () => setReloadToken((n) => n + 1);

  useEffect(() => {
    if (!date) return undefined;
    let cancelled = false;

    api(`/api/meals?date=${date}`).then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) {
        setError(messageFrom(data, "Could not load that day."));
        return;
      }
      setError("");
      setDay(data);
    });

    return () => {
      cancelled = true;
    };
  }, [date, reloadToken]);

  const switchingDay = !day || day.date !== date;
  const needsProfile = !user.weightKg || !user.heightCm || !user.age;

  return (
    <main className="mx-auto w-full max-w-310 flex-1 space-y-8 px-6 py-10 sm:px-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className={`${LABEL} tracking-[0.24em] text-vermilion`}>Dashboard</span>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
            Hey {user.name.split(" ")[0]}
          </h1>
        </div>
        {date && <DateNavigator date={date} today={today} onChange={setPicked} />}
      </div>

      {needsProfile && (
        <Alert tone="info" label="Setup">
          Your targets are still the defaults.{" "}
          <Link href="/profile" className="text-cobalt underline hover:text-vermilion">
            Complete your profile
          </Link>{" "}
          to get targets and suggestions that fit you.
        </Alert>
      )}

      <Alert>{error}</Alert>

      {!day ? (
        <div className="flex items-center justify-center gap-3 border-2 border-ink bg-paper py-20 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading your day
        </div>
      ) : (
        <div
          className={`space-y-8 transition-opacity duration-240 ease-brb ${
            switchingDay ? "opacity-50" : "opacity-100"
          }`}
        >
          <section className="space-y-0.5">
            <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-6 pb-5">
              <div className="flex items-baseline gap-4">
                <span className={`${LABEL} tracking-[0.24em] text-vermilion`}>01</span>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">
                  The day so far
                </h2>
              </div>
              {aiUsage && (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                  {aiUsage.remaining} of {aiUsage.limit} AI requests left this hour
                </span>
              )}
            </div>

            <MacroSummary consumed={day.consumed} target={day.target} />

            <div className="border-2 border-ink bg-paper">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink px-6 py-4">
                <h3 className={`${LABEL} flex items-center gap-2 text-ink`}>
                  <Sparkles className="h-3.5 w-3.5 text-vermilion" />
                  Log food
                </h3>
                <button
                  type="button"
                  onClick={() => setManual((v) => !v)}
                  className="inline-flex items-center gap-2 border-b border-ink/30 pb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60 transition-colors duration-180 ease-brb hover:border-vermilion hover:text-vermilion"
                >
                  <PencilLine className="h-3 w-3" />
                  {manual ? "Use AI" : "Enter manually"}
                </button>
              </div>

              <div className="p-6">
                {manual ? (
                  <ManualMealForm date={day.date} onAdded={reload} />
                ) : (
                  <AiQuickAdd date={day.date} onAdded={reload} onAiUsage={setAiUsage} />
                )}
              </div>
            </div>

            <MealList meals={day.meals} onChanged={reload} />
          </section>

          <Suggestions date={day.date} onAdded={reload} onAiUsage={setAiUsage} />
        </div>
      )}
    </main>
  );
}
