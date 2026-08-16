import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftDateKey } from "@/lib/day";
import { Button, IconButton, LABEL } from "./ui";

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
    <div className="flex items-stretch gap-0.5">
      <IconButton onClick={() => onChange(shiftDateKey(date, -1))} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </IconButton>

      <div className="flex min-w-36 flex-col items-center justify-center border-2 border-ink px-4">
        <p className={`${LABEL} tracking-[0.16em] text-ink`}>{label(date, today)}</p>
        <p className="font-mono text-[10px] text-ink/50">{date}</p>
      </div>

      <IconButton onClick={() => onChange(shiftDateKey(date, 1))} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </IconButton>

      <Button variant="ghost" onClick={() => onChange(today)} disabled={date === today}>
        Today
      </Button>
    </div>
  );
}
