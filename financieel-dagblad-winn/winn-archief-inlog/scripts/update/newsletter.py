"""Dagelijkse taken met lezersgegevens (draait in de GitHub Action):
1. Ochtendmail met de koppen van de nieuwe editie naar lezers met een lopende proef of abonnement.
2. Overzicht van openstaande abonnementsaanvragen naar de beheerder.
3. Accounts verwijderen die al 12 maanden geen proef of abonnement meer hebben.

Secrets: SUPABASE_URL, SUPABASE_SERVICE_KEY, BREVO_API_KEY, NIEUWSBRIEF_AFZENDER, BEHEERDER_EMAIL.
Optioneel: SITE_URL (standaard het GitHub Pages-adres).
Zonder Brevo-sleutel wordt er niets verstuurd; het opschonen gebeurt dan wel.
"""
import html
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

SB = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BREVO = os.environ.get("BREVO_API_KEY", "")
AFZENDER = os.environ.get("NIEUWSBRIEF_AFZENDER", "")
BEHEERDER = os.environ.get("BEHEERDER_EMAIL", "")
SITE = (os.environ.get("SITE_URL") or "https://wienes-source.github.io/FinancieelDagblad-").rstrip("/")
VERSTUURD = Path("data/nieuwsbrief-verstuurd.txt")
NAAM = "FINANCIEEL DAGBLAD WINN"


def call(method, url, body=None, headers=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode("utf-8")
        return json.loads(raw) if raw else None


def sb(method, path, body=None):
    return call(method, f"{SB}{path}", body, {"apikey": KEY, "Authorization": f"Bearer {KEY}",
                                               "Content-Type": "application/json"})


def mail(to, subject, html_body):
    call("POST", "https://api.brevo.com/v3/smtp/email",
         {"sender": {"email": AFZENDER, "name": NAAM}, "to": [{"email": to}],
          "subject": subject, "htmlContent": html_body},
         {"api-key": BREVO, "Content-Type": "application/json", "Accept": "application/json"})


def e(text):
    return html.escape(str(text or "").replace("&nbsp;", " "))


def ochtendmail(edition, articles, token):
    rows = "".join(
        f'<tr><td style="padding:12px 0;border-bottom:1px solid #d8dcd4">'
        f'<div style="font:bold 11px Arial;color:#075c46">{e(a.get("section", "")).upper()}</div>'
        f'<a href="{SITE}/artikel.html?id={urllib.parse.quote(a["id"])}" style="font:bold 18px Georgia,serif;color:#0d1720;text-decoration:none">{e(a["title"])}</a>'
        f'</td></tr>' for a in articles)
    afmelden = f"{SITE}/afmelden.html?t={token}"
    return f'''<div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#0d1720">
<h1 style="font-size:26px;margin:0;border-bottom:4px solid #075c46;padding-bottom:8px">FINANCIEEL DAGBLAD <span style="color:#9b7a19">WINN</span></h1>
<p style="font:14px Arial;color:#5e6872">{e(edition["displayDate"])}, {e(edition.get("number", ""))}</p>
<table style="width:100%;border-collapse:collapse">{rows}</table>
<p style="margin:20px 0"><a href="{SITE}/editie.html?date={edition["date"]}" style="background:#075c46;color:#fff;padding:10px 16px;text-decoration:none;font:bold 14px Arial;border-radius:4px">Lees de hele editie</a></p>
<p style="font:12px Arial;color:#5e6872">Je ontvangt deze e-mail omdat je een proef of abonnement hebt bij {NAAM}. <a href="{afmelden}" style="color:#5e6872">Afmelden voor deze e-mail</a>.</p></div>'''


def main():
    if not SB or not KEY:
        print("Supabase-secrets ontbreken; niets te doen.")
        return
    now = datetime.now(timezone.utc)
    iso = urllib.parse.quote(now.isoformat())

    # 1. Ochtendmail
    editions = json.loads(Path("data/editions.json").read_text(encoding="utf-8"))
    edition = max(editions, key=lambda x: x["date"])
    if not BREVO or not AFZENDER:
        print("Brevo-sleutel of afzender ontbreekt; geen e-mail verstuurd.")
    elif VERSTUURD.exists() and VERSTUURD.read_text().strip() == edition["date"]:
        print("Ochtendmail voor", edition["date"], "is al verstuurd.")
    else:
        by_id = {a["id"]: a for a in json.loads(Path("data/articles.json").read_text(encoding="utf-8"))}
        articles = [by_id[i] for i in edition.get("articleIds", []) if i in by_id]
        lezers = sb("GET", "/rest/v1/profielen?select=email,afmeld_token&nieuwsbrief=eq.true&is_demo=eq.false"
                           f"&or=(proef_tot.gt.{iso},abonnement_tot.gt.{iso})") or []
        verstuurd = 0
        for lezer in lezers:
            try:
                mail(lezer["email"], f"{NAAM}: editie van {edition['displayDate']}",
                     ochtendmail(edition, articles, lezer["afmeld_token"]))
                verstuurd += 1
            except Exception as exc:
                print("Niet verstuurd naar een lezer:", exc)
        VERSTUURD.write_text(edition["date"] + "\n")
        print(f"Ochtendmail verstuurd naar {verstuurd} van {len(lezers)} lezers.")

    # 2. Openstaande aanvragen naar de beheerder
    if BREVO and AFZENDER and BEHEERDER:
        open_ = sb("GET", "/rest/v1/abonnement_aanvragen?select=email,pakket,betaalwijze,kenmerk,opmerking,aangemaakt"
                          "&afgehandeld=eq.false&order=aangemaakt") or []
        if open_:
            rows = "".join(f"<tr><td>{e(a['aangemaakt'][:10])}</td><td>{e(a['email'])}</td><td>{e(a['pakket'])}</td>"
                           f"<td>{e(a['betaalwijze'])}</td><td><b>{e(a['kenmerk'])}</b></td><td>{e(a['opmerking'])}</td></tr>"
                           for a in open_)
            mail(BEHEERDER, f"{len(open_)} openstaande abonnementsaanvraag/-aanvragen",
                 f'<p>Openstaande aanvragen. Activeer na ontvangst van betaling in Supabase (zie LEESMIJ).</p>'
                 f'<table border="1" cellpadding="6" style="border-collapse:collapse;font:13px Arial">'
                 f'<tr><th>Datum</th><th>E-mail</th><th>Pakket</th><th>Betaalwijze</th><th>Kenmerk</th><th>Opmerking</th></tr>{rows}</table>')
            print(f"Overzicht van {len(open_)} aanvragen naar beheerder gestuurd.")

    # 3. Opschonen na 12 maanden zonder toegang
    grens = urllib.parse.quote((now - timedelta(days=365)).isoformat())
    oud = sb("GET", f"/rest/v1/profielen?select=id&is_demo=eq.false&proef_tot=lt.{grens}"
                    f"&or=(abonnement_tot.is.null,abonnement_tot.lt.{grens})") or []
    for p in oud:
        try:
            sb("DELETE", f"/auth/v1/admin/users/{p['id']}")
        except Exception as exc:
            print("Account niet verwijderd:", exc)
    if oud:
        print(f"{len(oud)} verlopen account(s) verwijderd.")


if __name__ == "__main__":
    main()
