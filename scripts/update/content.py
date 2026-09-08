
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ARTICLES_FILE = Path("data/articles.json")
EDITIONS_FILE = Path("data/editions.json")
TZ = ZoneInfo("Europe/Amsterdam")
FEEDS = [
    ("Suriname economie", "Economie", "assets/investeringen.jpg"),
    ("Suriname olie gas economie", "Energie", "assets/olie-gas.jpg"),
    ("Guyana oil economy", "Guyana", "assets/investeringen.jpg"),
    ("French Guiana economy", "Frans-Guyana", "assets/reizen.jpg"),
    ("Brazil economy north logistics", "Brazilië", "assets/investeringen.jpg"),
    ("India economy technology", "India", "assets/it.jpg"),
    ("medical sector Suriname", "Medische Sector", "assets/medisch.jpg"),
    ("artificial intelligence technology business", "IT & Innovatie", "assets/it.jpg"),
    ("Suriname investment projects infrastructure", "Investeringsprojecten", "assets/investeringen.jpg"),
]

def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text or "")).strip()

def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:70]

def fetch_article(query, section, image, today):
    url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(query) + "&hl=nl&gl=NL&ceid=NL:nl"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 FINANCIEEL-DAGBLAD-WINN/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        item = ET.fromstring(response.read()).find("./channel/item")
    if item is None:
        return None
    title = clean(item.findtext("title", ""))
    description = clean(item.findtext("description", ""))
    link = item.findtext("link", "")
    headline, source = title.rsplit(" - ", 1) if " - " in title else (title, "Nieuwsbron")
    if not description:
        description = f"Actuele ontwikkeling binnen {section}. FINANCIEEL DAGBLAD WINN volgt de betekenis voor Suriname en de regio."
    return {"id": f"{today}-{slug(headline)}", "date": today, "section": section, "title": headline.strip(), "subtitle": f"Actueel nieuws · bron: {source}", "image": image, "lead": description[:500], "body": [description[:900], "FINANCIEEL DAGBLAD WINN actualiseert dit onderwerp wanneer betrouwbare informatie beschikbaar komt."], "source": source, "sourceUrl": link}

def dutch_date(now):
    days = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]
    months = ["", "januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"]
    return f"{days[now.weekday()].capitalize()} {now.day} {months[now.month]} {now.year}"

def read_json(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)

def write_json(path, value):
    with path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

def main():
    articles, editions = read_json(ARTICLES_FILE), read_json(EDITIONS_FILE)
    now = datetime.now(TZ)
    today = now.strftime("%Y-%m-%d")
    fresh = []
    for query, section, image in FEEDS:
        try:
            article = fetch_article(query, section, image, today)
            if article:
                fresh.append(article)
        except Exception as exc:
            print("Kon feed niet ophalen:", query, exc)
    if not fresh:
        raise RuntimeError("Geen actuele artikelen opgehaald")
    previous = [edition for edition in editions if edition.get("date") != today]
    numbers = [int(match.group(1)) for edition in previous for match in [re.search(r"(\d+)", edition.get("number", ""))] if match]
    edition = {"date": today, "displayDate": dutch_date(now), "number": f"Editie {max(numbers, default=0) + 1}", "year": "Jaargang 1", "priceEur": "€ 1,00", "priceSrd": "SRD 38,00", "label": "Dagelijkse editie", "summary": "Actueel financieel en economisch nieuws uit Suriname en de regio.", "articleIds": [article["id"] for article in fresh]}
    write_json(ARTICLES_FILE, fresh + [article for article in articles if article.get("date") != today])
    write_json(EDITIONS_FILE, [edition] + previous)
    print("Nieuwe editie:", edition["displayDate"], f"({len(fresh)} artikelen)")

if __name__ == "__main__":
    main()
