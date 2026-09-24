grant select on table public.site_visits to anon;

alter table public.site_visits
add column if not exists device_model text;

drop policy if exists "Permitir leitura do painel" on public.site_visits;
create policy "Permitir leitura do painel"
on public.site_visits
for select
to anon
using (true);

drop policy if exists "Permitir registro público de visitas" on public.site_visits;
create policy "Permitir registro público de visitas"
on public.site_visits
for insert
to anon
with check (
  page in (
    'Produto',
    'Checkout',
    'Pagamento Pix',
    '/jogo-de-panelas-10-pecas-antiaderente-coffee-cappuccino-kit-talheres/',
    '/jogo-de-panelas-10-pecas-antiaderente-coffee-cappuccino-kit-talheres/checkout.html'
  )
  and char_length(session_id) between 1 and 100
  and device in ('Celular', 'Computador')
  and (device_model is null or char_length(device_model) <= 100)
  and (referrer is null or char_length(referrer) <= 500)
);


create table if not exists public.site_live_sessions (
  session_id text primary key,
  current_page text not null,
  path jsonb not null default '[]'::jsonb,
  last_seen timestamptz not null default now(),
  device text not null,
  device_model text,
  referrer text
);

alter table public.site_live_sessions enable row level security;

grant select, insert, update on table public.site_live_sessions to anon;

drop policy if exists "Permitir presença pública" on public.site_live_sessions;
create policy "Permitir presença pública"
on public.site_live_sessions
for insert
to anon
with check (
  char_length(session_id) between 1 and 100
  and char_length(current_page) between 1 and 300
  and jsonb_typeof(path) = 'array'
  and jsonb_array_length(path) <= 8
  and device in ('Celular', 'Computador')
  and (device_model is null or char_length(device_model) <= 100)
  and (referrer is null or char_length(referrer) <= 500)
);

drop policy if exists "Permitir atualização da presença" on public.site_live_sessions;
create policy "Permitir atualização da presença"
on public.site_live_sessions
for update
to anon
using (true)
with check (
  char_length(session_id) between 1 and 100
  and char_length(current_page) between 1 and 300
  and jsonb_typeof(path) = 'array'
  and jsonb_array_length(path) <= 8
  and device in ('Celular', 'Computador')
  and (device_model is null or char_length(device_model) <= 100)
  and (referrer is null or char_length(referrer) <= 500)
);

drop policy if exists "Permitir leitura da presença" on public.site_live_sessions;
create policy "Permitir leitura da presença"
on public.site_live_sessions
for select
to anon
using (true);

do $$
begin
  alter publication supabase_realtime add table public.site_live_sessions;
exception
  when duplicate_object then null;
end $$;
