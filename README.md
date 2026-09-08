# FINANCIEEL DAGBLAD WINN — professionele digitale krant V2

Deze versie is geschikt voor GitHub Pages en bevat:

- professionele krantvormgeving;
- klikbare artikelen;
- zoekfunctie op de voorpagina;
- digitaal archief per datum;
- nieuwste editie automatisch bovenaan op basis van `data/editions.json`;
- aparte editiepagina;
- aparte artikelpagina;
- mobiele weergave met grotere tekst;
- PWA-basis zodat de site op een telefoon als web-app kan worden toegevoegd;
- locatie in de webversie: **Paramaribo**.

## Upload naar GitHub

Upload **de inhoud van deze map** naar de hoofdmap van uw repository. Vervang de bestaande bestanden met dezelfde naam.

Belangrijk: laat GitHub Pages staan op:
- Source: Deploy from a branch
- Branch: main
- Folder: /(root)

Na de commit wordt de live website automatisch bijgewerkt.

## Nieuwe dagelijkse editie toevoegen

1. Voeg nieuwe artikelen toe aan `data/articles.json`.
2. Voeg de nieuwe editie bovenaan toe aan `data/editions.json` (de website sorteert zelf op datum).
3. Upload eventuele nieuwe afbeeldingen in `assets/`.
4. Commit de wijzigingen.

De nieuwste datum verschijnt vervolgens automatisch als 'Laatste editie'.
