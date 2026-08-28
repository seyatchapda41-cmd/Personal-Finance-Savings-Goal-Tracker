-- Admin oversight of client transactions (SRS v2, FR-B4).
-- Safe to run more than once.

-- Where a row came from. Client rows are the client's own work; admin rows are
-- corrections posted from the panel; reversal rows cancel an earlier row while
-- leaving both halves visible.
alter table public.transactions
  add column if not exists origin text not null default 'client';

alter table public.transactions
  drop constraint if exists transactions_origin_check;

alter table public.transactions
  add constraint transactions_origin_check
  check (origin in ('client', 'admin', 'reversal'));

alter table public.transactions
  add column if not exists reverses_id uuid
  references public.transactions (id) on delete set null;

alter table public.transactions
  add column if not exists created_by text;

create index if not exists transactions_reverses_idx
  on public.transactions (reverses_id);

-- Internal review state. Kept out of the transactions table so a client can
-- never read or clear a flag placed on their own record: this table has row
-- level security on with no policies, so only the service role reaches it.
create table if not exists public.transaction_reviews (
  transaction_id uuid primary key
    references public.transactions (id) on delete cascade,
  flagged boolean not null default false,
  flag_reason text,
  note text,
  reviewed_by text,
  reviewed_at timestamptz not null default now()
);

alter table public.transaction_reviews enable row level security;

create index if not exists transaction_reviews_flagged_idx
  on public.transaction_reviews (flagged) where flagged;

-- A client may only touch rows they created. Without this, a client could
-- delete or rewrite an admin correction or a reversal posted against them.
drop policy if exists "transactions_self" on public.transactions;

create policy "transactions_select_own" on public.transactions
  for select using (user_id = auth.uid());

create policy "transactions_insert_own" on public.transactions
  for insert with check (user_id = auth.uid() and origin = 'client');

create policy "transactions_update_own" on public.transactions
  for update using (user_id = auth.uid() and origin = 'client')
  with check (user_id = auth.uid() and origin = 'client');

create policy "transactions_delete_own" on public.transactions
  for delete using (user_id = auth.uid() and origin = 'client');
