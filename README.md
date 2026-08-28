# Tempora — Personal Finance & Savings Goal Tracker

Company website plus authenticated tracker (Next.js, Tailwind, optional Supabase).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase keys the app runs in **demo mode**: sign up with any valid email and a password of at least 6 characters. Data is stored in this browser.

## Production (Supabase)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Set `ADMIN_PHONES` to the founder phone number (with country code).
5. Set `NEXT_PUBLIC_SITE_URL` to your domain.

The first founder account can be created with:

```bash
node --env-file=.env.local scripts/create-founder.mjs +237600000000 "YourPassw0rd" "Founder"
```

Staff then sign in at `/admin/login`.

Requirements live in [`docs/SRS.md`](docs/SRS.md). Version 2 adds the admin control panel, including management of every client's transactions.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve the production build
