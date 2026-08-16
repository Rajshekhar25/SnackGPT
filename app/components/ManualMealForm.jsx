"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { Alert, Button, Field, Input } from "./ui";

const EMPTY = { name: "", calories: "", protein: "", carbs: "", fat: "" };

export function ManualMealForm({ date, onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { ok, data } = await api("/api/meals", {
      method: "POST",
      body: {
        date,
        name: form.name.trim(),
        calories: Math.round(Number(form.calories) || 0),
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      },
    });
    setSaving(false);

    if (!ok) {
      setError(messageFrom(data, "Could not add that item."));
      return;
    }

    setForm(EMPTY);
    onAdded();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Food">
        <Input
          required
          value={form.name}
          onChange={update("name")}
          placeholder="Grilled paneer sandwich"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Calories">
          <Input
            type="number"
            min="0"
            required
            value={form.calories}
            onChange={update("calories")}
            placeholder="0"
          />
        </Field>
        <Field label="Protein (g)">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={form.protein}
            onChange={update("protein")}
            placeholder="0"
          />
        </Field>
        <Field label="Carbs (g)">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={form.carbs}
            onChange={update("carbs")}
            placeholder="0"
          />
        </Field>
        <Field label="Fat (g)">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={form.fat}
            onChange={update("fat")}
            placeholder="0"
          />
        </Field>
      </div>

      <Alert>{error}</Alert>

      <Button type="submit" loading={saving}>
        {!saving && <Plus className="h-3.5 w-3.5" />}
        Add to log
      </Button>
    </form>
  );
}
