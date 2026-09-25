-- Execute uma vez no SQL Editor do Supabase como administrador.
-- Remove o histórico anterior, mantém apenas um visitante por dia
-- e agenda a limpeza no próprio banco, sem conceder exclusão pública.

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

create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'limpeza-visitas-diarias';

select cron.schedule(
  'limpeza-visitas-diarias',
  '5 3 * * *',
  $job$
    delete from public.site_visits
    where visited_at < date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';

    delete from public.site_live_sessions
    where last_seen < date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  $job$
);
