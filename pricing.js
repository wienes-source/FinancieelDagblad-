/* Indicative CBvS rate via Frankfurter; round the converted price, not the rate. */
const WINN_PRICE = (() => {
  const endpoint = 'https://api.frankfurter.dev/v2/providers/cbvs/rate/eur/srd';
  let pending;
  function validate(value, now = new Date()) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(value?.date || '') ? Date.parse(value.date + 'T00:00:00Z') : NaN;
    const age = Math.floor(now.getTime()/86400000) - day/86400000;
    if (value?.base !== 'EUR' || value?.quote !== 'SRD' || !Number.isFinite(value.rate) || value.rate <= 0 || !Number.isFinite(age) || age < 0 || age > 7) throw Error('Geen recente EUR/SRD-koers');
    return value;
  }
  function convert(rate, euros = 4.8) {
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(euros) || euros < 0) throw Error('Ongeldig bedrag of koers');
    // Decimal multiplication with integer arithmetic avoids rounding 43.00000000001 up.
    const parts = value => { const [whole, fraction = ''] = String(value).split('.'); return [BigInt(whole + fraction), 10n ** BigInt(fraction.length)]; };
    const [r, rd] = parts(rate), [e, ed] = parts(euros), denominator = rd * ed;
    return Number((r * e + denominator - 1n) / denominator);
  }
  async function json(url) {
    const r = await fetch(url, {cache:'no-store', signal:AbortSignal.timeout(8000)});
    if (!r.ok) throw Error('Koersbron niet bereikbaar');
    return r.json();
  }
  async function fetchPrice() {
    let rate;
    try { rate = validate(await json(endpoint)); }
    catch (_) {
      try {
        const editions = await json('data/editions.json');
        const saved = [...editions].sort((a,b)=>b.date.localeCompare(a.date)).find(e=>e.exchangeRate);
        rate = validate(saved?.exchangeRate);
      } catch (_) { return {label:'SRD niet beschikbaar', note:'Dagkoers tijdelijk niet beschikbaar.'}; }
    }
    return {label:`SRD ${convert(rate.rate)}`, note:`Koers ${rate.date}: € 1 = ${new Intl.NumberFormat('nl-NL',{maximumFractionDigits:6}).format(rate.rate)} SRD · CBvS via Frankfurter`, rate};
  }
  return {load:()=>pending ||= fetchPrice(), validate, convert};
})();
