"""Werkt data/markets.json dagelijks bij voor de pagina Markten.

- Valuta: USD/SRD en EUR/SRD van de Centrale Bank van Suriname, EUR/USD van de ECB (via Frankfurter, gratis, zonder sleutel).
- Grondstoffen: goud, Brent en WTI via Yahoo Finance, met Stooq als reserve.
- Bauxiet en Surinaamse aandelen: geen gratis bron; die komen uit data/markten-handmatig.json.

Lukt een bron niet, dan blijft de vorige waarde staan met de datum waarop die gold.
"""
import csv
import io
import json
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

OUT = Path("data/markets.json")
MANUAL = Path("data/markten-handmatig.json")
TZ = ZoneInfo("America/Paramaribo")
UA = {"User-Agent": "Mozilla/5.0 WINN/1.0", "Accept": "application/json,text/csv,*/*"}

FX = [  # naam, provider, basis, valuta
    ("USD/SRD", "cbvs", "usd", "srd"),
    ("EUR/SRD", "cbvs", "eur", "srd"),
    ("EUR/USD", "ecb", "eur", "usd"),
]
COMMODITIES = [  # naam, Yahoo-symbool, Stooq-symbool, decimalen
    ("Goud (USD/oz)", "GC=F", "gc.f", 0),
    ("Olie Brent (USD/vat)", "BZ=F", "cb.f", 2),
    ("Olie WTI (USD/vat)", "CL=F", "cl.f", 2),
]


def get(url, timeout=20):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read().decode("utf-8")


def nl(value, decimals):
    s = f"{value:,.{decimals}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def pct(new, old):
    if not old:
        return "–"
    change = (new - old) / old * 100
    return ("+" if change > 0 else "") + nl(change, 1) + "%"


def diff(new, old, decimals):
    change = new - old
    return ("+" if change > 0 else "") + nl(change, decimals)


def week_ago(series):
    """series: lijst (datum, waarde) oplopend. Geeft de waarde van ~7 dagen eerder."""
    last_day = series[-1][0]
    earlier = [v for d, v in series if d <= last_day - timedelta(days=7)]
    return earlier[-1] if earlier else series[0][1]


def fx_series(provider, base, quote):
    start = (date.today() - timedelta(days=21)).isoformat()
    data = json.loads(get(f"https://api.frankfurter.dev/v2/providers/{provider}/rates?from={start}&base={base}&quotes={quote}"))
    rows = data if isinstance(data, list) else data.get("rates", data.get("data", []))
    series = sorted((date.fromisoformat(r["date"]), float(r["rate"])) for r in rows
                    if str(r.get("quote", quote)).lower() == quote and r.get("rate"))
    if not series:
        raise ValueError("geen koersen")
    return series


def yahoo(symbol):
    data = json.loads(get(f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1mo&interval=1d"))
    result = data["chart"]["result"][0]
    closes = result["indicators"]["quote"][0]["close"]
    return [(datetime.fromtimestamp(t, TZ).date(), float(c)) for t, c in zip(result["timestamp"], closes) if c]


def stooq(symbol):
    rows = list(csv.DictReader(io.StringIO(get(f"https://stooq.com/q/d/l/?s={symbol}&i=d"))))
    return [(date.fromisoformat(r["Date"]), float(r["Close"])) for r in rows[-30:] if r.get("Close") not in (None, "", "N/D")]


def previous(section, name):
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
        return next((row for row in old.get(section, []) if row["name"] == name), None)
    except Exception:
        return None


def main():
    today = datetime.now(TZ).date()
    fx, commodities, problems = [], [], []

    for name, provider, base, quote in FX:
        try:
            s = fx_series(provider, base, quote)
            last = s[-1][1]
            prev = s[-2][1] if len(s) > 1 else last
            dec = 4 if quote == "usd" else 2
            fx.append({"name": name, "value": nl(last, dec), "day": diff(last, prev, dec),
                       "week": pct(last, week_ago(s)), "date": s[-1][0].isoformat(),
                       "source": "CBvS" if provider == "cbvs" else "ECB"})
        except Exception as exc:
            problems.append(f"{name}: {exc}")
            if (old := previous("fx", name)):
                fx.append(old)

    for name, ysym, ssym, dec in COMMODITIES:
        series, source = None, None
        for fetch, sym, label in ((yahoo, ysym, "Yahoo Finance"), (stooq, ssym, "Stooq")):
            try:
                series = fetch(sym)
                if len(series) >= 2:
                    source = label
                    break
            except Exception as exc:
                problems.append(f"{name} via {label}: {exc}")
        if source:
            last = series[-1][1]
            commodities.append({"name": name, "value": nl(last, dec), "trend": pct(last, week_ago(series)),
                                "date": series[-1][0].isoformat(), "source": source})
        elif (old := previous("commodities", name)):
            commodities.append(old)

    manual = json.loads(MANUAL.read_text(encoding="utf-8")) if MANUAL.exists() else {}
    commodities += manual.get("commodities", [])
    stocks = manual.get("stocks", [])

    label = f"Bijgewerkt op {today.day} {['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'][today.month-1]} {today.year}."
    if problems and (fx or commodities):
        label += " Niet alle bronnen waren vandaag bereikbaar; sommige koersen zijn van een eerdere dag."
    if manual.get("date"):
        label += f" Bauxiet en aandelen zijn handmatig ingevoerd op {manual['date']}."
    OUT.write_text(json.dumps({"updated": today.isoformat(), "label": label, "fx": fx,
                               "commodities": commodities, "stocks": stocks}, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(label, f"({len(fx)} valuta, {len(commodities)} grondstoffen, {len(stocks)} aandelen)")
    for p in problems:
        print("Let op:", p)
    if not fx and not commodities:
        raise SystemExit("Geen enkele marktbron bereikbaar")


if __name__ == "__main__":
    main()
