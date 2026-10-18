/* Artikelpagina: uit Supabase; oudere artikelen alleen met toegang. */
const esc = WINN_AUTH.esc;
async function getJSON(path) { const r = await fetch(path, { cache: 'no-store' }); if (!r.ok) throw Error(); return r.json(); }
async function laad(id) {
  try {
    const { data, error } = await WINN_SB.from('artikelen').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return { a: null };
    const { data: rel } = await WINN_SB.from('artikelen').select('id, rubriek, titel, datum')
      .eq('datum', data.datum).neq('id', data.id).limit(4);
    return { a: WINN_AUTH.artikel(data), related: (rel || []).map(WINN_AUTH.artikel) };
  } catch (_) {
    const articles = await getJSON('data/articles.json');
    const a = articles.find(x => x.id === id) || null;
    return { a, related: a ? articles.filter(x => x.id !== a.id && x.date === a.date).slice(0, 4) : [] };
  }
}
(async () => {
  const id = new URLSearchParams(location.search).get('id');
  const view = document.getElementById('articleView');
  try {
    const [{ a, related }, s] = await Promise.all([laad(id), WINN_AUTH.status()]);
    if (!a) {
      view.innerHTML = s.toegang ? '<h1>Artikel niet gevonden</h1><p><a href="archief.html">Naar het archief</a></p>'
        : WINN_AUTH.slot(`artikel.html?id=${encodeURIComponent(id || '')}`);
      return;
    }
    document.title = `${a.title.replace(/&nbsp;/g, ' ')} | FINANCIEEL DAGBLAD WINN`;
    view.innerHTML = `
      <span class="article-section">${esc(a.section.toUpperCase())}</span>
      <h1>${esc(a.title)}</h1>
      <p class="article-subtitle">${esc(a.subtitle)}</p>
      <div class="article-byline">FINANCIEEL DAGBLAD WINN · ${WINN_AUTH.datum(a.date + 'T12:00:00')} · Paramaribo</div>
      <img class="article-image" src="${esc(a.image || 'assets/favicon.png')}" alt="">
      <p class="article-lead">${esc(a.lead)}</p>
      <div class="article-body">${a.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${a.sourceUrl ? `<p><a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">Lees het oorspronkelijke bericht bij ${esc(a.source || 'de bron')}</a></p>` : ''}
      ${typeof winnDeelbalk === 'function' ? winnDeelbalk(a.id, a.title) : ''}`;
    document.getElementById('relatedArticles').innerHTML = related.map(x => `
      <a class="related-link" href="artikel.html?id=${encodeURIComponent(x.id)}">
        <span>${esc(x.section.toUpperCase())}</span><b>${esc(x.title)}</b>
      </a>`).join('');
  } catch (e) { view.innerHTML = '<h1>Artikel niet gevonden</h1><p><a href="index.html">Naar de voorpagina</a></p>'; }
})();
