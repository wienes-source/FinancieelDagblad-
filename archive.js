
async function loadData(path){ const r=await fetch(path); if(!r.ok) throw new Error(); return r.json(); }
function render(editions, q=''){
  const list=document.getElementById('editionList');
  const term=q.toLowerCase().trim();
  const rows=editions
    .slice()
    .sort((a,b)=>b.date.localeCompare(a.date))
    .filter(e=>!term || [e.displayDate,e.number,e.year,e.summary,e.label].join(' ').toLowerCase().includes(term));
  list.innerHTML=rows.length?rows.map(e=>`
    <article class="edition-entry">
      <div class="date-block"><span class="eyebrow">${e.label}</span><b>${e.displayDate}</b></div>
      <div><h3>${e.year} · ${e.number}</h3><p>${e.summary}</p>
        <div class="edition-meta"><span>${e.priceEur}</span><span>${e.priceSrd}</span><span>${e.articleIds.length} artikelen</span></div>
      </div>
      <a class="edition-button" href="editie.html?date=${e.date}">Open editie</a>
    </article>`).join(''):'<p>Geen edities gevonden.</p>';
}
(async()=>{
  try{
    const editions=await loadData('data/editions.json');
    render(editions);
    document.getElementById('archiveSearch').addEventListener('input',e=>render(editions,e.target.value));
  }catch(e){
    document.getElementById('editionList').innerHTML='<p>Het archief kon niet worden geladen.</p>';
  }
})();
