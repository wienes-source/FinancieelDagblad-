const esc = WINN_PUBLIC.esc;
function render(editions, query, latest) {
  const term = query.toLowerCase().trim();
  const rows = editions.filter(e => !term ||
    [e.date, e.displayDate, e.number, e.year, e.summary, e.label].join(' ').toLowerCase().includes(term));
  document.getElementById('editionList').innerHTML = rows.length ? rows.map(e => {
    const open = e.date === latest.date;
    return `<article class="edition-entry">
      <div class="date-block"><span class="eyebrow">${esc(e.label)}</span><b>${esc(e.displayDate)}</b></div>
      <div><h3>${esc(e.year)} · ${esc(e.number)}</h3><p>${esc(e.summary)}</p>
        <div class="edition-meta"><span>${(e.articleIds || []).length} artikelen</span>
        <span>${open ? 'Vrij te lezen' : 'Niet online beschikbaar'}</span></div></div>
      ${open ? `<a class="edition-button" href="editie.html?date=${encodeURIComponent(e.date)}">Open editie</a>` : ''}
    </article>`;
  }).join('') : '<p>Geen edities gevonden. Probeer een andere zoekterm.</p>';
}
(async () => {
  try {
    const {editions, latest} = await WINN_PUBLIC.content();
    render(editions, '', latest);
    document.getElementById('archiveSearch').addEventListener('input', e => render(editions, e.target.value, latest));
  } catch (_) {
    document.getElementById('editionList').innerHTML = '<p>Het archief kon niet worden geladen. Ververs de pagina.</p>';
  }
})();
