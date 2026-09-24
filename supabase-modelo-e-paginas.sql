alter table public.site_visits
add column if not exists device_model text;

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
