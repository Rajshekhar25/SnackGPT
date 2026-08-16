const MACROS = ["calories", "protein", "carbs", "fat"];

const TARGET_KEYS = {
  calories: "targetCalories",
  protein: "targetProtein",
  carbs: "targetCarbs",
  fat: "targetFat",
};

const round = (n) => Math.round(n * 10) / 10;

/**
 * Consumed / target / remaining for one day. Plain subtraction — no AI involved.
 * `remaining` can go negative, which the UI and the suggester both rely on.
 */
export function summarizeDay(meals, user) {
  const consumed = {};
  const target = {};
  const remaining = {};

  for (const macro of MACROS) {
    const total = meals.reduce((sum, meal) => sum + meal[macro], 0);
    consumed[macro] = round(total);
    target[macro] = user[TARGET_KEYS[macro]];
    remaining[macro] = round(target[macro] - total);
  }

  return { consumed, target, remaining };
}

/** Local (not UTC) "YYYY-MM-DD" — the user's calendar day is what they log against. */
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDateKey(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}
