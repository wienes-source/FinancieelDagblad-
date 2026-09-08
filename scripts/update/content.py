import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CONTENT_FILE = Path("content.json")
TZ = ZoneInfo("Europe/Amsterdam")

FEEDS = [
    {
        "query": "Suriname economie",
        "section": "Economie",
        "category": "economie",
        "image": "assets/investeringen.jpg",
    },
    {
        "query": "Suriname olie gas economie",
        "section": "Energie",
        "category": "economie",
        "image": "assets/olie-gas.jpg",
    },
    {
        "query": "Guyana oil economy",
        "section": "Guyana",
        "category": "regio",
        "image": "assets/investeringen.jpg",
    },
    {
        "query": "French Guiana economy",
        "section": "Frans-Guyana",
        "category": "regio",
        "image": "assets/reizen.jpg",
    },
    {
        "query": "French Guiana renewable energy",
        "section": "Frans-Guyana",
        "category": "regio",
        "image": "assets/zonnepanelen.jpg",
    },
    {
        "query": "Brazil economy north logistics",
        "section": "Brazilië",
        "category": "regio",
        "image": "assets/investeringen.jpg",
    },
    {
        "query": "India economy technology",
        "section": "India",
        "category": "regio",
        "image": "assets/it.jpg",
    },
    {
        "query": "artificial intelligence technology business",
        "section": "IT & Innovatie",
        "category": "sectoren",
        "image": "assets/it.jpg",
    },
]


def clean_html(text):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:70]


def google_news_rss(query):
    encoded = urllib.parse.quote(query)
    return (
        "https://news.google.com/rss/search?"
        f"q={encoded}&hl=nl&gl=NL&ceid=NL:nl"
    )


def fetch_article(feed):
    url = google_news_rss(feed["query"])

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 FINANCIEEL-DAGBLAD-WINN/1.0"
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)
    item = root.find("./channel/item")

    if item is None:
        return None

    title = clean_html(item.findtext("title", ""))
    description = clean_html(item.findtext("description", ""))
    link = item.findtext("link", "")

    if " - " in title:
        headline, source = title.rsplit(" - ", 1)
    else:
        headline = title
        source = "Nieuwsbron"

    headline = headline.strip()

    if not description:
        description = (
            f"Actuele ontwikkeling binnen {feed['section']}. "
            "FINANCIEEL DAGBLAD WINN volgt de economische betekenis "
            "en mogelijke gevolgen voor Suriname en de regio."
        )

    today = datetime.now(TZ).strftime("%Y-%m-%d")

    article_id = f"{today}-{slugify(headline)}"

    return {
        "id": article_id,
        "date": today,
        "section": feed["section"],
        "category": feed["category"],
        "title": headline,
        "subtitle": f"Actueel nieuws · bron: {source}",
        "image": feed["image"],
        "lead": description[:500],
        "body": [
            description[:900],
            (
                "FINANCIEEL DAGBLAD WINN volgt deze ontwikkeling "
                "en actualiseert de berichtgeving wanneer nieuwe "
                "betrouwbare informatie beschikbaar komt."
            ),
        ],
        "source": source,
        "sourceUrl": link,
        "featured": feed["section"] in ["Economie", "Energie"],
    }


def dutch_date(dt):
    weekdays = [
        "maandag",
        "dinsdag",
        "woensdag",
        "donderdag",
        "vrijdag",
        "zaterdag",
        "zondag",
    ]

    months = [
        "",
        "januari",
        "februari",
        "maart",
        "april",
        "mei",
        "juni",
        "juli",
        "augustus",
        "september",
        "oktober",
        "november",
        "december",
    ]

    return (
        f"{weekdays[dt.weekday()].capitalize()} "
        f"{dt.day} {months[dt.month]} {dt.year}"
    )


def main():
    if not CONTENT_FILE.exists():
        raise FileNotFoundError("content.json niet gevonden")

    with CONTENT_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    now = datetime.now(TZ)
    date_string = now.strftime("%Y-%m-%d")

    new_articles = []

    for feed in FEEDS:
        try:
            article = fetch_article(feed)
            if article:
                new_articles.append(article)
                print("Opgehaald:", article["title"])
        except Exception as exc:
            print("Kon feed niet ophalen:", feed["query"], exc)

    if not new_articles:
        raise RuntimeError("Geen actuele artikelen opgehaald")

    previous_editions = data.get("editions", [])

    if previous_editions:
        previous_number = previous_editions[0].get("number", "Editie 248")
        match = re.search(r"(\d+)", previous_number)
        edition_number = int(match.group(1)) + 1 if match else 249
    else:
        edition_number = 1

    new_edition = {
        "date": date_string,
        "displayDate": dutch_date(now),
        "number": f"Editie {edition_number}",
        "year": "Jaargang 1",
        "priceEur": "€ 1,00",
        "priceSrd": "SRD 38,00",
        "label": "Dagelijkse editie",
        "summary": (
            "Actueel financieel en economisch nieuws uit Suriname, "
            "Guyana, Frans-Guyana, Brazilië, India en de technologiesector."
        ),
        "articleIds": [a["id"] for a in new_articles],
    }

    # Voorkom dubbele editie als workflow dezelfde dag opnieuw draait.
    previous_editions = [
        e for e in previous_editions if e.get("date") != date_string
    ]

    data["editions"] = [new_edition] + previous_editions

    existing_articles = [
        a
        for a in data.get("articles", [])
        if a.get("date") != date_string
    ]

    data["articles"] = new_articles + existing_articles

    data["settings"]["currencyNotice"] = (
        "Nieuws wordt dagelijks automatisch bijgewerkt. "
        "Marktkoersen worden in een volgende stap gekoppeld aan actuele databronnen."
    )

    with CONTENT_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print("Nieuwe editie aangemaakt:")
    print(new_edition["displayDate"])
    print(new_edition["number"])
    print(f"{len(new_articles)} artikelen")


if __name__ == "__main__":
    main()
