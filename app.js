
async function getJSON(path){
  const r = await fetch(path, {cache: 'no-store'});
  if(!r.ok) throw new Error('Kon gegevens niet laden');
  return r.json();
}
function formatEditionDate(dateStr){
  return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long',year:'numeric'}).format(new Date(dateStr+'T12:00:00'));
}
function esc(value = '') {
  return String(value ?? '').replace(/&nbsp;/g, ' ' ).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function articleLink(article) {
  return `artikel.html?id=${encodeURIComponent(article.id)}`;
}
function articleImage(article) {
  return esc(article.image || 'assets/favicon.png');
}
function selectEdition(editions, articles) {
  const edition = [...editions].sort((a,b) => b.date.localeCompare(a.date))[0];
  if (!edition) throw new Error('Er zijn nog geen edities beschikbaar.');
  const byId = new Map(articles.map(article => [article.id, article]));
  const selected = [...new Set(edition.articleIds || [])].map(id => byId.get(id)).filter(Boolean);
  return {edition, selected};
}
function renderHomepage(articles) {
  const lead = document.getElementById('nieuws');
  if (!lead) return;
  lead.innerHTML = articles.slice(0,2).map((a,i) => `
    <article class="lead${i === 0 ? ' lead-primary' : ''}"${i === 0 ? ' id="heroArticle"' : ''}>
      <div class="story-copy"><span class="headline-label">HOOFDNIEUWS ${i+1}</span><span class="kicker">${esc(a.section)}</span>
      <h2>${esc(a.title)}</h2><p class="deck">${esc(a.subtitle)}</p></div>
      <img src="${articleImage(a)}" alt=""><p>${esc(a.lead)}</p>
      <a class="readmore" href="${articleLink(a)}">Lees het volledige artikel →</a>
    </article>`).join('') || '<p>Voor deze editie zijn nog geen artikelen beschikbaar.</p>';
  document.getElementById('secondaryArticles').innerHTML = articles.slice(2,5).map((a,i) => `
    <a class="story-link" href="${articleLink(a)}"><article><div class="num">${i+3}</div>
      <img src="${articleImage(a)}" alt=""><div><h3>${esc(a.title)}</h3><p>${esc(a.subtitle || a.lead)}</p></div>
    </article></a>`).join('');
  const regional = new Set(['Guyana', 'India', 'Frans-Guyana', 'Brazilië']);
  document.getElementById('regionArticles').innerHTML = articles.filter(a => regional.has(a.section)).map(a => `
    <article><h3>${esc(a.section.toUpperCase())}</h3><p>${esc(a.title)}</p>
    <small>${esc(a.subtitle || a.lead)}</small><p><a href="${articleLink(a)}">Lees verder →</a></p></article>`).join('') || '<p>Geen regionaal nieuws in deze editie.</p>';
  document.getElementById('sectorArticles').innerHTML = articles.filter(a => !regional.has(a.section)).map(a => `
    <a class="story-link" href="${articleLink(a)}"><article><img src="${articleImage(a)}" alt="">
      <div><h3>${esc(a.section.toUpperCase())}</h3><p>${esc(a.title)}</p></div></article></a>`).join('');
}
async function initEdition(){
  const card = document.getElementById('editionCard');
  try {
    const [editions, articles] = await Promise.all([getJSON('data/editions.json'), getJSON('data/articles.json')]);
    const {edition:e, selected} = selectEdition(editions, articles);
    const price = await WINN_PRICE.load();
    if (card) card.innerHTML = `
      <span class="day">LAATSTE EDITIE</span><strong>${esc(e.displayDate || formatEditionDate(e.date))}</strong>
      <small>${esc(e.year)} | ${esc(e.number)}</small>
      <div class="price" title="${esc(price.note)}"><b>${esc(e.priceEur)}</b><b>${esc(price.label)}</b></div>
      <small class="exchange-rate-note">${esc(price.rate ? "Koersdatum: " + price.rate.date : price.note)}</small>
      <a class="edition-button" href="editie.html?date=${encodeURIComponent(e.date)}">Open editie</a>`;
    renderHomepage(selected);
  } catch(err) {
    console.warn(err);
    if (card) card.innerHTML = '<strong>De editie kon niet worden geladen.</strong><a href="">Opnieuw proberen</a>';
    const lead = document.getElementById('nieuws');
    if (lead) lead.innerHTML = '<p role="status">De artikelen konden niet worden geladen. Probeer de pagina opnieuw te laden.</p>';
  }
}
async function initSearch(){
  const input = document.getElementById('siteSearch');
  const btn = document.getElementById('searchButton');
  const box = document.getElementById('searchResults');
  if(!input) return;
  let articles = [];
  try{ articles = await getJSON('data/articles.json'); }catch(e){ return; }

  const run = () => {
    const q = input.value.trim().toLowerCase();
    if(!q){ box.hidden = true; box.innerHTML=''; return; }
    const results = articles.filter(a =>
      [a.title,a.subtitle,a.section,a.lead].join(' ').toLowerCase().includes(q)
    );
    box.hidden = false;
    box.innerHTML = results.length ? results.map(a=>`
      <a class="search-result" href="artikel.html?id=${encodeURIComponent(a.id)}">
        <img src="${articleImage(a)}" alt="">
        <div><h3>${esc(a.title)}</h3><small>${esc(a.section)} · ${formatEditionDate(a.date)}</small></div>
      </a>`).join('') : `<p style="padding:10px">Geen artikelen gevonden voor “${esc(input.value)}”.</p>`;
  };
  btn.addEventListener('click',run);
  input.addEventListener('input',run);
  input.addEventListener('keydown',e=>{if(e.key==='Enter') run();});
}
initEdition();
initSearch();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
}
