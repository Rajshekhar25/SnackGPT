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
import { Alert, Card } from "./ui";

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
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Hey {user.name.split(" ")[0]}
        </h1>
        {date && <DateNavigator date={date} today={today} onChange={setPicked} />}
      </div>

      {needsProfile && (
        <Alert tone="info">
          Your targets are still the defaults.{" "}
          <Link href="/profile" className="font-medium underline">
            Complete your profile
          </Link>{" "}
          to get targets and suggestions that fit you.
        </Alert>
      )}

      <Alert>{error}</Alert>

      {!day ? (
        <Card className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your day…
        </Card>
      ) : (
        <div className={switchingDay ? "space-y-5 opacity-50" : "space-y-5"}>
          <MacroSummary consumed={day.consumed} target={day.target} />

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Log food
              </h2>

              <div className="flex items-center gap-3">
                {aiUsage && (
                  <span className="text-xs text-zinc-500">
                    {aiUsage.remaining} of {aiUsage.limit} AI requests left this hour
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setManual((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  {manual ? "Use AI" : "Enter manually"}
                </button>
              </div>
            </div>

            {manual ? (
              <ManualMealForm date={day.date} onAdded={reload} />
            ) : (
              <AiQuickAdd date={day.date} onAdded={reload} onAiUsage={setAiUsage} />
            )}
          </Card>

          <MealList meals={day.meals} onChanged={reload} />

          <Suggestions date={day.date} onAdded={reload} onAiUsage={setAiUsage} />
        </div>
      )}
    </main>
  );
}
