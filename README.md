# Tempora — Personal Finance & Savings Goal Tracker

Tempora is a web product for individuals who want to record income and expenses in FCFA, watch the month take shape, and track savings goals without a spreadsheet. The customer site (this app) explains the product and keeps signed-in books in `/app`. The founder desk is a separate app in `admin-dashboard/`.

Phone number is the login credential. Email is kept for receipts and recovery.

## Features

- Phone sign-up and login (Standard free, Premium 12,500 FCFA/month)
- Transactions with categories, dates, and notes
- Savings goals with a target amount and date
- Dashboard for monthly income, expenses, and progress
- Appearance: colour themes, typefaces, and night mode
- Founder control panel for clients, payments, support, and the books

Out of scope: bank sync, crypto, joint wallets, and a public REST API.

## Tech stack

- **Next.js 16** (App Router) and **React 19**
- **Tailwind CSS v4**
- **Supabase** (Auth + Postgres) in production; browser demo mode without keys
- **TypeScript**

The customer app lives under `src/app` (routes), `src/components`, and `src/lib`. The founder panel is its own Next.js app in `admin-dashboard/` and runs on port 3001.

## Installation

```bash
npm install
npm --prefix admin-dashboard install
```

Copy environment defaults into both apps (same Supabase keys):

```bash
cp .env.example .env.local
cp .env.example admin-dashboard/.env.local
```

On Windows PowerShell, `npm.cmd` may be required if `npm` is blocked by execution policy.

## Environment variables

Set these in `.env.local` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; founder panel bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | Canonical customer site URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_WEB_URL` | Customer site URL used by the admin app for “back to site” links |
| `NEXT_PUBLIC_ADMIN_URL` | Founder panel URL (default `http://localhost:3001`) |
| `ADMIN_PHONES` | Optional extra lock: founder phones, comma-separated, with country code |
| `ADMIN_DESK_KEY` | Secret that unlocks the panel login (`http://localhost:3001/login?desk=YOUR_SECRET`). Visitors without that cookie see a 404. |

Never commit `.env.local`. Never expose the service role key to the browser.

## Database setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Apply later changes from `supabase/migrations/` in order (`0002` … `0004`). Skip unfinished migrations.

Create the first founder (optional, if you prefer the CLI over the admin login):

```bash
node --env-file=.env.local scripts/create-founder.mjs +237600000000 "YourPassw0rd" "Founder"
```

Staff sign in exists only on the **admin app**, at [http://localhost:3001/login](http://localhost:3001/login). The customer site has no staff login, no Staff link, and no `/admin` route. The admin app keeps its own session cookies, so a customer login on port 3000 does not sign anyone into the panel.

## Running locally

```bash
npm run dev
npm run dev:admin
```

Open the customer site at [http://localhost:3000](http://localhost:3000) and the founder panel at [http://localhost:3001](http://localhost:3001).

Without Supabase keys the customer app runs in **demo mode**: sign up with a valid phone and a password of at least 8 characters (one capital letter and one number). Data stays in this browser.

Useful URLs:

- Marketing site: `http://localhost:3000/`
- Client login: `http://localhost:3000/login`
- Client books: `http://localhost:3000/app`
- Staff (this device only, after unlock): `http://localhost:3001/login`

## Testing

There is no automated test suite yet. Use:

```bash
npm run lint
npm run build
```

Then click through signup, a transaction, a goal, appearance (including night mode), and staff login.

## Production deployment

1. Set every production environment variable listed above on **both** apps.
2. Point `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_WEB_URL` at the customer domain and `NEXT_PUBLIC_ADMIN_URL` at the panel domain.
3. Deploy the customer app from the repo root and the founder panel from `admin-dashboard/` (two hosts, or two Vercel projects).
4. Confirm HTTPS, Supabase Auth redirect URLs, and that the admin app is not indexed.

Product requirements live in [`docs/SRS.md`](docs/SRS.md).

## API documentation

Tempora does not publish a public HTTP API. Mutations go through Next.js server actions (`src/app/actions/`) and Supabase with row-level security. The founder panel uses the service role on the server only.

## Scripts

- `npm run dev` — customer site on port 3000
- `npm run dev:admin` — founder panel on port 3001
- `npm run build` / `npm run build:admin` — production builds
- `npm run start` / `npm run start:admin` — serve the production builds
- `npm run lint` — ESLint
