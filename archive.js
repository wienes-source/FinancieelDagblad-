/* Archief: lijst van alle edities uit Supabase; oudere edities op slot zonder toegang. */
const esc = WINN_AUTH.esc;
async function laadEdities() {
  try {
    const { data, error } = await WINN_SB.from('edities').select('*').order('datum', { ascending: false });
    if (error || !data?.length) throw error || Error('leeg');
    return data.map(WINN_AUTH.editie);
  } catch (error) {
    throw error;
  }
}
function render(editions, q, price, toegang, ingelogd) {
  const list = document.getElementById('editionList');
  const term = q.toLowerCase().trim();
  const sorted = editions.slice().sort((a, b) => b.date.localeCompare(a.date));
  const nieuwste = sorted[0]?.date;
  const rows = sorted.filter(e => !term ||
    [e.displayDate, e.number, e.year, e.summary, e.label].join(' ').toLowerCase().includes(term));
  list.innerHTML = rows.length ? rows.map(e => {
    const open = toegang || e.date === nieuwste;
    const link = `editie.html?date=${e.date}`;
    return `
    <article class="edition-entry">
      <div class="date-block"><span class="eyebrow">${esc(e.label)}</span><b>${esc(e.displayDate)}</b></div>
      <div><h3>${esc(e.year)} · ${esc(e.number)}</h3><p>${esc(e.summary)}</p>
        <p class="exchange-rate-note">${price.note}</p>
        <div class="edition-meta"><span>${esc(e.priceEur)}</span><span>${price.label}</span>
          <span>${e.articleIds.length} artikelen</span>${open ? '' : '<span class="slot-label">Voor lezers</span>'}</div>
      </div>
      <a class="edition-button" href="${open ? link : ingelogd ? 'abonnement.html' : WINN_AUTH.loginLink(link)}">${open ? 'Open editie' : ingelogd ? 'Abonnement nemen' : 'Inloggen om te lezen'}</a>
    </article>`;
  }).join('') : '<p>Geen edities gevonden. Probeer een andere zoekterm.</p>';
}
(async () => {
  try {
    WINN_AUTH.balk(document.getElementById('toegangBalk'));
    const [editions, price, s] = await Promise.all([laadEdities(), WINN_PRICE.load(), WINN_AUTH.status()]);
    render(editions, '', price, s.toegang, s.ingelogd);
    document.getElementById('archiveSearch').addEventListener('input', e => render(editions, e.target.value, price, s.toegang, s.ingelogd));
  } catch (e) {
    document.getElementById('editionList').innerHTML = '<p>Het archief kon niet worden geladen. Ververs de pagina.</p>';
  }
})();
