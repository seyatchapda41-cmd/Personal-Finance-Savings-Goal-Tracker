-- Tempora / Personal Finance & Savings Goal Tracker
-- Run in the Supabase SQL editor (production).

create extension if not exists "pgcrypto";

-- Phone number is the login credential for both account types; email is kept
-- for receipts and recovery.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  add column if not exists phone text;

create unique index if not exists profiles_phone_key on public.profiles (phone);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  unique (user_id, name)
);

-- origin records who put the row there: the client, an admin correction, or a
-- reversal cancelling an earlier row. reverses_id points a reversal at the row
-- it undoes, so both halves stay visible instead of the history being erased.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  description text,
  origin text not null default 'client'
    check (origin in ('client', 'admin', 'reversal')),
  reverses_id uuid references public.transactions (id) on delete set null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

create index if not exists transactions_reverses_idx
  on public.transactions (reverses_id);

-- Internal review state for a transaction: a flag customer service can raise
-- and a private note. Row level security is on with no policies, so a client
-- can neither read nor clear a flag placed on their own record.
create table if not exists public.transaction_reviews (
  transaction_id uuid primary key
    references public.transactions (id) on delete cascade,
  flagged boolean not null default false,
  flag_reason text,
  note text,
  reviewed_by text,
  reviewed_at timestamptz not null default now()
);

create index if not exists transaction_reviews_flagged_idx
  on public.transaction_reviews (flagged) where flagged;

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date date not null,
  created_at timestamptz not null default now()
);

-- Premium payments. Written at checkout, before the account exists, so
-- user_id is filled in once signup completes.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  phone text,
  amount numeric(12, 2) not null,
  amount_label text not null,
  card_last4 text,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists payments_created_idx
  on public.payments (created_at desc);

-- Customer service requests. Standard and Premium both write here; priority
-- records the service level the request must be answered under.
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ref text not null unique,
  plan text not null check (plan in ('free', 'premium')),
  priority text not null check (priority in ('standard', 'priority')),
  subject text not null,
  message text not null,
  callback_requested boolean not null default false,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists support_messages_queue_idx
  on public.support_messages (status, priority, created_at);

-- Follow-up messages on a ticket. The first message stays on support_messages;
-- staff and the client write every later line here.
create table if not exists public.support_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_messages (id) on delete cascade,
  author_type text not null check (author_type in ('client', 'staff')),
  author_label text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_replies_ticket_idx
  on public.support_replies (ticket_id, created_at);

alter table public.profiles
  add column if not exists suspended boolean not null default false;

alter table public.profiles
  add column if not exists suspended_reason text;

-- Admin team. Founders hold every permission; moderators are limited to
-- day to day work and cannot touch money or platform settings.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  role text not null check (role in ('founder', 'moderator')),
  full_name text,
  created_by text,
  created_at timestamptz not null default now()
);

-- Every action taken in the panel, kept for security review.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_phone text not null,
  actor_role text not null,
  action text not null,
  target_type text,
  target_label text,
  detail jsonb,
  outcome text not null default 'success'
    check (outcome in ('success', 'denied', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_created_idx
  on public.admin_audit_log (created_at desc);

-- Single row holding platform wide switches.
create table if not exists public.platform_settings (
  id boolean primary key default true check (id),
  maintenance_mode boolean not null default false,
  maintenance_message text,
  announcement text,
  announcement_active boolean not null default false,
  signups_enabled boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true)
  on conflict (id) do nothing;

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month text not null,
  expense_limit numeric(12, 2) not null check (expense_limit >= 0),
  unique (user_id, month)
);

create index if not exists monthly_budgets_user_idx
  on public.monthly_budgets (user_id, month);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;

create policy "profiles_self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "categories_self" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A client reads every row on their account, including corrections made for
-- them, but may only write rows they created themselves.
create policy "transactions_select_own" on public.transactions
  for select using (user_id = auth.uid());

create policy "transactions_insert_own" on public.transactions
  for insert with check (user_id = auth.uid() and origin = 'client');

create policy "transactions_update_own" on public.transactions
  for update using (user_id = auth.uid() and origin = 'client')
  with check (user_id = auth.uid() and origin = 'client');

create policy "transactions_delete_own" on public.transactions
  for delete using (user_id = auth.uid() and origin = 'client');

create policy "goals_self" on public.savings_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.support_messages enable row level security;

create policy "support_messages_self" on public.support_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.support_replies enable row level security;

create policy "support_replies_select_own" on public.support_replies
  for select using (
    exists (
      select 1 from public.support_messages t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

create policy "support_replies_insert_client" on public.support_replies
  for insert with check (
    author_type = 'client'
    and exists (
      select 1 from public.support_messages t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

alter table public.monthly_budgets enable row level security;

create policy "monthly_budgets_self" on public.monthly_budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No policies on these four: they are reachable only with the service role
-- key, which never leaves the server.
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.platform_settings enable row level security;
alter table public.transaction_reviews enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, full_name, plan)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    coalesce(new.raw_user_meta_data ->> 'email', new.email),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.phone,
      new.raw_user_meta_data ->> 'phone'
    ),
    case
      when new.raw_user_meta_data ->> 'plan' = 'premium' then 'premium'
      else 'free'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only the trigger should run this. Postgres checks the privilege when the
-- trigger is created, so revoking here does not stop it firing.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Lets a client delete their own account. The profile row, categories,
-- transactions and savings goals all cascade from auth.users.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
