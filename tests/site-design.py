"""Regression checks for the shared visual identity across public pages."""
import json
import re
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

pages = sorted(ROOT.glob('*.html')) + sorted((ROOT / 'blog').glob('*.html'))
pages = [p for p in pages if not p.name.startswith('google')]
for path in pages:
    source = path.read_text()
    tags = Page(source).tags
    assert sum(t == 'h1' for t, _ in tags) == 1, path
    assert any(t == 'body' and 'brand-editorial' in a.get('class', '').split() for t, a in tags), path
    styles = [a['href'] for t, a in tags if t == 'link' and 'brand-editorial.css' in a.get('href', '')]
    assert styles == ['/assets/brand-editorial.css?v=brand-correction-20260923'], path
    components = [a['href'] for t, a in tags if t == 'link' and 'brand-components.css' in a.get('href', '')]
    # Seit dem Redesign (21.10.2026) eine einheitliche Fassung auf allen Seiten
    assert components == ['/assets/brand-components.css?v=20261021c'], path
    assert sum(t == 'footer' and 'office-footer' in a.get('class', '').split() for t, a in tags) == 1, path
    for label in ('Leistungen im Footer', 'Orientierung im Footer', 'Ansprechpartner im Footer'):
        assert any(t == 'nav' and a.get('aria-label') == label for t, a in tags), (path, label)
    footer = re.search(r'<footer[^>]*office-footer[^>]*>.*?</footer>', source, re.S)[0]
    assert 'Gailhoferstraße 17 · 30900 Wedemark' in footer, path
    assert 'href="/ueber-uns.html#qualifikationen"' in footer, path
    assert 'fonts.googleapis.com' not in source, path
    if path.name not in ('datenschutz.html', 'impressum.html'):
        assert sum(t == 'link' and a.get('rel') == 'canonical' for t, a in tags) == 1, path
    else:
        assert any(t == 'meta' and a.get('name') == 'robots' and 'noindex' in a.get('content', '') for t, a in tags), path
    for block in re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', source, re.S):
        json.loads(block)
    if path.name in ('index.html', 'ueber-uns.html', 'impressum.html') and path.parent == ROOT:
        for date in ('2025-07-08', '2025-08-06', '2024-11-08', '08.07.2025', '08.11.2024'):
            assert date not in source, (path, date)
# 53 Seiten (Stand 29.09.) plus vier Ortsratgeber vom 22.10. und sechs vom 25.10.2026
NEW_GUIDES = {'altbauwohnung-bewerten-hannover.html','resthof-bewerten-schwarmstedt.html','fachwerkhaus-bewerten-isernhagen.html','doppelhaushaelfte-reihenhaus-bewerten-grossburgwedel.html'}
assert NEW_GUIDES <= {p.name for p in pages}
GUIDES_20261025 = {'immobilienbewertung-lindwedel-hope.html', 'eigentumswohnung-bewerten-grossburgwedel.html', 'haus-bewerten-langenhagen-flughafen-lage.html', 'baugrundstueck-bewerten-wedemark.html', 'mehrfamilienhaus-bewerten-hannover-ertragswert.html', 'haus-60er-70er-bewerten-altwarmbuechen.html'}
assert GUIDES_20261025 <= {p.name for p in pages}
assert len(pages) == 63, len(pages)
home = (ROOT / 'index.html').read_text()
assert 'class="practice-strip"' not in home
assert 'class="team-quals"' not in home
assert 'Bei wichtigen Entscheidungen sind Sie bei uns keine Nummer.' in home
assert 'ohne Weitergabe an externe Gutachter' in home
assert 'Die Originalnachweise zeigen wir Ihnen auf Anfrage.' not in (ROOT / 'ueber-uns.html').read_text()
assert home.count('class="member-photo"') == 2
assert home.count('src="/assets/nandino-donnarumma-20261022.webp"') == 1  # Studioportraet vom 22.10.2026
assert home.count('src="/assets/vito-donnarumma-20260928.webp"') == 1
hero = re.search(r'<section class="hero[ "].*?</section>', home, re.S)[0]
assert 'src="/assets/hero-team-besprechung-900.webp"' in hero  # gemeinsames Besprechungsfoto als Startbild (seit 25.10.2026)
assert 'office-portrait' not in hero
for font in ('bricolage', 'hanken', 'jetbrains'):
    assert (ROOT / f'assets/{font}-latin.woff2').read_bytes()[:4] == b'wOF2'
    assert (ROOT / f'assets/{font}-OFL.txt').is_file()
print(f'PASS: {len(pages)} pages — shared theme, H1, canonical, JSON-LD, local fonts and private qualification dates')
