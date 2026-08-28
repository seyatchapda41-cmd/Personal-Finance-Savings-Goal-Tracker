-- Monthly expense cap set by a client. Founder reports compare this planned
-- amount with actual spending in the same month.

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month text not null,
  expense_limit numeric(12, 2) not null check (expense_limit >= 0),
  unique (user_id, month)
);

create index if not exists monthly_budgets_user_idx
  on public.monthly_budgets (user_id, month);

alter table public.monthly_budgets enable row level security;

drop policy if exists monthly_budgets_self on public.monthly_budgets;
create policy monthly_budgets_self on public.monthly_budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
