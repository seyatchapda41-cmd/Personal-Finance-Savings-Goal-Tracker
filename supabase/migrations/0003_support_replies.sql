-- Conversation replies on a support ticket. The original request stays on
-- support_messages; each follow-up from the client or from staff is a row here.

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

alter table public.support_replies enable row level security;

drop policy if exists support_replies_select_own on public.support_replies;
create policy support_replies_select_own on public.support_replies
  for select using (
    exists (
      select 1 from public.support_messages t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

drop policy if exists support_replies_insert_client on public.support_replies;
create policy support_replies_insert_client on public.support_replies
  for insert with check (
    author_type = 'client'
    and exists (
      select 1 from public.support_messages t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );
