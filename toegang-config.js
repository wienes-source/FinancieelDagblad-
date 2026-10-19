// Vul in vanuit Supabase > Project Settings > API
window.WINN_TOEGANG = {
  supabaseUrl: "https://kcdhcesvrevlsshlvinx.supabase.co",
  supabaseKey: "sb_publishable_CjWbAPvfovGp8Q4c47Za4Q_Vqj0M5tC",          // 'anon public', nooit de service_role

  // Abonnementen — pas prijzen en teksten aan
  pakketten: [
    { id: "maand", naam: "Maandabonnement", prijs: "€ 9,95 per maand", uitleg: "Maandelijks opzegbaar." },
    { id: "jaar",  naam: "Jaarabonnement",  prijs: "€ 99 per jaar",     uitleg: "Twee maanden voordeel." }
  ],
  betaalwijzen: ["Bankoverschrijving (Nederland)", "Bankoverschrijving (Suriname)", "Mope", "Uni5Pay"],
  betaalinstructie: "De betaalgegevens worden afzonderlijk bevestigd. Maak geen bedrag over voordat je een bevestiging hebt ontvangen."
};
