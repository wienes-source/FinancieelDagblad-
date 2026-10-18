/* Bezoekersstatistieken met GoatCounter: zonder cookies, geen persoonsgegevens.
   Maak een gratis account op goatcounter.com en vul hieronder je code in (bijv. "fdwinn"). */
(function () {
  const code = "";  // ← jouw GoatCounter-code
  if (!code || location.hostname === 'localhost') return;
  const s = document.createElement('script');
  s.async = true;
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
})();
