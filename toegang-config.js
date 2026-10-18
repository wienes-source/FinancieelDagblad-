// Vul in vanuit Supabase > Project Settings > API
window.WINN_TOEGANG = {
  supabaseUrl: "https://JOUW-PROJECT.supabase.co",
  supabaseKey: "JOUW-ANON-PUBLIC-KEY",          // 'anon public', nooit de service_role
  demoEmail: "demo@financieeldagbladwinn.com",
  demoWachtwoord: "WINN-Demo-2026",

  // Abonnementen — pas prijzen en teksten aan
  pakketten: [
    { id: "maand", naam: "Maandabonnement", prijs: "€ 9,95 per maand", uitleg: "Maandelijks opzegbaar." },
    { id: "jaar",  naam: "Jaarabonnement",  prijs: "€ 99 per jaar",     uitleg: "Twee maanden voordeel." }
  ],
  betaalwijzen: ["Bankoverschrijving (Nederland)", "Bankoverschrijving (Suriname)", "Mope", "Uni5Pay"],
  betaalinstructie: "Maak het bedrag over naar IBAN NL00 BANK 0000 0000 00 t.n.v. FINANCIEEL DAGBLAD WINN, of in Suriname naar rekening 0000000 bij [bank]. Vermeld het kenmerk. Je abonnement wordt binnen één werkdag na ontvangst geactiveerd."
};
