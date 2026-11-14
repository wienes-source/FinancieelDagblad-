const esc = WINN_PUBLIC.esc;
(async () => {
  const view = document.getElementById('articleView');
  try {
    const {articles} = await WINN_PUBLIC.content();
    const id = new URLSearchParams(location.search).get('id');
    const article = articles.find(a => a.id === id);
    if (!article) { view.innerHTML = WINN_PUBLIC.unavailable(); return; }
    document.title = `${article.title.replace(/&nbsp;/g, ' ')} | FINANCIEEL DAGBLAD WINN`;
    const sourceUrl = /^https?:\/\//i.test(article.sourceUrl || '') ? article.sourceUrl : '';
    view.innerHTML = `<span class="article-section">${esc((article.section || '').toUpperCase())}</span>
      <h1>${esc(article.title)}</h1><p class="article-subtitle">${esc(article.subtitle)}</p>
      <div class="article-byline">FINANCIEEL DAGBLAD WINN · ${esc(WINN_PUBLIC.datum(article.date))} · Paramaribo</div>
      <img class="article-image" src="${esc(article.image || 'assets/favicon.png')}" alt="">
      <p class="article-lead">${esc(article.lead)}</p>
      <div class="article-body">${(article.body || []).map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${sourceUrl ? `<p><a href="${esc(sourceUrl)}" target="_blank" rel="noopener">Lees het oorspronkelijke bericht bij ${esc(article.source || 'de bron')}</a></p>` : ''}
      ${typeof winnDeelbalk === 'function' ? winnDeelbalk(article.id, article.title) : ''}`;
    document.getElementById('relatedArticles').innerHTML = articles.filter(a => a.id !== id).slice(0, 4).map(a =>
      `<a class="related-link" href="artikel.html?id=${encodeURIComponent(a.id)}"><span>${esc((a.section || '').toUpperCase())}</span><b>${esc(a.title)}</b></a>`).join('');
  } catch (_) {
    view.innerHTML = '<h1>Artikel kon niet worden geladen</h1><p><a href="index.html">Naar de voorpagina</a></p>';
  }
})();
