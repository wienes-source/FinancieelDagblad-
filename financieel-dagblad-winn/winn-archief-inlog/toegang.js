/* Inlog en toegang tot het archief (Supabase). Laden na toegang-config.js en supabase-js. */
const WINN_SB = supabase.createClient(WINN_TOEGANG.supabaseUrl, WINN_TOEGANG.supabaseKey);

const WINN_AUTH = (() => {
  let cache;
  const esc = (v = '') => String(v ?? '').replace(/&nbsp;/g, ' ')
    .replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const datum = d => new Intl.DateTimeFormat('nl-NL', {day:'numeric', month:'long', year:'numeric'}).format(new Date(d));

  async function status() {
    if (cache) return cache;
    const { data: { session } } = await WINN_SB.auth.getSession();
    if (!session) return cache = { ingelogd: false, toegang: false };
    let { data: p, error } = await WINN_SB.from('profielen').select('is_demo, proef_tot, abonnement_tot').maybeSingle();
    if (error) ({ data: p } = await WINN_SB.from('profielen').select('is_demo, proef_tot').maybeSingle());
    const demo = !!p?.is_demo;
    const dagen = p ? Math.ceil((new Date(p.proef_tot) - new Date()) / 86400000) : 0;
    const abonnement = p?.abonnement_tot && new Date(p.abonnement_tot) > new Date() ? p.abonnement_tot : null;
    return cache = { ingelogd: true, email: session.user.email, demo, dagen, abonnement,
      proefTot: p?.proef_tot, toegang: demo || dagen > 0 || !!abonnement };
  }

  function loginLink(terug) {
    return 'login.html?terug=' + encodeURIComponent(terug || (location.pathname.split('/').pop() + location.search));
  }

  async function balk(el) {
    if (!el) return;
    const s = await status();
    let tekst;
    if (!s.ingelogd) tekst = `<span>Het archief is voor lezers met een account.</span>
      <a class="toegang-knop" href="${loginLink()}">Inloggen of gratis proef</a>`;
    else {
      const wie = s.demo ? 'Je bekijkt de demo'
        : s.abonnement ? `Abonnement tot ${datum(s.abonnement)}`
        : s.toegang ? `Proef tot ${datum(s.proefTot)} (nog ${s.dagen} ${s.dagen === 1 ? 'dag' : 'dagen'})`
        : 'Je proefmaand is afgelopen';
      const extra = (!s.demo && !s.abonnement) ? `<a class="toegang-knop" href="abonnement.html">Abonnement nemen</a>` : '';
      tekst = `<span>${wie}</span><span>${extra} <button type="button" class="toegang-knop licht" id="winnUit">Uitloggen</button></span>`;
    }
    el.innerHTML = tekst;
    el.hidden = false;
    document.getElementById('winnUit')?.addEventListener('click', async () => {
      await WINN_SB.auth.signOut(); location.reload();
    });
  }

  function slot(terug) {
    if (cache?.ingelogd && !cache.toegang) return `<div class="toegang-slot">
      <h3>Je proefmaand is afgelopen</h3>
      <p>Neem een abonnement om het volledige archief te blijven lezen.</p>
      <a class="toegang-knop" href="abonnement.html">Bekijk abonnementen</a></div>`;
    return `<div class="toegang-slot">
      <h3>Dit deel van het archief is voor lezers</h3>
      <p>Log in met de demo of start een gratis proefmaand om oudere edities te lezen.</p>
      <a class="toegang-knop" href="${loginLink(terug)}">Inloggen of gratis proef</a></div>`;
  }

  const editie = r => ({ date: r.datum, displayDate: r.display_date, number: r.nummer, year: r.jaargang,
    priceEur: r.prijs_eur, priceSrd: r.prijs_srd, exchangeRate: r.wisselkoers, label: r.label,
    summary: r.samenvatting, articleIds: r.artikel_ids || [] });
  const artikel = r => ({ id: r.id, date: r.datum, section: r.rubriek || '', title: r.titel, subtitle: r.ondertitel,
    image: r.afbeelding, lead: r.inleiding, body: r.tekst || [], source: r.bron, sourceUrl: r.bron_url });

  return { status, balk, slot, loginLink, editie, artikel, esc, datum };
})();
