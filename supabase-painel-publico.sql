grant select on table public.site_visits to anon;

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
  page = '/jogo-de-panelas-10-pecas-antiaderente-coffee-cappuccino-kit-talheres/'
  and char_length(session_id) between 1 and 100
  and device in ('Celular', 'Computador')
  and (referrer is null or char_length(referrer) <= 500)
);
