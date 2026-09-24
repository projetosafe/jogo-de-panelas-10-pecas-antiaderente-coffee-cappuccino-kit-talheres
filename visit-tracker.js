(function () {
  const SUPABASE_URL = 'https://kdgsajlvbhnemyhrpfid.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HheH5VnIfC8F_QpSUCZOkA_luBxmQM0';
  const sessionKey = 'site_visit_session_id';
  const journeyKey = 'site_visit_journey';
  let sessionId = sessionStorage.getItem(sessionKey);
  let currentPage = location.pathname;
  let cachedDeviceModel = '';

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  }

  function deviceType() {
    return matchMedia('(max-width: 767px)').matches ? 'Celular' : 'Computador';
  }

  async function deviceModel() {
    if (cachedDeviceModel) return cachedDeviceModel;
    if (navigator.userAgentData && navigator.userAgentData.mobile && navigator.userAgentData.getHighEntropyValues) {
      try {
        const values = await navigator.userAgentData.getHighEntropyValues(['model']);
        if (values.model) cachedDeviceModel = values.model;
      } catch (_) {}
    }
    if (!cachedDeviceModel) {
      const ua = navigator.userAgent;
      const android = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|\))/i);
      if (android && android[1]) cachedDeviceModel = android[1].trim();
      else if (/iPhone/i.test(ua)) cachedDeviceModel = 'iPhone';
      else if (/iPad/i.test(ua)) cachedDeviceModel = 'iPad';
      else cachedDeviceModel = deviceType() === 'Celular' ? 'Modelo não identificado' : 'Computador';
    }
    return cachedDeviceModel;
  }

  function journeyFor(page) {
    let journey = [];
    try { journey = JSON.parse(sessionStorage.getItem(journeyKey) || '[]'); } catch (_) {}
    if (!Array.isArray(journey)) journey = [];
    if (journey[journey.length - 1] !== page) journey.push(page);
    journey = journey.slice(-8);
    sessionStorage.setItem(journeyKey, JSON.stringify(journey));
    return journey;
  }

  async function send(table, payload, prefer) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: prefer || 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
  }

  async function updatePresence(page) {
    currentPage = page || currentPage || location.pathname;
    const payload = {
      session_id: sessionId,
      current_page: currentPage,
      path: journeyFor(currentPage),
      last_seen: new Date().toISOString(),
      device: deviceType(),
      device_model: await deviceModel(),
      referrer: document.referrer || null
    };
    await send('site_live_sessions?on_conflict=session_id', payload, 'resolution=merge-duplicates,return=minimal');
  }

  async function recordVisit(page) {
    currentPage = page || location.pathname;
    const payload = {
      session_id: sessionId,
      page: currentPage,
      referrer: document.referrer || null,
      device: deviceType(),
      device_model: await deviceModel()
    };
    const response = await send('site_visits', payload);
    if (!response.ok && payload.device_model) {
      delete payload.device_model;
      await send('site_visits', payload);
    }
    await updatePresence(currentPage);
  }

  window.trackSitePage = recordVisit;
  recordVisit().catch(function () {});
  setInterval(function () {
    if (document.visibilityState === 'visible') updatePresence(currentPage).catch(function () {});
  }, 15000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') updatePresence(currentPage).catch(function () {});
  });
})();
