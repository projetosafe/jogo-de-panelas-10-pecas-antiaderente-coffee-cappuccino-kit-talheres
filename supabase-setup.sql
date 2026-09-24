create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  session_id text not null,
  page text not null,
  referrer text,
  device text not null
);

alter table public.site_visits enable row level security;

create policy "Permitir registro público de visitas"
on public.site_visits
for insert
to anon
with check (true);

create policy "Permitir leitura do painel"
on public.site_visits
for select
to anon
using (true);

alter publication supabase_realtime add table public.site_visits;
