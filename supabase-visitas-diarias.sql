-- Execute uma vez no SQL Editor do Supabase.
-- Remove o histórico anterior, mantém apenas um visitante por dia
-- e permite que o painel limpe automaticamente os dias anteriores.

delete from public.site_visits
where visited_at < date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';

delete from public.site_live_sessions
where last_seen < date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';

delete from public.site_visits a
using public.site_visits b
where a.session_id = b.session_id
  and a.id > b.id;

create unique index if not exists site_visits_unique_daily_session
on public.site_visits (session_id);

create or replace function public.cleanup_site_visits_daily()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.site_visits
  where visited_at < date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';

  delete from public.site_live_sessions
  where last_seen < date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
$$;

revoke all on function public.cleanup_site_visits_daily() from public;
grant execute on function public.cleanup_site_visits_daily() to anon;

select public.cleanup_site_visits_daily();
