(function () {
  const SUPABASE_URL = 'https://kdgsajlvbhnemyhrpfid.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HheH5VnIfC8F_QpSUCZOkA_luBxmQM0';
  const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const list = document.getElementById('visits-list');
  const status = document.getElementById('status');

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
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function pageLabel(page) {
    if (page === 'Produto' || page.endsWith('/jogo-de-panelas-10-pecas-antiaderente-coffee-cappuccino-kit-talheres/')) return 'Produto';
    if (page === 'Checkout' || page.endsWith('/checkout.html')) return 'Checkout';
    if (page === 'Pagamento Pix') return 'Pagamento Pix';
    return page;
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

  document.getElementById('refresh').addEventListener('click', loadVisits);
  db.channel('site-visits-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'site_visits' }, loadVisits)
    .subscribe(function (state) {
      if (state === 'SUBSCRIBED') status.textContent = 'Ao vivo';
    });
  loadVisits();
})();
