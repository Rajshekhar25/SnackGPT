# SnackGPT — Calorie & Macro Tracker

Log food the way you'd say it out loud — *"2 boiled eggs, a cup of curd, and an apple"* —
and let Gemini estimate the macros at logging time. Once the day has real numbers in it,
ask **"what should I eat next?"** and get three suggestions built from what's left in your
budget, your health conditions and your dietary preference.

Built with Next.js (App Router, JavaScript), Tailwind CSS, Prisma + PostgreSQL, and the
Gemini API. Runs entirely on free tiers.

---

## Features

- **Email + password auth** with database-backed sessions (opaque token, HttpOnly cookie).
- **TDEE / macro engine** — Mifflin-St Jeor BMR × activity multiplier, split 30 % protein /
  40 % carbs / 30 % fat, with a one-click "auto-calculate" on the profile page.
- **AI food parser** — free text in, per-item `{ name, calories, protein, carbs, fat }` out,
  shown as an **editable preview** you confirm before anything is saved.
- **AI meal suggester** — 3 cards with portion, macros and a reason, constrained by the
  remaining budget (plain subtraction, no AI), health conditions and diet.
- **Rate limiting** — 5 AI requests per user per hour, counted in Postgres so it works on
  stateless serverless functions.
- **Graceful degradation** — if Gemini is down, rate-limited, or returns something odd, you
  get a clean error and the manual entry form still works. Nothing else breaks.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, JavaScript) |
| Styling | Tailwind CSS v4, Lucide icons |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | Custom sessions — `crypto.randomBytes(32)` token stored as the `Session` row id |
| Validation | zod, on every API route *and* on every AI response |
| AI | Google Gemini (`@google/genai`) in structured-JSON mode (`responseSchema`) |

## Design system

The interface is built like a printed sheet rather than a stack of floating cards.

| | |
| --- | --- |
| Palette | Ink `#101014`, bone `#EDE9E0`, paper `#F7F4EE`; vermilion `#E33B2E`, cobalt `#2B4BF2`, gold `#C8A227`, moss `#1B6E4F` |
| Greys | None. Text hierarchy is ink at `1.0 / 0.66 / 0.50 / 0.38` opacity |
| Type | **Archivo** 700 for anything you read, tracking `-0.03em`; **Space Mono** uppercase `+0.2em` for anything you scan — labels, macros, dates, statuses |
| Structure | Square corners everywhere, 2px ink borders, 1px dividers at `ink/15`, 2px grid gaps so panels nearly touch |
| Page | 1240px max width, 56px margins, crop marks fixed 26px from the viewport edge |
| Motion | 180ms colour, 240ms reveal, 320ms travel, `cubic-bezier(0.2, 0.8, 0.2, 1)`. Nothing bounces or scales from zero |
| Texture | A 3px scanline overlay at 45% opacity, multiplied over the page |

Every value lives as a Tailwind v4 theme token in [`app/globals.css`](app/globals.css); the
primitives that consume them are in [`app/components/ui.jsx`](app/components/ui.jsx). Change a
colour there, not in a component.

## Architecture notes

**Why no JWT.** The session token is 32 random bytes used directly as the `Session` row's
primary key. There is no signature and no signing secret, because the database lookup on
every request *is* the validation — and unlike a JWT, revoking a session is a `DELETE`.

**Why the rate limiter lives in Postgres.** An in-memory `Map` counter looks fine locally
and silently stops working on Vercel: every request may hit a fresh serverless invocation,
so the count resets. `aiRequestCount` / `aiRequestWindowStart` on the `User` row survive
that, at the cost of one extra query per AI call.

**Why the AI never writes to the database.** `POST /api/ai/parse-food` returns a preview
only. The user confirms, and each item is then POSTed to `/api/meals` through the normal
validated path — so a hallucinated 40 000-calorie egg gets caught by the same zod schema
as manual entry.

**Why AI responses are validated twice.** Gemini is called with a `responseSchema`, which
is a strong constraint but not a guarantee. Every response is re-parsed with zod before the
app touches it (`lib/validation.js`).

