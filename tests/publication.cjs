const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const today = '2026-11-14';
const editions = [{date:'2026-11-13',displayDate:'Oud',articleIds:['old']},{date:today,displayDate:'Vandaag',articleIds:['new'],number:'Editie 2'}];
const articles = [{id:'old',date:'2026-11-13',title:'Afgeschermd',section:'Oud',body:['Niet publiceren']},{id:'new',date:today,title:'<Nieuws>',section:'Economie',body:['Tekst'],sourceUrl:'javascript:bad'}];
async function page(script, search = '', offline = false) {
 const els = Object.fromEntries(['editionList','archiveSearch','editionHeader','editionArticles','articleView','relatedArticles'].map(id=>[id,{innerHTML:'',addEventListener(){}}]));
 const calls=[];
 const ctx=vm.createContext({Intl,URLSearchParams,Map,Set,location:{search},document:{getElementById:id=>els[id]},WINN_PRICE:{load:async()=>({note:'Koers',label:'SRD 200'})},fetch:async path=>{calls.push(path);if(offline)throw Error('offline');return {ok:true,json:async()=>path.includes('editions')?editions:articles};}});
 vm.runInContext(fs.readFileSync('publication.js','utf8'),ctx);
 await vm.runInContext(fs.readFileSync(script,'utf8'),ctx);
 assert.ok(calls.every(p=>p==='data/editions.json'||p==='data/articles.json'));
 return els;
}
(async()=>{
 let e=await page('archive.js');
 assert.equal((e.editionList.innerHTML.match(/Open editie/g)||[]).length,1);
 assert.ok(e.editionList.innerHTML.includes('Niet online beschikbaar'));
 e=await page('edition.js');
 assert.ok(e.editionArticles.innerHTML.includes('&lt;Nieuws&gt;'));
 assert.ok(!e.editionArticles.innerHTML.includes('Afgeschermd'));
 e=await page('edition.js','?date=2026-11-13');
 assert.ok(e.editionArticles.innerHTML.includes('niet online beschikbaar'));
 assert.ok(!e.editionArticles.innerHTML.includes('Niet publiceren'));
 e=await page('edition.js','?date=2099-01-01');
 assert.ok(e.editionHeader.innerHTML.includes('Editie niet gevonden'));
 e=await page('article.js','?id=new');
 assert.ok(e.articleView.innerHTML.includes('&lt;Nieuws&gt;'));
 assert.ok(!e.articleView.innerHTML.includes('javascript:'));
 e=await page('article.js','?id=old');
 assert.ok(e.articleView.innerHTML.includes('niet online beschikbaar'));
 assert.ok(!e.articleView.innerHTML.includes('Niet publiceren'));
 e=await page('article.js','?id=new',true);
 assert.ok(e.articleView.innerHTML.includes('kon niet worden geladen'));
 console.log('Publicatie getest: nieuwste editie, archiefoverzicht, afscherming, onbekende datum, bronlinks en laadfouten.');
})().catch(e=>{console.error(e);process.exitCode=1;});
