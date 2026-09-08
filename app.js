
async function getJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error('Kon gegevens niet laden');
  return r.json();
}
function formatEditionDate(dateStr){
  return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long',year:'numeric'}).format(new Date(dateStr+'T12:00:00'));
}
async function initEdition(){
  try{
    const editions = await getJSON('data/editions.json');
    editions.sort((a,b)=>b.date.localeCompare(a.date));
    const e = editions[0];
    const card = document.getElementById('editionCard');
    card.innerHTML = `
      <span class="day">LAATSTE EDITIE</span>
      <strong>${e.displayDate}</strong>
      <small>${e.year} | ${e.number}</small>
      <div class="price"><b>${e.priceEur}</b><b>${e.priceSrd}</b></div>
      <a class="edition-button" href="editie.html?date=${e.date}">Open editie</a>`;
  }catch(err){ console.warn(err); }
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
        <img src="${a.image}" alt="">
        <div><h3>${a.title}</h3><small>${a.section} · ${formatEditionDate(a.date)}</small></div>
      </a>`).join('') : `<p style="padding:10px">Geen artikelen gevonden voor “${input.value}”.</p>`;
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