## Data model

Three tables — `User`, `Session`, `MealLog`. Meals are stored against a `"YYYY-MM-DD"`
string with an index on `(userId, date)`, which makes "give me this day" a single indexed
lookup and keeps timezone handling in one place. There is no meal-type grouping: a day is
one flat, time-ordered list.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create account, start session |
| `POST` | `/api/auth/login` | Start session |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/me` | Current user + AI quota |
| `GET` / `PUT` | `/api/user/profile` | Read / update metrics and targets (`autoCalculate: true` recomputes) |
| `GET` | `/api/meals?date=YYYY-MM-DD` | Day's meals + `consumed` / `target` / `remaining` |
| `POST` | `/api/meals` | Add one item |
| `DELETE` | `/api/meals/:id` | Delete one item (ownership checked) |
| `POST` | `/api/ai/parse-food` | Free text → estimated items (preview, not saved) |
| `POST` | `/api/ai/suggest` | Remaining budget + profile → 3 suggestions |

Every mutation verifies the row belongs to the session user before touching it.

---

## Run it locally

### 1. Get a Postgres database (free)

1. Sign up at [neon.com](https://neon.com) and create a project.
2. On the dashboard, copy the **pooled** connection string — the one whose host contains
   `-pooler`. Serverless functions open many short-lived connections; the pooled endpoint
   is what keeps Neon from running out of them.

### 2. Get a Gemini API key (free, no card)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) → **Create API key**.

### 3. Configure and run

```bash
git clone <your-repo-url>
cd SnackGPT
npm install

cp .env.example .env       # then fill in the two values
npx prisma db push         # creates the three tables
npm run dev                # http://localhost:3000
```

`.env`:

```
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
AI_API_KEY="your_gemini_api_key_here"
NODE_ENV="development"
```

> `AI_MODEL` is optional and defaults to `gemini-flash-latest`. Pinned model names such as
> `gemini-2.5-flash` are retired for new API keys, so the rolling alias is the safe default.

> **Free-tier ceiling.** Google allows a fixed number of requests *per model per day* (20 at
> the time of writing). That is a separate limit from this app's 5-per-hour cap and waiting an
> hour will not clear it — the app reports it as its own message and manual entry keeps
> working. Setting `AI_MODEL` to a different model (e.g. `gemini-flash-lite-latest`) gives you
> a fresh daily allowance.

### 4. Try it

Register → you land on the profile page → fill in your metrics → **Auto-calculate** →
**Save** → on the dashboard, type `2 rotis with dal and a bowl of curd` → **Parse & add** →
adjust anything that looks wrong → confirm. Then hit **Suggest food**.

## Deploy to Vercel

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo (framework auto-detects as
   Next.js).
3. Add environment variables:
   - `DATABASE_URL` — the same **pooled** Neon string
   - `AI_API_KEY` — your Gemini key
   - `NODE_ENV` — `production`
4. Deploy. `npm run build` runs `prisma generate` first, and `postinstall` does the same,
   so the client is always generated against the current schema.
5. Create the tables once against the production database:
   ```bash
   npx prisma db push
   ```
   (run locally with `DATABASE_URL` pointing at the production database)
6. Open the `*.vercel.app` URL, register, and log a meal to confirm the database and the
   Gemini key are both wired up.

Sessions set `secure: true` when `NODE_ENV=production`, so cookies only travel over HTTPS
in the deployed app.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync `prisma/schema.prisma` to the database |

## Project layout

```
app/
  api/                 route handlers (auth, user, meals, ai)
  components/          UI — dashboard, forms, macro bars, AI panels
  login/ register/ profile/   pages
lib/
  auth.js              session create / read / destroy
  prisma.js            singleton Prisma client
  nutrition.js         Mifflin-St Jeor + macro split
  day.js               day totals and date-key helpers
  rate-limiter.js      DB-backed 5-per-hour AI window
  gemini.js            structured-output calls + AiError
  validation.js        every zod schema, request and AI response
  api.js / client.js   server and browser request helpers
prisma/schema.prisma
```
