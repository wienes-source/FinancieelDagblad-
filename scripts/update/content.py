
import html
import json
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, date
from pathlib import Path
from decimal import Decimal, ROUND_CEILING
from email.utils import parsedate_to_datetime
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
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(text or ""))).strip()

def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:70]

def fetch_article(query, section, image, today):
    # Google News blijft de primaire bron. Bing Nieuws is een reserve bij HTTP 503,
    # netwerkfouten of ongeldig RSS. Publiceer nooit een ongedateerd bericht.
    encoded = urllib.parse.quote(query)
    sources = [
        ("Google Nieuws", f"https://news.google.com/rss/search?q={encoded}&hl=nl&gl=NL&ceid=NL:nl"),
        ("Bing Nieuws", f"https://www.bing.com/news/search?q={encoded}&format=rss"),
    ]
    for provider, url in sources:
        try:
            request = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 FINANCIEEL-DAGBLAD-WINN/1.0",
                "Accept": "application/rss+xml, application/xml, text/xml",
            })
            with urllib.request.urlopen(request, timeout=15) as response:
                items = ET.fromstring(response.read()).findall("./channel/item")
            break
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, ET.ParseError) as exc:
            print(f"::warning::{provider} voor {section} niet bereikbaar: {exc}")
    else:
        return None

    # RSS-relevantie is niet chronologisch: nooit oud nieuws als 'vandaag' presenteren.
    now = datetime.now(TZ)
    recent = []
    for candidate in items:
        try:
            published = parsedate_to_datetime(candidate.findtext("pubDate", ""))
            if published.tzinfo is None:
                continue
            age = (now - published).total_seconds()
            if 0 <= age <= 72 * 3600 and candidate.findtext("link", "").strip():
                recent.append((published, candidate))
        except (TypeError, ValueError, OverflowError):
            continue
    if not recent:
        return None
    published, item = max(recent, key=lambda entry: entry[0])
    title = clean(item.findtext("title", ""))
    description = clean(item.findtext("description", ""))
    link = item.findtext("link", "").strip()
    headline, label = title.rsplit(" - ", 1) if " - " in title else (title, "")
    source = clean(item.findtext("source", "")) or clean(label) or provider
    if not headline.strip():
        return None
    if not description or description.lower().startswith(headline.lower()):
        description = f"Lees het volledige nieuwsbericht bij {source} via de bronlink."
    return {"id": f"{today}-{slug(headline)}", "date": today, "publishedAt": published.isoformat(), "section": section, "title": headline.strip(), "subtitle": f"Actueel nieuws · bron: {source}", "image": image, "lead": description[:500], "body": [description[:900]], "source": source, "sourceUrl": link}

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

def fetch_exchange_rate():
    url = "https://api.frankfurter.dev/v2/rate/eur/srd"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 WINN/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=15) as response:
        rate = json.load(response)
    age = (datetime.now(TZ).date() - date.fromisoformat(rate["date"])).days
    value = Decimal(str(rate["rate"]))
    if rate.get("base") != "EUR" or rate.get("quote") != "SRD" or not value.is_finite() or value <= 0 or not 0 <= age <= 7:
        raise ValueError("Geen recente EUR/SRD-koers")
    return rate

def edition_price(rate):
    amount = (Decimal("4.80") * Decimal(str(rate["rate"]))).to_integral_value(rounding=ROUND_CEILING)
    return f"SRD {amount}"

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
    fresh = list({article["id"]: article for article in fresh}.values())
    if not fresh:
        if not articles or not editions:
            raise RuntimeError("Geen actuele artikelen opgehaald en geen bestaande editie beschikbaar")
        print("::warning::Geen recent nieuws beschikbaar; de bestaande editie en datum blijven ongewijzigd.")
        return False
    try:
        exchange_rate = fetch_exchange_rate()
    except Exception as exc:
        print("Dagkoers niet beschikbaar:", exc)
        exchange_rate = None
    previous = [edition for edition in editions if edition.get("date") != today]
    numbers = [int(match.group(1)) for edition in previous for match in [re.search(r"(\d+)", edition.get("number", ""))] if match]
    edition = {"date": today, "displayDate": dutch_date(now), "number": f"Editie {max(numbers, default=0) + 1}", "year": "Jaargang 1", "priceEur": "€ 4,80", "priceSrd": edition_price(exchange_rate) if exchange_rate else "SRD niet beschikbaar", "exchangeRate": exchange_rate, "label": "Dagelijkse editie", "summary": "Actueel financieel en economisch nieuws uit Suriname en de regio.", "articleIds": [article["id"] for article in fresh]}
    # Alleen de nieuwste editie openbaar; oude artikelen blijven afgeschermd.
    write_json(ARTICLES_FILE, fresh)
    write_json(EDITIONS_FILE, [edition] + previous)
    print("Nieuwe editie:", edition["displayDate"], f"({len(fresh)} artikelen)")
    return True

if __name__ == "__main__":
    main()

