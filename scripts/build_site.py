"""Maak een statische publicatie zonder accounts, secrets of oude sitekopieën."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
PAGES = ("index.html", "404.html", "nieuws.html", "economie.html", "regio.html",
         "sectoren.html", "markten.html", "columns.html", "column.html", "ac-y2.html",
         "over-ons.html", "contact.html", "privacy.html", "archief.html", "editie.html",
         "artikel.html", "abonnement.html", "login.html", "afmelden.html")
SCRIPTS = ("app.js", "publication.js", "archive.js", "article.js", "edition.js",
           "pricing.js", "service-worker.js", "styles.css", "toegang.css",
           "manifest.webmanifest", "favicon.png")


def build(root=ROOT, output=OUTPUT):
    editions = json.loads((root / "data/editions.json").read_text(encoding="utf-8"))
    articles = json.loads((root / "data/articles.json").read_text(encoding="utf-8"))
    latest = max(editions, key=lambda e: e["date"])
    ids = set(latest["articleIds"])
    public = [a for a in articles if a["date"] == latest["date"] and a["id"] in ids]
    if not ids or {a["id"] for a in public} != ids:
        raise ValueError("Nieuwste editie bevat ontbrekende artikelen; publicatie gestopt")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for name in PAGES + SCRIPTS:
        shutil.copy2(root / name, output / name)
    for folder in ("assets", "js"):
        shutil.copytree(root / folder, output / folder)
    (output / "data").mkdir()
    for name in ("editions.json", "columns.json", "markets.json"):
        shutil.copy2(root / "data" / name, output / "data" / name)
    (output / "data/articles.json").write_text(json.dumps(public, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / ".nojekyll").touch()
    print(f"Website klaar: {latest['date']}, {len(public)} openbare artikelen")


if __name__ == "__main__":
    build()
