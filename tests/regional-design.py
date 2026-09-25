"""Offline regression checks for the regional design rollout. No external requests."""
import json
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CITIES = ["immobilienbewertung-wedemark.html","immobilienbewertung-langenhagen.html","immobilienbewertung-isernhagen.html","immobilienbewertung-burgwedel.html","immobilienbewertung-garbsen.html","immobilienbewertung-seelze.html","immobilienbewertung-wunstorf.html","immobilienbewertung-neustadt-am-ruebenberge.html","immobilienbewertung-burgdorf.html","immobilienbewertung-uetze.html","immobilienbewertung-lehrte.html","immobilienbewertung-sehnde.html","immobilienbewertung-hemmingen.html","immobilienbewertung-pattensen.html","immobilienbewertung-ronnenberg.html","immobilienbewertung-gehrden.html","immobilienbewertung-barsinghausen.html","immobilienbewertung-wennigsen.html"]
ORIGIN = 'https://www.3dimmobilienbewertung.de'

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags, self.schemas = [], []
        self.schema = None
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append((tag, a))
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.schema = ''
    def handle_data(self, data):
        if self.schema is not None:
            self.schema += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema))
            self.schema = None

home = (ROOT / 'index.html').read_text()
assert 'three.min.js' not in home
assert '<canvas id="scene"' not in home
assert '<div class="mobile-cta-bar"' not in home
assert 'class="portrait-pair"' in home
assert 'class="region-directory"' in home
assert 'aria-controls="mobileMenu" aria-expanded="false"' in home
ns = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
entries = {u.findtext('s:loc', namespaces=ns):u.findtext('s:lastmod', namespaces=ns)
           for u in ET.parse(ROOT/'sitemap.xml').findall('s:url',ns)}
for filename in ['index.html'] + CITIES:
    source = (ROOT/filename).read_text()
    page = Page(source)
    assert sum(t == 'h1' for t,a in page.tags) == 1, filename
    assert page.schemas, filename
    assert any(t == 'body' and 'brand-editorial' in a.get('class','') for t,a in page.tags), filename
    assert any(t == 'link' and a.get('href','').startswith('/assets/brand-editorial.css?') for t,a in page.tags), filename
    assert not any(t == 'link' and 'fonts.googleapis.com' in a.get('href','') for t,a in page.tags), filename
    expected = ORIGIN + ('/' if filename == 'index.html' else '/' + filename)
    assert [a['href'] for t,a in page.tags if t=='link' and a.get('rel')=='canonical'] == [expected], filename
    assert any(t=='meta' and a.get('name')=='robots' and 'noindex' not in a.get('content','') for t,a in page.tags), filename
    # Subsequent content updates may legitimately advance lastmod.
    lastmod = entries.get(expected)
    assert lastmod and len(lastmod) == 10, (filename, 'missing/invalid lastmod')
    assert date(2026, 9, 22) <= date.fromisoformat(lastmod) <= date.today(), (filename, 'stale/future lastmod')
    for t,a in page.tags:
        if t in ('img','script') and a.get('src','').startswith('/assets/'):
            assert (ROOT / urlparse(a['src']).path.lstrip('/')).is_file(), (filename,a)
    if filename in CITIES:
        assert 'class="region-people"' in source, filename
        assert 'href="/#region"' in source, filename
        assert 'href="/checkliste-immobilienbewertung.html"' in source, filename
        assert ('href="/'+filename+'"') in home, filename
    print('PASS',filename)
print('PASS 19 pages: identity, canonical, robots, schema, sitemap, portraits and regional links')
