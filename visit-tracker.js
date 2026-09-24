(function () {
  const SUPABASE_URL = 'https://kdgsajlvbhnemyhrpfid.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HheH5VnIfC8F_QpSUCZOkA_luBxmQM0';
  const sessionKey = 'site_visit_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  }

  function pageName() {
    return location.pathname;
  }

  async function deviceModel() {
    if (navigator.userAgentData && navigator.userAgentData.mobile && navigator.userAgentData.getHighEntropyValues) {
      try {
        const values = await navigator.userAgentData.getHighEntropyValues(['model']);
        if (values.model) return values.model;
      } catch (_) {}
    }

    const ua = navigator.userAgent;
    const android = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|\))/i);
    if (android && android[1]) return android[1].trim();
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    return matchMedia('(max-width: 767px)').matches ? 'Modelo não identificado' : 'Computador';
  }

  async function recordVisit(page) {
    const payload = {
      session_id: sessionId,
      page: page || pageName(),
      referrer: document.referrer || null,
      device: matchMedia('(max-width: 767px)').matches ? 'Celular' : 'Computador',
      device_model: await deviceModel()
    };
    const options = {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_visits`, options);
    if (!response.ok && payload.device_model) {
      delete payload.device_model;
      options.body = JSON.stringify(payload);
      await fetch(`${SUPABASE_URL}/rest/v1/site_visits`, options);
    }
  }

  window.trackSitePage = recordVisit;
  recordVisit().catch(function () {});
})();
