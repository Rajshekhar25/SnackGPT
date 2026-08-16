# How the app works

A walkthrough of what happens on each path, in the order the code runs. Use this to trace
any behaviour back to the file that produces it.

---

## Layer map

```
Browser (React client components)
   │  fetch() via lib/client.js
   ▼
Route handler  (app/api/**/route.js)
   │  1. requireUser()      → lib/api.js → lib/auth.js
   │  2. zod .safeParse()   → lib/validation.js
   │  3. work               → lib/nutrition.js · lib/day.js · lib/rate-limiter.js · lib/gemini.js
   ▼
Prisma client (lib/prisma.js)  →  PostgreSQL
```

Every route handler follows the same three steps in the same order: **authenticate, then
validate, then act.** Nothing reaches the database before both checks have passed.

---

## Sign up and sign in

1. `RegisterForm.jsx` POSTs `{ name, email, password }` to `/api/auth/register`.
2. The route validates with `registerSchema`. Failures return `400` with a
   `{ fields: { email: "…" } }` map that the form renders under the offending input.
3. Email uniqueness is checked, then `bcrypt.hash(password, 10)` produces `passwordHash`.
   The plain password is never stored or logged.
4. `createSession(user.id)` generates 32 random bytes, inserts a `Session` row using that
   string as its **id**, and sets it as the `session_token` cookie — HttpOnly (JavaScript
   cannot read it), SameSite=Lax (not sent on cross-site POSTs), Secure in production.
5. The browser is sent to `/profile`, because a new account has no metrics yet.

Login is the same minus the insert: look up by email, `bcrypt.compare`, create a session.
A missing user and a bad password produce the identical `401`.

### How a page knows who you are

`app/page.js` and `app/profile/page.js` are **server** components. They call `getSession()`
directly — no fetch, no loading state:

```js
const user = await getSession();
if (!user) redirect("/login");
```

`getSession()` reads the cookie, looks up the `Session` row with its `user` included,
deletes it if `expiresAt` has passed, and returns the user or `null`. `/login` and
`/register` run the same check inverted, redirecting to `/` if you already have a session.

---

## Setting targets

1. `ProfileForm.jsx` holds every field as a **string** (that is what inputs give you) and
   converts to numbers or `null` on submit.
2. **Auto-calculate** sends the metrics with `autoCalculate: true`.
3. `PUT /api/user/profile` merges the submitted fields over the existing user, then calls
   `calculateTargets()`:

   ```
   BMR  = 10·weight(kg) + 6.25·height(cm) − 5·age  + 5     (male)
        = 10·weight(kg) + 6.25·height(cm) − 5·age  − 161    (female)
   TDEE = BMR × activity multiplier   (1.2 … 1.9)
   kcal = TDEE − 500  if goal weight is lower
          TDEE + 300  if goal weight is higher
          floored at 1200
   ```

   Macros split that calorie figure 30 / 40 / 30 and divide by 4, 4 and 9 kcal per gram.
4. Computed targets are written to the user row and echoed back; the form fills its target
   inputs from the response, so what you see is what was stored.
5. A **partial** update only writes keys that were actually sent, so saving one field cannot
   blank out the others.

If the profile is incomplete, `calculateTargets` returns `null` and the route answers `400`
telling you which fields are missing.

---

## Viewing a day

1. `Dashboard.jsx` resolves today in the browser and fetches
   `GET /api/meals?date=YYYY-MM-DD`.
2. The route validates the date shape, loads that user's rows for that date ordered by
   `createdAt`, and calls `summarizeDay(meals, user)`.
3. `summarizeDay` returns three objects, each keyed by calories / protein / carbs / fat:

   | | |
   |---|---|
   | `consumed` | sum of the day's rows |
   | `target` | the user's stored targets |
   | `remaining` | `target − consumed`, **allowed to be negative** |

4. `MacroSummary.jsx` draws four bars. Over 100 % the bar turns red and the caption flips
   from "N left" to "N over".

Prev / Next / Today call `shiftDateKey`, which rebuilds the key through a real `Date` so
month, year and leap-day boundaries are handled correctly.

---

## Logging food with AI

```
"2 boiled eggs and an apple"
   │
   ▼  POST /api/ai/parse-food
requireUser  →  parseFoodSchema  →  consumeAiRequest  →  Gemini  →  zod
   │
   ▼  { items: [...] }  — nothing saved yet
editable preview in AiQuickAdd.jsx
   │  user fixes any number, clicks confirm
   ▼  POST /api/meals  (once per item, the ordinary validated path)
MealLog rows  →  reload  →  bars move
```

Points worth noting:

- **Validation runs before the rate limiter.** A malformed request costs you nothing from
  your hourly quota.
- **The quota is spent before Gemini is called**, so a failing model call still counts. That
  is deliberate: the cost being limited is the outbound request itself.
- **The preview is not saved.** Discarding it leaves no trace.
- Gemini is called with `responseMimeType: "application/json"` and a `responseSchema`, and
  the reply is re-checked with `aiParsedItemsSchema` before it is returned.
- Non-food input is handled by the prompt: the model returns a single zeroed item rather
  than an empty array, which keeps the UI predictable.

**Manual entry** (`ManualMealForm.jsx`) posts to the same `/api/meals` endpoint with values
you typed. It is always available via the "Enter manually" toggle, and it is what you fall
back to when the AI is unavailable.

---

## Getting suggestions

1. `Suggestions.jsx` POSTs the current date to `/api/ai/suggest`.
2. The route recomputes `remaining` **server-side** — it does not trust a number sent by the
   browser.
3. Those four numbers, plus `healthConditions` and `dietaryPref` from the user row, are
   formatted into the prompt. The system instruction tells the model not to exceed the
   remaining calories, and that a negative value means that macro is already overshot.
4. The reply is validated with `aiSuggestionsSchema`, trimmed to 3, and rounded.
5. Each card has a **Log this** button that posts it to `/api/meals` like anything else.

---

## The rate limiter, step by step

On every AI call, `consumeAiRequest(userId)`:

1. Reads `aiRequestCount` and `aiRequestWindowStart`.
2. If the window is **older than an hour** → set count to 1, window start to now, allow.
3. Else if count is **already 5** → deny, and return the seconds left in the window.
4. Else → increment, allow.

A denial produces `429` with a `Retry-After` header and a message that names the limit and
points the user at manual entry.

---

## Error handling, end to end

| Where | What happens |
|---|---|
| zod fails on a request | `400` with `{ error, fields }`; forms show messages per input |
| No or expired session | `401`; expired `Session` rows are deleted when found |
| Row belongs to someone else | `404`, so ids cannot be probed |
| Quota exhausted | `429` + `Retry-After` |
| Gemini unreachable / busy / malformed | one retry after 1.2 s, then `AiError` → clean JSON |
| Browser cannot reach the server | `lib/client.js` catches it and returns a normal error object, so no caller needs a try/catch |

The rule throughout: **the app never breaks because the AI broke.** Worst case you type the
numbers yourself.

---

## Where to look

| Question | File |
|---|---|
| How is a session created or read? | `lib/auth.js` |
| What shape must this request be? | `lib/validation.js` |
| How are targets calculated? | `lib/nutrition.js` |
| How are day totals worked out? | `lib/day.js` |
| How is the AI quota enforced? | `lib/rate-limiter.js` |
| What exactly is sent to Gemini? | `lib/gemini.js` |
| Why is it built this way? | `DECISIONS.md` |
