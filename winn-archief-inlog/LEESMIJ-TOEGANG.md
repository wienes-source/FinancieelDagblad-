# FINANCIEEL DAGBLAD WINN — installatie en beheer

Upload de inhoud van de zip naar de hoofdmap van de repository en vervang bestaande bestanden.
Controleer daarna dat de verborgen map `.github/workflows/` mee is gekomen.

## A. Supabase (inlog, archief, abonnementen)
1. Account op supabase.com > **New project**. Kies als regio **Central EU (Frankfurt)** (nodig voor de privacyverklaring).
2. **SQL Editor**: plak en run eerst `supabase-setup.sql`, daarna `supabase-update-2.sql`.
3. **Project Settings > API**: zet *Project URL* en *anon public*-sleutel in `toegang-config.js`.
4. Demo-account: **Authentication > Users > Add user** met e-mail en wachtwoord uit `toegang-config.js`, vink *Auto confirm* aan. Daarna in de SQL Editor:
   `update public.profielen set is_demo = true where email = 'demo@financieeldagbladwinn.com';`
5. **Authentication > URL Configuration**: *Site URL* = je site-adres, *Redirect URLs* = je site-adres gevolgd door `/**`.

## B. GitHub-instellingen
Repository > **Settings > Secrets and variables > Actions**.
Onder *Secrets*:
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_KEY`: de *service_role*-sleutel (nooit in een bestand zetten)
- `BREVO_API_KEY`: zie C
- `NIEUWSBRIEF_AFZENDER`: het afzenderadres dat je in Brevo hebt bevestigd
- `BEHEERDER_EMAIL`: jouw adres, voor het overzicht van abonnementsaanvragen
Onder *Variables* (alleen na stap E): `SITE_URL` = `https://www.jouwdomein.com`

Start daarna één keer **Actions > Daily Edition > Run workflow**. Dat zet het archief over naar Supabase.

## C. Ochtendmail (Brevo)
1. Gratis account op brevo.com (300 e-mails per dag gratis).
2. **Senders, Domains & Dedicated IPs**: voeg je afzenderadres toe en bevestig het. Met een eigen domein (stap E) ook het domein verifiëren, anders komt mail vaker in de spam.
3. **SMTP & API > API Keys > Generate**: zet de sleutel in het secret `BREVO_API_KEY`.
Elke ochtend krijgen lezers met een lopende proef of abonnement de koppen van de nieuwe editie. Jij krijgt een overzicht als er abonnementsaanvragen openstaan.

## D. Abonnementen
- Prijzen, betaalwijzen en betaalinstructie (IBAN, Surinaamse rekening) staan in `toegang-config.js`. Vul je echte gegevens in.
- Een lezer vraagt aan op de abonnementspagina en krijgt een kenmerk. Na ontvangst van betaling activeer je in Supabase > **SQL Editor**:
  `update public.profielen set abonnement_tot = now() + interval '1 month' where email = 'lezer@voorbeeld.com';`
  `update public.abonnement_aanvragen set afgehandeld = true where kenmerk = 'ABC123';`
  Gebruik `interval '1 year'` voor een jaarabonnement.

## E. Eigen domein
1. Koop het domein (bijv. financieeldagbladwinn.com).
2. Repository > **Settings > Pages > Custom domain**: vul `www.financieeldagbladwinn.com` in en vink *Enforce HTTPS* aan zodra dat kan.
3. Bij je domeinregistrar een DNS-record: **CNAME** `www` → `wienes-source.github.io`.
4. Pas daarna aan: Supabase *URL Configuration* (stap A5), de variabele `SITE_URL` (stap B) en de adressen in de `og:`-regels bovenaan `index.html`.

## F. Bezoekersstatistieken
Gratis account op goatcounter.com, kies een code (bijv. `fdwinn`) en vul die in `js/teller.js` in. Werkt zonder cookies, dus geen cookiemelding nodig.

## G. Privacyverklaring
Vul in `privacy.html` de vier plekken tussen [HAKEN] in: naam, adres, KvK-nummer en e-mailadres. Dit is een degelijke basis, geen juridisch advies; laat hem zo nodig nalezen.

## H. Columns
- Columns staan in `data/columns.json`. Er staat een concept klaar; vervang `[NAAM AUTEUR]`, werk de tekst bij en zet `"gepubliceerd": true`.
- Nieuwe column: kopieer een blok tussen `{ }`, geef een unieke `slug` (kleine letters en streepjes) en pas de velden aan. Op GitHub: bestand openen > potloodje > *Commit changes*.

## I. Markten
- Valuta en grondstoffen worden elke ochtend automatisch bijgewerkt in `data/markets.json`.
- Bauxiet en Surinaamse aandelen werk je zelf bij in `data/markten-handmatig.json`.

## Goed om te weten
- Artikelen en columns hebben deelknoppen voor WhatsApp en LinkedIn. Die gebruiken de pagina's in `deel/`, die de Action elke ochtend maakt.
- Oudere versies van de JSON-bestanden blijven zichtbaar in de GitHub-geschiedenis zolang de repository openbaar is.
- Het demo-wachtwoord kan door een technisch onderlegde bezoeker worden gewijzigd. Test de demo af en toe.
- Accounts zonder proef of abonnement worden 12 maanden na afloop automatisch verwijderd, zoals in de privacyverklaring staat. Betaalgegevens blijven 7 jaar bewaard.
