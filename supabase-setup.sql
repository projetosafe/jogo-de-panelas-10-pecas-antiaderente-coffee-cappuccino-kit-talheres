create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  session_id text not null,
  page text not null,
  referrer text,
  device text not null
);

alter table public.site_visits enable row level security;

grant insert on table public.site_visits to anon;
grant select on table public.site_visits to authenticated;
grant usage, select on sequence public.site_visits_id_seq to anon;

create policy "Permitir registro público de visitas"
on public.site_visits
for insert
to anon
with check (true);

create policy "Permitir leitura do painel"
on public.site_visits
for select
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('SEU_EMAIL_AQUI'));

alter publication supabase_realtime add table public.site_visits;
