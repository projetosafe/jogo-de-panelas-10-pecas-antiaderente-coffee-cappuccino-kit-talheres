create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  session_id text not null,
  page text not null,
  referrer text,
  device text not null,
  device_model text
);

alter table public.site_visits enable row level security;

grant insert on table public.site_visits to anon;
grant select on table public.site_visits to anon;
grant usage, select on sequence public.site_visits_id_seq to anon;

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

create policy "Permitir leitura do painel"
on public.site_visits
for select
to anon
using (true);

alter publication supabase_realtime add table public.site_visits;
