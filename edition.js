
async function getJSON(path){ const r=await fetch(path); if(!r.ok) throw new Error(); return r.json(); }
(async()=>{
  const date=new URLSearchParams(location.search).get('date');
  try{
    const [editions,articles]=await Promise.all([getJSON('data/editions.json'),getJSON('data/articles.json')]);
    const e=editions.find(x=>x.date===date) || editions.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    document.title=`${e.displayDate} | FINANCIEEL DAGBLAD WINN`;
    document.getElementById('editionHeader').innerHTML=`
      <span class="eyebrow">${e.label}</span>
      <h2>${e.displayDate}</h2>
      <p><b>${e.year} · ${e.number}</b><br>${e.summary}</p>
      <div class="edition-meta"><span>${e.priceEur}</span><span>${e.priceSrd}</span><span>Paramaribo</span></div>`;
    const selected=e.articleIds.map(id=>articles.find(a=>a.id===id)).filter(Boolean);
    document.getElementById('editionArticles').innerHTML=selected.length?selected.map(a=>`
      <article class="edition-article-card">
        <img src="${a.image}" alt="">
        <div><span>${a.section.toUpperCase()}</span><h3>${a.title}</h3><p>${a.lead}</p>
        <a href="artikel.html?id=${encodeURIComponent(a.id)}">Lees verder →</a></div>
      </article>`).join(''):'<p>Voor deze archiefeditie zijn nog geen losse digitale artikelen toegevoegd.</p>';
  }catch(e){
    document.getElementById('editionHeader').innerHTML='<h2>Editie niet gevonden</h2>';
  }
})();
