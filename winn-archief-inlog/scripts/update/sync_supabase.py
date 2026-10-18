"""Zet alle edities en artikelen uit data/*.json in Supabase en houdt daarna
alleen de nieuwste editie openbaar in de repository.

Vereist GitHub-secrets SUPABASE_URL en SUPABASE_SERVICE_KEY.
Zonder die secrets doet dit script niets, zodat de site gewoon blijft werken.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

ARTICLES_FILE = Path("data/articles.json")
EDITIONS_FILE = Path("data/editions.json")
URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def upsert(table, conflict, rows):
    for start in range(0, len(rows), 200):
        body = json.dumps(rows[start:start + 200], ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            f"{URL}/rest/v1/{table}?on_conflict={conflict}", data=body, method="POST",
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                     "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates,return=minimal"})
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status >= 300:
                raise RuntimeError(f"{table}: HTTP {response.status}")


def main():
    if not URL or not KEY:
        print("Supabase-secrets ontbreken; archief niet gesynchroniseerd.")
        return 0
    articles = json.loads(ARTICLES_FILE.read_text(encoding="utf-8"))
    editions = json.loads(EDITIONS_FILE.read_text(encoding="utf-8"))
    articles = list({a["id"]: a for a in articles}.values())
    editions = list({e["date"]: e for e in editions}.values())

    upsert("edities", "datum", [{
        "datum": e["date"], "display_date": e.get("displayDate"), "nummer": e.get("number"),
        "jaargang": e.get("year"), "prijs_eur": e.get("priceEur"), "prijs_srd": e.get("priceSrd"),
        "wisselkoers": e.get("exchangeRate"), "label": e.get("label"),
        "samenvatting": e.get("summary"), "artikel_ids": e.get("articleIds", [])} for e in editions])
    upsert("artikelen", "id", [{
        "id": a["id"], "datum": a["date"], "rubriek": a.get("section"), "titel": a.get("title", ""),
        "ondertitel": a.get("subtitle"), "afbeelding": a.get("image"), "inleiding": a.get("lead"),
        "tekst": a.get("body", []), "bron": a.get("source"), "bron_url": a.get("sourceUrl")} for a in articles])
    print(f"Supabase bijgewerkt: {len(editions)} edities, {len(articles)} artikelen.")

    # Alleen na een geslaagde synchronisatie: openbaar alleen de nieuwste editie houden
    latest = max(editions, key=lambda e: e["date"])
    keep = set(latest.get("articleIds", []))
    public_articles = [a for a in articles if a["id"] in keep or a.get("date") == latest["date"]]
    EDITIONS_FILE.write_text(json.dumps([latest], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ARTICLES_FILE.write_text(json.dumps(public_articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Openbare bestanden ingekort tot editie {latest['date']} ({len(public_articles)} artikelen).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print("Synchronisatie mislukt, openbare bestanden ongewijzigd:", exc)
        sys.exit(1)
