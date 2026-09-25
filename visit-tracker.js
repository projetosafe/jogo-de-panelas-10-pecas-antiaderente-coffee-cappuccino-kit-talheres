(function () {
  const SUPABASE_URL = 'https://kdgsajlvbhnemyhrpfid.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HheH5VnIfC8F_QpSUCZOkA_luBxmQM0';
  const visitorKey = 'site_unique_visitor_id';
  const dailyVisitKey = 'site_daily_visit_date';
  const journeyKey = 'site_visit_journey';
  let visitorId = localStorage.getItem(visitorKey);
  let sessionId = '';
  let currentPage = location.pathname;
  let cachedDeviceModel = '';

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(visitorKey, visitorId);
  }

  function localDateKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function refreshDailySession() {
    sessionId = `${visitorId}:${localDateKey()}`;
    return sessionId;
  }

  refreshDailySession();

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
    refreshDailySession();
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
    refreshDailySession();
    if (localStorage.getItem(dailyVisitKey) === localDateKey()) {
      await updatePresence(currentPage);
      return;
    }
    const payload = {
      session_id: sessionId,
      page: currentPage,
      referrer: document.referrer || null,
      device: deviceType(),
      device_model: await deviceModel()
    };
    let response = await send('site_visits', payload);
    if (!response.ok && payload.device_model) {
      delete payload.device_model;
      response = await send('site_visits', payload);
    }
    if (response.ok) localStorage.setItem(dailyVisitKey, localDateKey());
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
