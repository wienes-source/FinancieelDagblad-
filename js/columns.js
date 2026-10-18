/* Columns uit data/columns.json (alleen items met "gepubliceerd": true). */
(async () => {
  const esc = WINN.esc;
  let columns = [];
  try {
    columns = (await WINN.json('data/columns.json')).filter(c => c.gepubliceerd)
      .sort((a, b) => b.datum.localeCompare(a.datum));
  } catch (_) {}
  const lijst = document.getElementById('columnLijst');
  if (lijst) {
    lijst.innerHTML = columns.length ? columns.map(c => `<article class="card"><div class="card-body">
      <span class="section">${esc((c.rubriek || 'COLUMN').toUpperCase())}</span><h3>${esc(c.titel)}</h3>
      <p>${esc(c.inleiding)}</p><p><small>${esc(c.auteur)}, ${WINN.fmtDate(c.datum)}</small></p>
      <a href="column.html?slug=${encodeURIComponent(c.slug)}">Lees de column →</a></div></article>`).join('')
      : '<p>Binnenkort verschijnt hier de eerste column.</p>';
    return;
  }
  const view = document.getElementById('columnView');
  const slug = new URLSearchParams(location.search).get('slug');
  const c = columns.find(x => x.slug === slug);
  if (!c) { view.innerHTML = '<h1>Column niet gevonden</h1><p><a href="columns.html">Alle columns</a></p>'; return; }
  document.title = `${c.titel} | FINANCIEEL DAGBLAD WINN`;
  view.innerHTML = `<span class="article-section">${esc((c.rubriek || 'COLUMN').toUpperCase())}</span>
    <h1>${esc(c.titel)}</h1>
    <div class="article-byline">${esc(c.auteur)} · ${WINN.fmtDate(c.datum)}</div>
    <p class="article-lead">${esc(c.inleiding)}</p>
    <div class="article-body">${c.tekst.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    ${winnDeelbalk('column-' + c.slug, c.titel)}`;
  document.getElementById('meerColumns').innerHTML = columns.filter(x => x.slug !== c.slug).slice(0, 4).map(x =>
    `<a class="related-link" href="column.html?slug=${encodeURIComponent(x.slug)}"><span>${esc(x.rubriek || 'COLUMN')}</span><b>${esc(x.titel)}</b></a>`).join('');
})();
