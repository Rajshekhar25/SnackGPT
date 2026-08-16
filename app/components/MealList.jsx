"use client";

import { useState } from "react";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, Card } from "./ui";

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
    <Card className="overflow-hidden p-0!">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">Logged</h2>
        <span className="text-xs text-zinc-500">
          {meals.length} {meals.length === 1 ? "item" : "items"}
        </span>
      </div>

      {error && (
        <div className="px-5 pb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {meals.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-zinc-100 px-5 py-10 text-center">
          <UtensilsCrossed className="h-6 w-6 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            Nothing logged yet. Describe a meal above to get started.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
          {meals.map((meal) => (
            <li
              key={meal.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {meal.name}
                </p>
                <p className="font-mono text-xs text-zinc-500">
                  {meal.calories} kcal · P {meal.protein} · C {meal.carbs} · F {meal.fat}
                </p>
              </div>

              <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
                {time(meal.createdAt)}
              </span>

              <button
                type="button"
                onClick={() => remove(meal.id)}
                disabled={deletingId === meal.id}
                aria-label={`Delete ${meal.name}`}
                className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
