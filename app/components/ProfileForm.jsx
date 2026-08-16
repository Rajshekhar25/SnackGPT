"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calculator, Check } from "lucide-react";
import { api, messageFrom } from "@/lib/client";
import { ACTIVITY_LABELS } from "@/lib/nutrition";
import { Alert, Button, Field, Input, LABEL, Select, Textarea } from "./ui";

const DIET_OPTIONS = [
  ["none", "No preference"],
  ["vegetarian", "Vegetarian"],
  ["eggetarian", "Eggetarian"],
  ["vegan", "Vegan"],
  ["pescatarian", "Pescatarian"],
  ["keto", "Keto"],
  ["halal", "Halal"],
  ["jain", "Jain"],
];

const METRIC_KEYS = [
  "age",
  "gender",
  "heightCm",
  "weightKg",
  "targetWeightKg",
  "activityLevel",
  "healthConditions",
  "dietaryPref",
];
const TARGET_KEYS = ["targetCalories", "targetProtein", "targetCarbs", "targetFat"];

/** Form state holds strings (what inputs give us); the API wants numbers or null. */
const toText = (value) => (value === null || value === undefined ? "" : String(value));

function numeric(value) {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    age: numeric(form.age),
    gender: form.gender || null,
    heightCm: numeric(form.heightCm),
    weightKg: numeric(form.weightKg),
    targetWeightKg: numeric(form.targetWeightKg),
    activityLevel: form.activityLevel || null,
    healthConditions: form.healthConditions.trim() || null,
    dietaryPref: form.dietaryPref || null,
  };
}

function Panel({ index, title, description, action, children }) {
  return (
    <section className="border-2 border-ink bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink px-6 py-4">
        <div className="flex items-baseline gap-4">
          <span className={`${LABEL} tracking-[0.24em] text-vermilion`}>{index}</span>
          <div>
            <h2 className={`${LABEL} text-ink`}>{title}</h2>
            {description && (
              <p className="mt-1 font-mono text-[10px] tracking-widest text-ink/50">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function ProfileForm({ user }) {
  const router = useRouter();
  const isOnboarding = !user.weightKg || !user.heightCm || !user.age;

  const [form, setForm] = useState(() => {
    const initial = { name: toText(user.name) };
    for (const key of [...METRIC_KEYS, ...TARGET_KEYS]) initial[key] = toText(user[key]);
    return initial;
  });
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit({ autoCalculate }) {
    const setBusy = autoCalculate ? setCalculating : setSaving;
    setBusy(true);
    setError("");
    setNotice("");
    setFields({});

    const payload = { ...buildPayload(form) };
    if (autoCalculate) {
      payload.autoCalculate = true;
    } else {
      for (const key of TARGET_KEYS) payload[key] = numeric(form[key]) ?? undefined;
    }

    const { ok, data } = await api("/api/user/profile", { method: "PUT", body: payload });
    setBusy(false);

    if (!ok) {
      setFields(data.fields ?? {});
      setError(data.fields ? "Check the highlighted fields." : messageFrom(data));
      return;
    }

    // Reflect server-computed targets back into the form.
    setForm((f) => {
      const next = { ...f };
      for (const key of TARGET_KEYS) next[key] = toText(data.user[key]);
      return next;
    });

    if (autoCalculate) {
      setNotice("Targets recalculated from your metrics. Save to keep them.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({ autoCalculate: false });
      }}
      className="space-y-0.5"
    >
      {isOnboarding && (
        <div className="pb-5">
          <Alert tone="info" label="Welcome">
            Fill this in once and SnackGPT can work out your daily targets and tailor its
            food suggestions.
          </Alert>
        </div>
      )}

      <Panel index="01" title="About you">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" error={fields.name}>
            <Input value={form.name} onChange={update("name")} required />
          </Field>

          <Field label="Age" error={fields.age}>
            <Input
              type="number"
              min="10"
              max="120"
              value={form.age}
              onChange={update("age")}
              placeholder="24"
            />
          </Field>

          <Field label="Sex" error={fields.gender} hint="Used by the BMR formula.">
            <Select value={form.gender} onChange={update("gender")}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>

          <Field label="Height (cm)" error={fields.heightCm}>
            <Input
              type="number"
              step="0.5"
              value={form.heightCm}
              onChange={update("heightCm")}
              placeholder="172"
            />
          </Field>

          <Field label="Weight (kg)" error={fields.weightKg}>
            <Input
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={update("weightKg")}
              placeholder="70"
            />
          </Field>

          <Field
            label="Goal weight (kg)"
            error={fields.targetWeightKg}
            hint="Optional. Shifts your calorie target up or down."
          >
            <Input
              type="number"
              step="0.1"
              value={form.targetWeightKg}
              onChange={update("targetWeightKg")}
              placeholder="65"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Activity level" error={fields.activityLevel}>
              <Select value={form.activityLevel} onChange={update("activityLevel")}>
                <option value="">Select…</option>
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Panel>

      <Panel
        index="02"
        title="Health & diet"
        description="Both are passed to the AI so its suggestions suit you"
      >
        <div className="space-y-5">
          <Field
            label="Health conditions"
            error={fields.healthConditions}
            hint="Free text, e.g. “Type 2 diabetes, high blood pressure”. Leave blank if none."
          >
            <Textarea
              rows={2}
              value={form.healthConditions}
              onChange={update("healthConditions")}
              placeholder="Type 2 diabetes, lactose intolerant"
            />
          </Field>

          <Field label="Dietary preference" error={fields.dietaryPref}>
            <Select value={form.dietaryPref} onChange={update("dietaryPref")}>
              <option value="">Select…</option>
              {DIET_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel
        index="03"
        title="Daily targets"
        description="Edit by hand, or run Mifflin-St Jeor"
        action={
          <Button
            type="button"
            variant="secondary"
            loading={calculating}
            onClick={() => submit({ autoCalculate: true })}
          >
            {!calculating && <Calculator className="h-3.5 w-3.5" />}
            Auto-calculate
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Calories" error={fields.targetCalories}>
            <Input
              type="number"
              value={form.targetCalories}
              onChange={update("targetCalories")}
            />
          </Field>
          <Field label="Protein (g)" error={fields.targetProtein}>
            <Input
              type="number"
              value={form.targetProtein}
              onChange={update("targetProtein")}
            />
          </Field>
          <Field label="Carbs (g)" error={fields.targetCarbs}>
            <Input
              type="number"
              value={form.targetCarbs}
              onChange={update("targetCarbs")}
            />
          </Field>
          <Field label="Fat (g)" error={fields.targetFat}>
            <Input type="number" value={form.targetFat} onChange={update("targetFat")} />
          </Field>
        </div>
      </Panel>

      <div className="space-y-4 pt-5">
        <Alert>{error}</Alert>
        <Alert tone="info" label="Saved">
          {notice}
        </Alert>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            {!saving &&
              (isOnboarding ? (
                <ArrowRight className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              ))}
            {isOnboarding ? "Save and start tracking" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
