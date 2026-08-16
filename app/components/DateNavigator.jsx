import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftDateKey } from "@/lib/day";
import { Button } from "./ui";

// `today` is passed in rather than read here: it is a browser-local value the
// server cannot know (see Dashboard.jsx).
function label(dateKey, today) {
  if (dateKey === today) return "Today";
  if (dateKey === shiftDateKey(today, -1)) return "Yesterday";
  if (dateKey === shiftDateKey(today, 1)) return "Tomorrow";

  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function DateNavigator({ date, today, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        onClick={() => onChange(shiftDateKey(date, -1))}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-32 text-center">
        <p className="text-sm font-semibold text-zinc-900">{label(date, today)}</p>
        <p className="font-mono text-xs text-zinc-500">{date}</p>
      </div>

      <Button
        variant="secondary"
        onClick={() => onChange(shiftDateKey(date, 1))}
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        onClick={() => onChange(today)}
        disabled={date === today}
        className="ml-1"
      >
        Today
      </Button>
    </div>
  );
}
