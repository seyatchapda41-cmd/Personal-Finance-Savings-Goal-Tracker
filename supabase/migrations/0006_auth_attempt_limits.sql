-- Failed sign-in counters. No policies: only the service role, on the server, can read or write them.
create table if not exists public.auth_attempt_limits (
  bucket text primary key,
  failures integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.auth_attempt_limits enable row level security;

revoke all on table public.auth_attempt_limits from public, anon, authenticated;
