/* Editiepagina: artikelen uit Supabase; zonder toegang alleen de nieuwste editie. */
const esc = WINN_AUTH.esc;
async function getJSON(path) { const r = await fetch(path, { cache: 'no-store' }); if (!r.ok) throw Error(); return r.json(); }
async function laad(date) {
  try {
    const { data: rows, error } = await WINN_SB.from('edities').select('*').order('datum', { ascending: false });
    if (error || !rows?.length) throw Error();
    const editions = rows.map(WINN_AUTH.editie);
    const e = editions.find(x => x.date === date) || editions[0];
    const { data: arts } = await WINN_SB.from('artikelen').select('*').in('id', e.articleIds);
    return { e, nieuwste: editions[0].date, articles: (arts || []).map(WINN_AUTH.artikel) };
  } catch (_) {
    const [editions, articles] = await Promise.all([getJSON('data/editions.json'), getJSON('data/articles.json')]);
    const sorted = editions.slice().sort((a, b) => b.date.localeCompare(a.date));
    return { e: sorted.find(x => x.date === date) || sorted[0], nieuwste: sorted[0].date, articles };
  }
}
(async () => {
  const date = new URLSearchParams(location.search).get('date');
  try {
    WINN_AUTH.balk(document.getElementById('toegangBalk'));
    const [{ e, nieuwste, articles }, price, s] = await Promise.all([laad(date), WINN_PRICE.load(), WINN_AUTH.status()]);
    document.title = `${e.displayDate} | FINANCIEEL DAGBLAD WINN`;
    document.getElementById('editionHeader').innerHTML = `
      <span class="eyebrow">${esc(e.label)}</span>
      <h2>${esc(e.displayDate)}</h2>
      <p><b>${esc(e.year)} · ${esc(e.number)}</b><br>${esc(e.summary)}</p>
      <p class="exchange-rate-note">${price.note}</p><div class="edition-meta"><span>${esc(e.priceEur)}</span><span>${price.label}</span><span>Paramaribo</span></div>`;
    const selected = e.articleIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
    const target = document.getElementById('editionArticles');
    if (!selected.length && e.date !== nieuwste && !s.toegang) { target.innerHTML = WINN_AUTH.slot(`editie.html?date=${e.date}`); return; }
    target.innerHTML = selected.length ? selected.map(a => `
      <article class="edition-article-card">
        <img src="${esc(a.image || 'assets/favicon.png')}" alt="">
        <div><span>${esc(a.section.toUpperCase())}</span><h3>${esc(a.title)}</h3><p>${esc(a.lead)}</p>
        <a href="artikel.html?id=${encodeURIComponent(a.id)}">Lees verder →</a></div>
      </article>`).join('') : '<p>Voor deze editie zijn nog geen losse digitale artikelen toegevoegd.</p>';
  } catch (err) {
    document.getElementById('editionHeader').innerHTML = '<h2>Editie niet gevonden</h2><p><a href="archief.html">Terug naar het archief</a></p>';
  }
})();
