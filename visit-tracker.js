(function () {
  const SUPABASE_URL = 'https://kdgsajlvbhnemyhrpfid.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HheH5VnIfC8F_QpSUCZOkA_luBxmQM0';
  const sessionKey = 'site_visit_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  }

  fetch(`${SUPABASE_URL}/rest/v1/site_visits`, {
    method: 'POST',
    keepalive: true,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      session_id: sessionId,
      page: location.pathname,
      referrer: document.referrer || null,
      device: matchMedia('(max-width: 767px)').matches ? 'Celular' : 'Computador'
    })
  }).catch(function () {});
})();
