"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, Button, Input, LABEL } from "./ui";

const EXAMPLE = "2 boiled eggs, a cup of curd, and an apple";
const MACRO_KEYS = ["calories", "protein", "carbs", "fat"];

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
    <div className="space-y-4">
      <form onSubmit={parse} className="flex flex-col gap-0.5 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          aria-label="Describe what you ate"
          required
        />
        <Button type="submit" loading={parsing} className="shrink-0">
          {!parsing && <Sparkles className="h-3.5 w-3.5" />}
          Parse &amp; add
        </Button>
      </form>

      {!items && !error && (
        <p className="font-mono text-[10px] leading-relaxed tracking-widest text-ink/50">
          Write it however you&apos;d say it. AI estimates the macros — you fix any number
          before it is saved.
        </p>
      )}

      <Alert>{error}</Alert>

      {items && (
        <div className="border-2 border-ink bg-bone">
          <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
            <span className={`${LABEL} text-ink`}>Estimate</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vermilion">
              Not saved yet
            </span>
          </div>

          <div className="space-y-0.5 p-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-0.5 sm:grid-cols-6">
                <Input
                  className="sm:col-span-2"
                  value={item.name}
                  aria-label="Item name"
                  onChange={(e) => editItem(index, "name", e.target.value)}
                />
                {MACRO_KEYS.map((key) => (
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

          <p className="px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
            Name · Calories · Protein · Carbs · Fat
          </p>

          <div className="flex flex-wrap gap-0.5 p-4">
            <Button onClick={confirm} loading={saving}>
              {!saving && <Check className="h-3.5 w-3.5" />}
              Add {items.length} {items.length === 1 ? "item" : "items"}
            </Button>
            <Button variant="ghost" onClick={() => setItems(null)} disabled={saving}>
              <X className="h-3.5 w-3.5" />
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
