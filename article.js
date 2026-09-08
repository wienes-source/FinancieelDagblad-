
async function getJSON(path){ const r=await fetch(path); if(!r.ok) throw new Error(); return r.json(); }
function fmt(dateStr){ return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long',year:'numeric'}).format(new Date(dateStr+'T12:00:00')); }
(async()=>{
  const id=new URLSearchParams(location.search).get('id');
  const view=document.getElementById('articleView');
  try{
    const articles=await getJSON('data/articles.json');
    const a=articles.find(x=>x.id===id) || articles[0];
    document.title=`${a.title} | FINANCIEEL DAGBLAD WINN`;
    view.innerHTML=`
      <span class="article-section">${a.section.toUpperCase()}</span>
      <h1>${a.title}</h1>
      <p class="article-subtitle">${a.subtitle}</p>
      <div class="article-byline">FINANCIEEL DAGBLAD WINN · ${fmt(a.date)} · Paramaribo</div>
      <img class="article-image" src="${a.image}" alt="">
      <p class="article-lead">${a.lead}</p>
      <div class="article-body">${a.body.map(p=>`<p>${p}</p>`).join('')}</div>`;
    const related=articles.filter(x=>x.id!==a.id).slice(0,4);
    document.getElementById('relatedArticles').innerHTML=related.map(x=>`
      <a class="related-link" href="artikel.html?id=${encodeURIComponent(x.id)}">
        <span>${x.section.toUpperCase()}</span><b>${x.title}</b>
      </a>`).join('');
  }catch(e){ view.innerHTML='<h1>Artikel niet gevonden</h1><p>Ga terug naar de voorpagina.</p>'; }
})();
