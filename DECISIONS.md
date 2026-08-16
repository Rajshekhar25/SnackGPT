# Design decisions

Why the app is built the way it is. Each entry is a choice that had a real alternative,
the reason the alternative was rejected, and what it costs.

---

## 1. Sessions in the database, not JWTs

**Choice.** `crypto.randomBytes(32).toString("hex")` becomes the primary key of a `Session`
row. That same string is set as an HttpOnly, SameSite=Lax cookie. Every request looks the
row up (`lib/auth.js`).

**Alternative rejected.** A signed JWT holding the user id.

**Why.** A JWT needs a signing secret, a signing library, and expiry handling in code — and
it still cannot be revoked before it expires, because the server does not track it. The
token here carries no information at all; it is a random string that either matches a row
or does not. There is nothing to forge, because guessing a 256-bit key that exists in
Postgres *is* the attack. Logging out is `DELETE FROM "Session"`, and it takes effect
immediately.

**Cost.** One database query per authenticated request. Acceptable: it is an indexed
primary-key lookup, and every request that follows hits the database anyway.

---

## 2. Rate limiting lives in Postgres, not in memory

**Choice.** `aiRequestCount` and `aiRequestWindowStart` are columns on `User`
(`lib/rate-limiter.js`).

**Alternative rejected.** A module-level `Map` of userId → count, the usual tutorial answer.

**Why.** Vercel runs each request in a stateless serverless invocation. A `Map` lives in one
instance's memory, so the count resets whenever a new instance handles the request — the
limiter would appear to work locally and silently do nothing in production. Postgres is the
only state shared across invocations.

**Cost.** One extra read and one extra write per AI call, and the schema stays at three
models instead of gaining a fourth just to hold two integers.

**Design detail.** It is a *fixed* window, not a sliding one: if the stored window start is
more than an hour old, the count resets to 1 and the window restarts from now. Sliding
windows need a log of timestamps; the extra precision is not worth it for a 5-per-hour cap.

---

## 3. The AI never writes to the database

**Choice.** `POST /api/ai/parse-food` returns a preview. The user reviews and edits it, and
only then does the client POST each item to `/api/meals` through the ordinary path.

**Alternative rejected.** Parse and insert in one request.

**Why.** Two reasons, and the second matters more.

1. *Correctness.* Nutrition estimates are guesses. The user is the one who knows the portion
   was small, so they get the last word before anything is stored.
2. *Security.* Because the confirmed items travel through `POST /api/meals`, they hit the
   same zod schema as manual entry. A hallucinated 40,000-calorie egg is rejected by the
   same rule that rejects a typo. The AI has no privileged write path — there is exactly one
   way a row enters `MealLog`.

---

## 4. AI responses are validated twice

**Choice.** Gemini is called with a `responseSchema` constraining the JSON shape, and the
response is *then* re-parsed with zod (`lib/gemini.js` → `lib/validation.js`).

**Why.** `responseSchema` is a strong constraint, not a guarantee: the request can fail, the
model can be truncated, the API can return an error body. Treating a model response as
untrusted input is the same discipline as treating a request body as untrusted input. The
zod pass is what turns "probably the right shape" into "definitely the right shape or a
clean error".

---

## 5. The remaining budget is computed, not asked for

**Choice.** `lib/day.js` subtracts consumed from target in plain JavaScript. The result is
*given* to the suggester as input.

**Alternative rejected.** Asking the model to work out what is left.

**Why.** Arithmetic is not a language problem. Doing it in code makes it exact, free,
instant, and testable, and it keeps the model's job narrow — "suggest food that fits these
four numbers" rather than "do maths and then suggest food". `remaining` is deliberately
allowed to go negative, and the prompt tells the model that a negative value means the user
has already overshot that macro.

---

## 6. One flat list per day, no meal-type grouping

**Choice.** `MealLog` has no `mealType` column. A day is a single list ordered by
`createdAt`.

**Why.** Breakfast/lunch/dinner/snack is a category the user has to maintain and that
nothing in the app reads. Targets are daily, the remaining budget is daily, and suggestions
are driven by the daily budget. The grouping would be decoration on every screen and an
extra required field on every insert.

---

## 7. Dates are stored as `"YYYY-MM-DD"` strings

**Choice.** `MealLog.date` is `String`, indexed with `@@index([userId, date])`.

**Alternative rejected.** A `DateTime` column with range queries.

**Why.** "Which day does this meal belong to?" is a calendar question, not an instant-in-time
question. A `DateTime` forces every read to build a start-of-day/end-of-day range in the
right timezone; a string makes it one equality match on a composite index. The user's
calendar day is resolved once, in the browser, and sent along.

**Cost.** No date arithmetic in SQL. `lib/day.js` provides `shiftDateKey` for the
prev/next navigation, which is where the arithmetic actually happens.

---

## 8. Today is resolved in the browser, not on the server

**Choice.** `Dashboard.jsx` gets today via `useSyncExternalStore` — the server snapshot is
`null`, the client snapshot is the real local date.

**Why.** The server runs in UTC on Vercel. If it rendered "today", a user logging a late
dinner in India would be shown the wrong day, and the server-rendered HTML would disagree
with the client's first render (a hydration mismatch). `useSyncExternalStore` is the
supported way to say "this value only exists on the client" without a flash of wrong content
and without calling `setState` inside an effect.

---

## 9. Goal weight shifts the calorie target

**Choice.** `calculateTargets` starts from TDEE, subtracts 500 kcal when the goal weight is
lower, adds 300 when it is higher, and clamps at 1200 kcal.

**Why.** TDEE alone is a *maintenance* number — it holds weight steady, so a "goal weight"
field that changed nothing would be a lie. 500 kcal/day is the classic ~0.5 kg/week deficit;
300 is a lean-gain surplus. The 1200 floor is the usual clinical guidance for unsupervised
dieting and stops the formula producing an unsafe target for small, sedentary users.

---

## 10. Gemini model is an alias, not a pinned version

**Choice.** `gemini-flash-latest`, overridable with an optional `AI_MODEL` env var.

**Why.** Pinned names get retired for new API keys — `gemini-2.5-flash` already returns
*"no longer available to new users"*. The alias keeps working as Google rotates models. The
env var is the escape hatch if the alias ever moves somewhere unsuitable.

**Related.** A single retry with a 1.2 s pause wraps every call, because free-tier Flash
returns transient 503s under load. The pause matters — an instant retry lands in the same
overload window and fails identically.

---

## 11. Every AI failure degrades to manual entry

**Choice.** All AI errors become an `AiError` with a user-readable message; the UI shows it
and keeps the manual form available.

**Why.** The AI is the best path, not the only path. Network failure, rate limit, malformed
response, missing API key — each returns a clean payload, and the app remains fully usable
for its core job of tracking food. Nothing about logging a meal depends on Gemini being up.

---

## 12. Ownership is checked on the row, not inferred from the URL

**Choice.** `DELETE /api/meals/[id]` loads the row, compares `meal.userId` to the session
user, and returns **404** — not 403 — when they differ.

**Why.** Checking the row is the only check that cannot be bypassed by editing the URL.
Returning 404 rather than 403 avoids confirming that someone else's meal id exists, which
would otherwise let an attacker enumerate valid ids.

---

## 13. Login is deliberately vague about failures

**Choice.** "Incorrect email or password" for both an unknown email and a wrong password.

**Why.** Distinct messages turn the login form into a tool for discovering which email
addresses have accounts.
