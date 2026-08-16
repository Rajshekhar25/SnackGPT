"use client";

import { useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, Button, LABEL } from "./ui";

// Cards are indexed and colour-coded in order, the way a tool grid is.
const ACCENTS = ["bg-vermilion", "bg-cobalt", "bg-gold"];

export function Suggestions({ date, onAdded, onAiUsage }) {
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingIndex, setAddingIndex] = useState(null);

  async function fetchSuggestions() {
    setLoading(true);
    setError("");

    const { ok, data } = await api("/api/ai/suggest", { method: "POST", body: { date } });
    setLoading(false);

    if (data.aiUsage) onAiUsage(data.aiUsage);
    if (!ok) {
      setError(messageFrom(data, "Could not get suggestions right now."));
      return;
    }
    setSuggestions(data.suggestions);
  }

  async function log(suggestion, index) {
    setAddingIndex(index);
    setError("");

    const { ok, data } = await api("/api/meals", {
      method: "POST",
      body: {
        date,
        name: `${suggestion.title} (${suggestion.portion})`,
        calories: suggestion.calories,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        fat: suggestion.fat,
      },
    });
    setAddingIndex(null);

    if (!ok) {
      setError(messageFrom(data, "Could not log that suggestion."));
      return;
    }
    onAdded();
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-6">
        <div className="flex items-baseline gap-4">
          <span className={`${LABEL} tracking-[0.24em] text-cobalt`}>02</span>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">
              What should I eat next?
            </h2>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink/66">
              Built from what is left in today&apos;s budget, your health conditions and
              your diet.
            </p>
          </div>
        </div>

        <Button variant="secondary" onClick={fetchSuggestions} loading={loading}>
          {!loading && <Lightbulb className="h-3.5 w-3.5" />}
          {suggestions ? "Suggest again" : "Suggest food"}
        </Button>
      </div>

      {error && (
        <div className="mt-5">
          <Alert>{error}</Alert>
        </div>
      )}

      {suggestions && (
        <ul className="mt-5 grid gap-0.5 sm:grid-cols-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex flex-col border-2 border-ink bg-paper">
              <div className={`h-2 ${ACCENTS[index % ACCENTS.length]}`} />

              <div className="flex flex-1 flex-col gap-3 p-5">
                <span className={`${LABEL} text-ink/45`}>
                  {String(index + 1).padStart(2, "0")} · Option
                </span>

                <div>
                  <h3 className="text-lg font-bold leading-tight tracking-[-0.03em] text-ink">
                    {suggestion.title}
                  </h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    {suggestion.portion}
                  </p>
                </div>

                <p className="font-mono text-[11px] text-ink/66">
                  {suggestion.calories} kcal · P {suggestion.protein} · C{" "}
                  {suggestion.carbs} · F {suggestion.fat}
                </p>

                <p className="flex-1 text-sm leading-relaxed text-ink/66">
                  {suggestion.reason}
                </p>

                <Button
                  variant="secondary"
                  className="w-full"
                  loading={addingIndex === index}
                  onClick={() => log(suggestion, index)}
                >
                  {addingIndex !== index && <Plus className="h-3.5 w-3.5" />}
                  Log this
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
