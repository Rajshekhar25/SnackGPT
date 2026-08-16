import { Card, LABEL } from "./ui";

const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal", fill: "bg-vermilion" },
  { key: "protein", label: "Protein", unit: "g", fill: "bg-cobalt" },
  { key: "carbs", label: "Carbs", unit: "g", fill: "bg-gold" },
  { key: "fat", label: "Fat", unit: "g", fill: "bg-ink" },
];

function MacroBar({ label, unit, fill, consumed, target }) {
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  const over = pct > 100;
  const remaining = Math.round((target - consumed) * 10) / 10;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className={`${LABEL} text-ink`}>{label}</span>
        <span className="font-mono text-[11px] text-ink/55">
          {consumed} / {target} {unit}
        </span>
      </div>

      <div className="h-3 border-2 border-ink bg-bone">
        <div
          className={`h-full transition-[width] duration-320 ease-brb ${
            over ? "bg-vermilion" : fill
          }`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      <p
        className={`mt-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
          over ? "text-vermilion" : "text-ink/50"
        }`}
      >
        {over ? `${Math.abs(remaining)} ${unit} over` : `${remaining} ${unit} left`}
      </p>
    </div>
  );
}

export function MacroSummary({ consumed, target }) {
  return (
    <Card bodyClassName="p-6 sm:p-7">
      <div className="grid gap-6 sm:grid-cols-2">
        {MACROS.map((macro) => (
          <MacroBar
            key={macro.key}
            label={macro.label}
            unit={macro.unit}
            fill={macro.fill}
            consumed={consumed[macro.key]}
            target={target[macro.key]}
          />
        ))}
      </div>
    </Card>
  );
}
