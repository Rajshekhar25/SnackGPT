"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, Button, Input } from "./ui";

const EXAMPLE = "2 boiled eggs, a cup of curd, and an apple";

/**
 * Natural language → Gemini → an editable preview. Nothing is written to the
 * database until the user confirms, and confirmation goes through the ordinary
 * POST /api/meals path so the AI never bypasses server-side validation.
 */
export function AiQuickAdd({ date, onAdded, onAiUsage }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function parse(e) {
    e.preventDefault();
    setParsing(true);
    setError("");

    const { ok, data } = await api("/api/ai/parse-food", {
      method: "POST",
      body: { text },
    });
    setParsing(false);

    if (data.aiUsage) onAiUsage(data.aiUsage);
    if (!ok) {
      setError(messageFrom(data, "Could not parse that. Add it manually below."));
      return;
    }
    setItems(data.items);
  }

  function editItem(index, key, value) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  async function confirm() {
    setSaving(true);
    setError("");

    for (const item of items) {
      const { ok, data } = await api("/api/meals", {
        method: "POST",
        body: {
          date,
          name: String(item.name).trim(),
          calories: Math.round(Number(item.calories) || 0),
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0,
        },
      });

      if (!ok) {
        setSaving(false);
        setError(messageFrom(data, "Could not save one of the items."));
        onAdded();
        return;
      }
    }

    setSaving(false);
    setItems(null);
    setText("");
    onAdded();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={parse} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          aria-label="Describe what you ate"
          required
        />
        <Button type="submit" loading={parsing} className="shrink-0">
          {!parsing && <Sparkles className="h-4 w-4" />}
          Parse &amp; add
        </Button>
      </form>

      {!items && !error && (
        <p className="text-xs text-zinc-500">
          Write it however you&apos;d say it — AI estimates the macros, and you can fix
          any number before it&apos;s saved.
        </p>
      )}

      <Alert>{error}</Alert>

      {items && (
        <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-200">
          <p className="mb-2 text-xs font-medium text-zinc-600">
            Estimated — edit anything that looks off, then confirm.
          </p>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <Input
                  className="sm:col-span-2"
                  value={item.name}
                  aria-label="Item name"
                  onChange={(e) => editItem(index, "name", e.target.value)}
                />
                {["calories", "protein", "carbs", "fat"].map((key) => (
                  <Input
                    key={key}
                    type="number"
                    step="0.1"
                    min="0"
                    value={item[key]}
                    aria-label={`${item.name} ${key}`}
                    title={key}
                    onChange={(e) => editItem(index, key, e.target.value)}
                  />
                ))}
              </div>
            ))}
          </div>

          <p className="mt-1.5 text-xs text-zinc-500">
            Columns: name, calories, protein, carbs, fat.
          </p>

          <div className="mt-3 flex gap-2">
            <Button onClick={confirm} loading={saving}>
              {!saving && <Check className="h-4 w-4" />}
              Add {items.length} {items.length === 1 ? "item" : "items"}
            </Button>
            <Button variant="ghost" onClick={() => setItems(null)} disabled={saving}>
              <X className="h-4 w-4" />
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
