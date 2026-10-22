"""Sitemap-lastmod und schema dateModified abgleichen.

Seiten, die gegenueber HEAD geaendert sind, bekommen das heutige Datum in
der Sitemap. Danach wird dateModified aller Nicht-Artikel-Entitaeten auf das
lastmod der Sitemap gesetzt (tests/local-seo.py verlangt Gleichheit).
Aufruf: python3 scripts/sync-lastmod.py [JJJJ-MM-TT]
"""
import json, re, subprocess, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.3dimmobilienbewertung.de/'
heute = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()

geaendert = set(subprocess.run(['git', 'diff', '--name-only', 'HEAD'], cwd=ROOT,
                               capture_output=True, text=True).stdout.split())
sitemap = (ROOT / 'sitemap.xml').read_text()

def url_zu_datei(url):
    pfad = url[len(ORIGIN):] or 'index.html'
    return pfad + 'index.html' if pfad.endswith('/') else pfad

def block(m):
    b = m.group(0)
    url = re.search(r'<loc>(.*?)</loc>', b).group(1)
    if url_zu_datei(url) in geaendert:
        b = re.sub(r'<lastmod>[^<]*</lastmod>', f'<lastmod>{heute}</lastmod>', b)
    return b

sitemap = re.sub(r'<url>.*?</url>', block, sitemap, flags=re.S)
(ROOT / 'sitemap.xml').write_text(sitemap)
lastmod = {url_zu_datei(re.search(r'<loc>(.*?)</loc>', b).group(1)): re.search(r'<lastmod>(.*?)</lastmod>', b).group(1)
           for b in re.findall(r'<url>.*?</url>', sitemap, re.S)}

angepasst = 0
for datei, datum in lastmod.items():
    p = ROOT / datei
    text = p.read_text()
    def schema(m):
        global angepasst
        roh = m.group(2)
        daten = json.loads(roh)
        def gehen(knoten):
            global angepasst
            if isinstance(knoten, dict):
                if 'dateModified' in knoten and knoten.get('@type') != 'BlogPosting' and knoten['dateModified'] != datum:
                    neu_roh = None
                    knoten['dateModified'] = datum
                    angepasst += 1
                for v in knoten.values(): gehen(v)
            elif isinstance(knoten, list):
                for v in knoten: gehen(v)
        vorher = angepasst
        gehen(daten)
        if angepasst == vorher:
            return m.group(0)
        # Nur das Datum im Rohtext ersetzen, Formatierung beibehalten
        neu = re.sub(r'("dateModified"\s*:\s*")(\d{4}-\d{2}-\d{2})(")',
                     lambda x: x.group(1) + datum + x.group(3)
                     if x.group(2) != datum else x.group(0), roh)
        # BlogPosting-Daten nicht anfassen
        if '"BlogPosting"' in roh:
            return m.group(0)
        return m.group(1) + neu + m.group(3)
    neu_text = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', schema, text, flags=re.S)
    if neu_text != text:
        p.write_text(neu_text)
print(f'{len(geaendert & set(lastmod))} Seiten auf {heute}, {angepasst} dateModified-Werte abgeglichen')
