-- Members rate Tempora (1–5 stars) and leave impressions. One review per
-- account, like a store listing; replies let others discuss a review.

create table if not exists public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  author_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(body) <= 1500)
);

create index if not exists project_reviews_created_idx
  on public.project_reviews (created_at desc);

create table if not exists public.project_review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.project_reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_label text not null,
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(body) between 2 and 800)
);

create index if not exists project_review_replies_review_idx
  on public.project_review_replies (review_id, created_at);

alter table public.project_reviews enable row level security;
alter table public.project_review_replies enable row level security;

drop policy if exists project_reviews_select on public.project_reviews;
create policy project_reviews_select on public.project_reviews
  for select to authenticated using (true);

drop policy if exists project_reviews_insert on public.project_reviews;
create policy project_reviews_insert on public.project_reviews
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists project_reviews_update on public.project_reviews;
create policy project_reviews_update on public.project_reviews
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists project_reviews_delete on public.project_reviews;
create policy project_reviews_delete on public.project_reviews
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists project_review_replies_select on public.project_review_replies;
create policy project_review_replies_select on public.project_review_replies
  for select to authenticated using (true);

drop policy if exists project_review_replies_insert on public.project_review_replies;
create policy project_review_replies_insert on public.project_review_replies
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists project_review_replies_delete on public.project_review_replies;
create policy project_review_replies_delete on public.project_review_replies
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.project_reviews to authenticated;
grant select, insert, delete on public.project_review_replies to authenticated;
