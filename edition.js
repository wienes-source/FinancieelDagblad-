const esc = WINN_PUBLIC.esc;
(async () => {
  try {
    const [{editions, latest, articles}, price] = await Promise.all([WINN_PUBLIC.content(), WINN_PRICE.load()]);
    const requested = new URLSearchParams(location.search).get('date');
    const edition = requested ? editions.find(e => e.date === requested) : latest;
    if (!edition) throw Error('Editie niet gevonden');
    document.title = `${edition.displayDate} | FINANCIEEL DAGBLAD WINN`;
    document.getElementById('editionHeader').innerHTML = `<span class="eyebrow">${esc(edition.label)}</span>
      <h2>${esc(edition.displayDate)}</h2><p><b>${esc(edition.year)} · ${esc(edition.number)}</b><br>${esc(edition.summary)}</p>
      ${edition.date === latest.date ? `<p class="exchange-rate-note">${esc(price.note)}</p>
      <div class="edition-meta"><span>${esc(edition.priceEur)}</span><span>${esc(price.label)}</span><span>Paramaribo</span></div>` : ''}`;
    const target = document.getElementById('editionArticles');
    if (edition.date !== latest.date) { target.innerHTML = WINN_PUBLIC.unavailable(); return; }
    const selected = edition.articleIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
    target.innerHTML = selected.length ? selected.map(a => `<article class="edition-article-card">
      <img src="${esc(a.image || 'assets/favicon.png')}" alt=""><div><span>${esc((a.section || '').toUpperCase())}</span>
      <h3>${esc(a.title)}</h3><p>${esc(a.lead)}</p>
      <a href="artikel.html?id=${encodeURIComponent(a.id)}">Lees verder →</a></div></article>`).join('')
      : '<p>Voor deze editie zijn nog geen losse digitale artikelen toegevoegd.</p>';
  } catch (_) {
    document.getElementById('editionHeader').innerHTML = '<h2>Editie niet gevonden</h2><p><a href="archief.html">Terug naar het archief</a></p>';
  }
})();
