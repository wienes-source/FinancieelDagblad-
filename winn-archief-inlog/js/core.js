/* Gedeelde functies voor de rubriekpagina's (nieuws, economie, regio, sectoren, markten, info).
   Leest de dagelijkse editie uit data/editions.json en data/articles.json;
   marktgegevens uit data/markets.json (dagelijks bijgewerkt). */
const WINN = {
  _cache: {},
  async json(path) {
    if (!this._cache[path]) this._cache[path] = fetch(path, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error('Kon ' + path + ' niet laden'); return r.json();
    });
    return this._cache[path];
  },
  // Rubrieken op de site → secties uit de dagelijkse editie
  rubrieken: {
    nieuws: null,
    economie: ['Economie', 'Investeringsprojecten', 'Energie'],
    regio: ['Guyana', 'India', 'Frans-Guyana', 'Brazilië'],
    sectoren: ['IT & Innovatie', 'Energie', 'Medische Sector', 'Landbouw', 'Toerisme', 'Infrastructuur']
  },
  async content() {
    const [editions, articles] = await Promise.all([this.json('data/editions.json'), this.json('data/articles.json')]);
    let markets = null;
    try { markets = await this.json('data/markets.json'); }
    catch (_) { try { markets = (await this.json('content.json')).markets; } catch (__) {} }
    return { editions, articles, markets };
  },
  fmtDate(s) { return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(s + 'T12:00:00')); },
  esc(s = '') { return String(s ?? '').replace(/&nbsp;/g, ' ').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); },
  latestEdition(c) { return [...c.editions].sort((a, b) => b.date.localeCompare(a.date))[0]; },
  articleById(c, id) { return c.articles.find(a => a.id === id); },
  articleLink(a) { return `artikel.html?id=${encodeURIComponent(a.id)}`; },
  async headerEdition() {
    const el = document.getElementById('editionCard');
    if (!el) return;
    try {
      const e = this.latestEdition(await this.content());
      el.innerHTML = `<span class="day">LAATSTE EDITIE</span><strong>${this.esc(e.displayDate)}</strong><small>${this.esc(e.year)} | ${this.esc(e.number)}</small><div class="price"><b>${this.esc(e.priceEur)}</b><b>${this.esc(e.priceSrd)}</b></div><a class="edition-button" href="editie.html?date=${encodeURIComponent(e.date)}">Open editie</a>`;
    } catch (e) {
      el.innerHTML = '<span class="day">FINANCIEEL DAGBLAD WINN</span><strong>Digitale editie</strong>';
    }
  },
  async search(inputId, buttonId, outputId) {
    const input = document.getElementById(inputId), btn = document.getElementById(buttonId), box = document.getElementById(outputId);
    if (!input || !box) return;
    let c; try { c = await this.content(); } catch (e) { return; }
    const run = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { box.hidden = true; box.innerHTML = ''; return; }
      const rows = c.articles.filter(a => [a.title, a.subtitle, a.section, a.lead, (a.body || []).join(' ')].join(' ').toLowerCase().includes(q));
      box.hidden = false;
      box.innerHTML = rows.length ? rows.map(a => `<a class="search-result" href="${this.articleLink(a)}"><img src="${this.esc(a.image || 'assets/favicon.png')}" alt=""><div><h3>${this.esc(a.title)}</h3><small>${this.esc(a.section)} · ${this.fmtDate(a.date)}</small></div></a>`).join('')
        : `<p style="padding:10px">Geen artikelen gevonden voor “${this.esc(input.value)}” in de nieuwste editie. Zoek verder in het <a href="archief.html">archief</a>.</p>`;
    };
    if (btn) btn.addEventListener('click', run);
    input.addEventListener('input', run);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  },
  async cards(category, containerId) {
    const box = document.getElementById(containerId);
    if (!box) return;
    try {
      const c = await this.content(), secties = this.rubrieken[category];
      const rows = c.articles.filter(a => !secties || secties.includes(a.section)).sort((a, b) => b.date.localeCompare(a.date));
      box.innerHTML = rows.length ? rows.map(a => `<article class="card"><img src="${this.esc(a.image || 'assets/favicon.png')}" alt=""><div class="card-body"><span class="section">${this.esc((a.section || '').toUpperCase())}</span><h3>${this.esc(a.title)}</h3><p>${this.esc(a.lead)}</p><a href="${this.articleLink(a)}">Lees verder →</a></div></article>`).join('')
        : '<p>In de nieuwste editie staan geen artikelen in deze rubriek. Eerdere artikelen vind je in het <a href="archief.html">archief</a>.</p>';
    } catch (e) {
      box.innerHTML = '<p>De artikelen konden niet worden geladen. Ververs de pagina.</p>';
    }
  },
  init() { this.headerEdition(); }
};
document.addEventListener('DOMContentLoaded', () => WINN.init());
