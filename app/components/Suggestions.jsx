"use client";

import { useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, Button, Card } from "./ui";

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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">What should I eat next?</h2>
          <p className="text-sm text-zinc-500">
            Built from what&apos;s left in today&apos;s budget, your health conditions
            and your diet.
          </p>
        </div>

        <Button variant="secondary" onClick={fetchSuggestions} loading={loading}>
          {!loading && <Lightbulb className="h-4 w-4" />}
          {suggestions ? "Suggest again" : "Suggest food"}
        </Button>
      </div>

      {error && <div className="mt-3">
        <Alert>{error}</Alert>
      </div>}

      {suggestions && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="flex flex-col rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200"
            >
              <p className="text-sm font-semibold text-zinc-900">{suggestion.title}</p>
              <p className="text-xs text-zinc-500">{suggestion.portion}</p>

              <p className="mt-2 font-mono text-xs text-zinc-600">
                {suggestion.calories} kcal · P {suggestion.protein} · C{" "}
                {suggestion.carbs} · F {suggestion.fat}
              </p>

              <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-600">
                {suggestion.reason}
              </p>

              <Button
                variant="secondary"
                className="mt-3 w-full"
                loading={addingIndex === index}
                onClick={() => log(suggestion, index)}
              >
                {addingIndex !== index && <Plus className="h-4 w-4" />}
                Log this
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
