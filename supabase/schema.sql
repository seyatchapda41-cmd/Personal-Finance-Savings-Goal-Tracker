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

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

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

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;

create policy "profiles_self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "categories_self" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "transactions_self" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "goals_self" on public.savings_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.support_messages enable row level security;

create policy "support_messages_self" on public.support_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

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
