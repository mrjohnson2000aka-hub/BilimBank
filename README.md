# BilimBank

Student-to-student skill exchange: teach an hour, earn a credit, learn an hour. English and Uzbek.

**To put it online, follow [SETUP.md](SETUP.md).** No terminal needed.

## How it is built

- **Next.js 14 (App Router) + TypeScript + Tailwind** for the web app (`src/`).
- **Supabase** (Postgres, Auth, Realtime, Storage). The whole database lives in `supabase/schema.sql`; the skill catalogue in `supabase/seed.sql`; `supabase/bilimbank.sql` is both combined for one paste.
- **All money-like logic runs in the database.** Booking, holds, payouts, refunds, no-shows, reviews and admin actions are `SECURITY DEFINER` functions. The browser can read its own rows (row-level security) but cannot write balances, bookings or ledger rows.
  - Double booking is impossible: an exclusion constraint on `bookings` refuses overlapping live bookings for a teacher or a learner.
  - Exactly-once credits: unique indexes on `credit_ledger` allow one starter grant per person and one hold, one settlement, one reward and one penalty per booking. The ledger is append-only (a trigger blocks updates and deletes).
  - Fair use: weekly earning cap per teacher, weekly cap per learner–teacher pair, booking and report rate limits, and a review queue for repeated exchanges. Nothing is penalised automatically from a pattern alone.
- **Email**: an outbox table in the database; `/api/outbox/flush` and `/api/cron` send due emails through Resend, with retries and no duplicates (unique dedupe keys + claim-before-send).
- **Google Calendar / Meet**: OAuth per teacher; refresh tokens are readable only by the server. If not configured, the site says so and teachers paste a Meet link.
- Matching is a transparent, rule-based score (two-way skill swap first, then shared free time, language, rating, past sessions). It is not AI.

## Environment variables

See `.env.example`. Only the three Supabase values, `NEXT_PUBLIC_SITE_URL` and `CRON_SECRET` are required.

## Tests

- `tests/db`: 81 checks against a real Postgres (starter credits once, holds, a simultaneous double-booking race, payouts once, cancellation, expiry, no-shows, disputes, reviews, privacy rules, admin-only functions, ledger integrity). Needs a local Postgres; see `tests/db/db.js`.
- `tests/e2e`: browser test of the full journey (sign-up → onboarding → match → booking → confirmation emails → Meet link → chat → completion → payout → review → stats → admin access → cancellation refund → Uzbek and phone layout) against real Supabase Auth (GoTrue) and PostgREST servers.

## Run locally

```
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev
```
