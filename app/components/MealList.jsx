"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, LABEL } from "./ui";

function time(createdAt) {
  return new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MealList({ meals, onChanged }) {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function remove(id) {
    setDeletingId(id);
    setError("");

    const { ok, data } = await api(`/api/meals/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!ok) {
      setError(messageFrom(data, "Could not delete that item."));
      return;
    }
    onChanged();
  }

  return (
    <section className="border-2 border-ink bg-paper">
      <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
        <h2 className={`${LABEL} text-ink`}>Logged</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
          {String(meals.length).padStart(2, "0")}{" "}
          {meals.length === 1 ? "item" : "items"}
        </span>
      </div>

      {error && (
        <div className="border-b border-ink/15 px-6 py-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {meals.length === 0 ? (
        <p className="px-6 py-14 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink/38">
          Nothing logged — describe a meal above
        </p>
      ) : (
        <ul>
          {meals.map((meal, index) => (
            <li
              key={meal.id}
              className="flex items-center gap-4 border-b border-ink/15 px-6 py-4 last:border-b-0 hover:bg-bone"
            >
              <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.14em] text-ink/38 sm:inline">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">{meal.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink/55">
                  {meal.calories} kcal · P {meal.protein} · C {meal.carbs} · F {meal.fat}
                </p>
              </div>

              <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.14em] text-ink/38 sm:inline">
                {time(meal.createdAt)}
              </span>

              <button
                type="button"
                onClick={() => remove(meal.id)}
                disabled={deletingId === meal.id}
                aria-label={`Delete ${meal.name}`}
                className="shrink-0 border-2 border-transparent p-2 text-ink/40 transition-colors duration-180 ease-brb hover:border-vermilion hover:text-vermilion disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vermilion focus-visible:outline-solid"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
