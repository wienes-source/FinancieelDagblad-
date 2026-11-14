/* Alleen de nieuwste openbare editie bevat artikelen. */
const WINN_PUBLIC = (() => {
  const cache = new Map();
  const esc = (value = '') => String(value ?? '').replace(/&nbsp;/g, ' ')
    .replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const datum = value => new Intl.DateTimeFormat('nl-NL', {day:'numeric', month:'long', year:'numeric'})
    .format(new Date(value + 'T12:00:00'));
  async function json(path) {
    if (!cache.has(path)) cache.set(path, fetch(path, {cache:'no-store'}).then(response => {
      if (!response.ok) throw Error('Gegevens konden niet worden geladen');
      return response.json();
    }));
    return cache.get(path);
  }
  async function content() {
    const [editions, articles] = await Promise.all([json('data/editions.json'), json('data/articles.json')]);
    if (!editions.length) throw Error('Er zijn nog geen edities beschikbaar');
    const sorted = [...editions].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    const ids = new Set(latest.articleIds || []);
    return {editions:sorted, latest, articles:articles.filter(a => a.date === latest.date && ids.has(a.id))};
  }
  function unavailable() {
    return '<div class="toegang-slot"><h3>Deze editie is niet online beschikbaar</h3>' +
      '<p>De nieuwste editie is vrij te lezen. Oudere afgeschermde artikelen zijn niet openbaar gemaakt.</p>' +
      '<a class="edition-button" href="editie.html">Lees de nieuwste editie</a></div>';
  }
  return {content, esc, datum, unavailable};
})();
