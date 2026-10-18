"""Maakt per artikel en per column een kleine deelpagina in deel/,
met titel, beschrijving en afbeelding voor WhatsApp, LinkedIn en Facebook.
De bezoeker wordt direct doorgestuurd naar de echte pagina."""
import html
import json
import os
import urllib.parse
from pathlib import Path

SITE = (os.environ.get("SITE_URL") or "https://wienes-source.github.io/FinancieelDagblad-").rstrip("/")
OUT = Path("deel")
NAAM = "FINANCIEEL DAGBLAD WINN"


def clean(text):
    return html.escape(str(text or "").replace("&nbsp;", " ").strip(), quote=True)


def page(key, title, description, image, target):
    url = f"{SITE}/{target}"
    img = f"{SITE}/{image or 'assets/favicon.png'}"
    return f"""<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<title>{clean(title)} | {NAAM}</title>
<meta name="description" content="{clean(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{NAAM}">
<meta property="og:title" content="{clean(title)}">
<meta property="og:description" content="{clean(description)}">
<meta property="og:image" content="{clean(img)}">
<meta property="og:url" content="{clean(f'{SITE}/deel/{key}.html')}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{clean(url)}">
<meta http-equiv="refresh" content="0; url={clean('../' + target)}">
</head><body><p><a href="{clean('../' + target)}">{clean(title)}</a></p></body></html>
"""


def main():
    OUT.mkdir(exist_ok=True)
    editions = json.loads(Path("data/editions.json").read_text(encoding="utf-8"))
    articles = {a["id"]: a for a in json.loads(Path("data/articles.json").read_text(encoding="utf-8"))}
    latest = max(editions, key=lambda e: e["date"])
    made = 0
    for article_id in latest.get("articleIds", []):
        a = articles.get(article_id)
        if not a:
            continue
        (OUT / f"{a['id']}.html").write_text(page(a["id"], a.get("title"), a.get("lead") or a.get("subtitle"),
                                                  a.get("image"), f"artikel.html?id={urllib.parse.quote(a['id'])}"),
                                             encoding="utf-8")
        made += 1
    columns_file = Path("data/columns.json")
    if columns_file.exists():
        for c in json.loads(columns_file.read_text(encoding="utf-8")):
            if c.get("gepubliceerd"):
                key = f"column-{c['slug']}"
                (OUT / f"{key}.html").write_text(page(key, c["titel"], c.get("inleiding"), c.get("afbeelding"),
                                                      f"column.html?slug={urllib.parse.quote(c['slug'])}"),
                                                 encoding="utf-8")
                made += 1
    print(f"{made} deelpagina's gemaakt.")


if __name__ == "__main__":
    main()
