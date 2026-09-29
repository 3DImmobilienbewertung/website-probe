"""Regression coverage for regional landing pages and guide-to-enquiry links."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

home = (ROOT / 'index.html').read_text()
sitemap = (ROOT / 'sitemap.xml').read_text()
local_sections = []
for city, name in [('celle', 'Celle'), ('schwarmstedt', 'Schwarmstedt'), ('laatzen', 'Laatzen')]:
    path = f'immobilienbewertung-{city}.html'
    source = (ROOT / path).read_text()
    tags = Page(source).tags
    assert sum(t == 'h1' for t, _ in tags) == 1
    assert any(t == 'form' and a.get('id') == 'leadForm' and a.get('data-region') == name for t, a in tags)
    assert all(any(a.get('id') == field for _, a in tags) for field in ['lfName', 'lfMail', 'lfTel', 'lfObj', 'lfOrt', 'lfMsg', 'formError', 'formSuccess', 'submitBtn'])
    assert source.count('/assets/local-contact.js?') == 1
    assert 'Kurzgutachten ab 490 €' in source and 'Erstgespräch kostenlos' in source
    assert 'keine zusätzliche Niederlassung' in source
    assert '31 Google-Bewertungen' in source
    assert f'href="/{path}"' in home and f'/{path}</loc>' in sitemap
    assert source.count('<details>') == 4
    schemas = [json.loads(block) for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)]
    assert schemas
    local_sections.append(re.search(r'<section class="block alt" id="lokale-bewertung">(.*?)</section>', source, re.S)[1])
assert len(set(local_sections)) == 3

bridges = []
for path in (ROOT / 'blog').glob('*.html'):
    source = path.read_text()
    if 'regional-bridge-actions' not in source:
        continue
    bridge = re.search(r'<div class="regional-bridge-actions">(.*?)</div>', source, re.S)[1]
    target = re.search(r'href="([^"]+)"', bridge)[1]
    assert (ROOT / target.lstrip('/')).is_file()
    assert source.index('regional-bridge-actions') < source.index('<h2')
    assert 'noindex' not in source
    bridges.append(path.name)
assert len(bridges) == 8
print('PASS: 3 distinct regional landing pages, existing contact contract, real office, costs, sitemap, 8 early guide-to-service links')
