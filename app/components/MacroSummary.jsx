import { Card } from "./ui";

const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal", bar: "bg-emerald-500" },
  { key: "protein", label: "Protein", unit: "g", bar: "bg-sky-500" },
  { key: "carbs", label: "Carbs", unit: "g", bar: "bg-amber-500" },
  { key: "fat", label: "Fat", unit: "g", bar: "bg-rose-500" },
];

function MacroBar({ label, unit, bar, consumed, target }) {
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  const over = pct > 100;
  const remaining = Math.round((target - consumed) * 10) / 10;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        <span className="font-mono text-xs text-zinc-500">
          {consumed} / {target} {unit}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            over ? "bg-rose-500" : bar
          }`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      <p className={`mt-1 text-xs ${over ? "text-rose-600" : "text-zinc-500"}`}>
        {over
          ? `${Math.abs(remaining)} ${unit} over`
          : `${remaining} ${unit} left`}
      </p>
    </div>
  );
}

export function MacroSummary({ consumed, target }) {
  return (
    <Card>
      <div className="grid gap-5 sm:grid-cols-2">
        {MACROS.map((macro) => (
          <MacroBar
            key={macro.key}
            label={macro.label}
            unit={macro.unit}
            bar={macro.bar}
            consumed={consumed[macro.key]}
            target={target[macro.key]}
          />
        ))}
      </div>
    </Card>
  );
}
