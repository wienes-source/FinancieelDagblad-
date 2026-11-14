# FINANCIEEL DAGBLAD WINN

Statische krant op GitHub Pages. Er is geen externe database, betaald account, API-sleutel of server nodig voor de dagelijkse editie.

## Publiceren

De workflow `.github/workflows/daily-edition.yml` draait dagelijks en na wijzigingen aan `main`. Hij controleert de code, haalt nieuws op, slaat de nieuwe editie op en publiceert `_site` via GitHub Pages. De workflow kan ook handmatig gestart worden via Actions > Daily Edition > Run workflow.

GitHub Pages moet als publicatiebron **GitHub Actions** gebruiken (Settings > Pages > Source).

`data/articles.json` bevat alleen de nieuwste openbare editie. `data/editions.json` bevat het overzicht van eerdere edities. Oudere afgeschermde artikelen worden niet openbaar gemaakt. Accountregistratie, betaalde archieftoegang en de automatische nieuwsbrief zijn uitgeschakeld. Historische gegevens in de voormalige database worden door deze wijziging niet verwijderd.

`scripts/build_site.py` publiceert alleen de actieve website en de benodigde gegevens. Oude sitekopieën, scripts, SQL-bestanden en `content.json` gaan niet mee naar de website.

## Controle

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/homepage.cjs
node tests/pricing.cjs
node tests/publication.cjs
python3 scripts/build_site.py
```

GitHub Pages en de Actions-runners voor deze openbare repository kunnen met GitHub Free worden gebruikt. Er zijn geen betaalde diensten toegevoegd.
