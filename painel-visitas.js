(function () {
  const SUPABASE_URL = 'https://kdgsajlvbhnemyhrpfid.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HheH5VnIfC8F_QpSUCZOkA_luBxmQM0';
  const ACTIVE_WINDOW_MS = 60 * 1000;
  const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const list = document.getElementById('visits-list');
  const liveList = document.getElementById('live-list');
  const status = document.getElementById('status');
  const liveStatus = document.getElementById('live-status');

  function startOfToday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  function sourceLabel(referrer) {
    if (!referrer) return 'Acesso direto';
    try { return new URL(referrer).hostname.replace(/^www\./, ''); }
    catch (_) { return 'Outro site'; }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function pageLabel(page) {
    const value = String(page || 'Página desconhecida');
    if (value === 'Produto' || value === '/' || value.endsWith('/jogo-de-panelas-10-pecas-antiaderente-coffee-cappuccino-kit-talheres/')) return 'Produto';
    if (value === 'Checkout' || value.endsWith('/checkout.html')) return 'Checkout';
    if (value === 'Pagamento Pix' || value.includes('#pagamento')) return 'Pagamento Pix';
    return value;
  }

  function relativeTime(dateValue) {
    const seconds = Math.max(0, Math.round((Date.now() - new Date(dateValue).getTime()) / 1000));
    if (seconds < 10) return 'agora';
    return `há ${seconds}s`;
  }

  function parsePath(value, currentPage) {
    let path = value;
    if (typeof path === 'string') {
      try { path = JSON.parse(path); } catch (_) { path = []; }
    }
    if (!Array.isArray(path)) path = [];
    const labels = path.map(pageLabel).filter(Boolean);
    const current = pageLabel(currentPage);
    if (!labels.length || labels[labels.length - 1] !== current) labels.push(current);
    return labels.slice(-8);
  }

  function renderRows(rows) {
    if (!rows.length) {
      list.innerHTML = '<tr><td colspan="4" class="empty">Nenhuma visita registrada.</td></tr>';
      return;
    }
    list.innerHTML = rows.slice(0, 50).map(function (visit) {
      const time = new Date(visit.visited_at).toLocaleString('pt-BR');
      const model = visit.device_model || visit.device || 'Não identificado';
      return `<tr><td>${escapeHtml(time)}</td><td>${escapeHtml(pageLabel(visit.page))}</td><td>${escapeHtml(model)}</td><td>${escapeHtml(sourceLabel(visit.referrer))}</td></tr>`;
    }).join('');
  }

  function renderLive(rows) {
    const active = rows
      .filter(row => Date.now() - new Date(row.last_seen).getTime() <= ACTIVE_WINDOW_MS)
      .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));

    document.getElementById('live-count').textContent = active.length;
    liveStatus.textContent = active.length === 1 ? '1 pessoa online' : `${active.length} pessoas online`;
    if (!active.length) {
      liveList.innerHTML = '<div class="empty">Ninguém navegando neste momento.</div>';
      return;
    }

    liveList.innerHTML = active.map(function (session, index) {
      const path = parsePath(session.path, session.current_page);
      const journey = path.map(function (page, pageIndex) {
        return `${pageIndex ? '<span class="journey-arrow">→</span>' : ''}<span class="journey-step${pageIndex === path.length - 1 ? ' current' : ''}">${escapeHtml(page)}</span>`;
      }).join('');
      const model = session.device_model || session.device || 'Dispositivo não identificado';
      return `<article class="live-visitor">
        <div class="visitor-head">
          <div><span class="active-pulse"></span><strong>Visitante ${index + 1}</strong></div>
          <time datetime="${escapeHtml(session.last_seen)}">${escapeHtml(relativeTime(session.last_seen))}</time>
        </div>
        <div class="current-page"><span>Agora em</span><strong>${escapeHtml(pageLabel(session.current_page))}</strong></div>
        <div class="journey" aria-label="Caminho percorrido">${journey}</div>
        <div class="visitor-device">${escapeHtml(model)}</div>
      </article>`;
    }).join('');
  }

  async function loadLive() {
    const limit = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
    const response = await db.from('site_live_sessions').select('*').gte('last_seen', limit).order('last_seen', { ascending: false });
    if (response.error) {
      liveStatus.textContent = 'Configuração pendente';
      liveList.innerHTML = '<div class="empty">Execute o SQL atualizado do painel no Supabase.</div>';
      document.getElementById('live-count').textContent = '—';
      return;
    }
    renderLive(response.data || []);
  }

  async function loadVisits() {
    status.textContent = 'Atualizando…';
    const response = await db.from('site_visits').select('*').order('visited_at', { ascending: false });
    if (response.error) {
      status.textContent = 'Configuração pendente';
      list.innerHTML = '<tr><td colspan="4" class="empty">Conclua a configuração do banco de dados.</td></tr>';
      return;
    }

    const rows = (response.data || []).filter(v => v.page !== '/verification');
    const today = rows.filter(v => v.visited_at >= startOfToday());
    const hourLimit = Date.now() - 60 * 60 * 1000;
    document.getElementById('today-count').textContent = today.length;
    document.getElementById('hour-count').textContent = rows.filter(v => new Date(v.visited_at).getTime() >= hourLimit).length;
    document.getElementById('unique-count').textContent = new Set(today.map(v => v.session_id)).size;
    document.getElementById('total-count').textContent = rows.length;
    renderRows(rows);
    status.textContent = 'Ao vivo';
  }

  function refreshAll() {
    loadVisits();
    loadLive();
  }

  document.getElementById('refresh').addEventListener('click', refreshAll);
  db.channel('site-dashboard-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_visits' }, loadVisits)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_live_sessions' }, loadLive)
    .subscribe(function (state) {
      if (state === 'SUBSCRIBED') {
        status.textContent = 'Ao vivo';
        liveStatus.textContent = 'Ao vivo';
      }
    });

  refreshAll();
  setInterval(loadLive, 15000);
})();
