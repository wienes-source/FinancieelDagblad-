/* Deelknoppen. Linkt naar deel/<id>.html: die pagina heeft de titel en afbeelding voor WhatsApp en LinkedIn. */
function winnDeelbalk(sleutel, titel) {
  const map = location.href.replace(/[^/]*$/, '');
  const url = map + 'deel/' + encodeURIComponent(sleutel) + '.html';
  const t = encodeURIComponent(String(titel || '').replace(/&nbsp;/g, ' '));
  const u = encodeURIComponent(url);
  return `<div class="deel-balk">
    <a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener">Deel via WhatsApp</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener">Deel op LinkedIn</a>
    <button type="button" onclick="navigator.clipboard.writeText('${url.replace(/'/g, '%27')}').then(()=>{this.textContent='Link gekopieerd'})">Kopieer link</button>
  </div>`;
}
