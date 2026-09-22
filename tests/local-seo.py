"""Regression checks for the Isernhagen / Großburgwedel content cluster.

Run from any directory: python3 tests/local-seo.py
Uses only the Python standard library; sends no requests or contact forms.
"""
import json
from datetime import date
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.3dimmobilienbewertung.de'
PAGES = ['index.html', 'blog/index.html',
         'immobilienbewertung-isernhagen.html', 'immobilienbewertung-burgwedel.html',
         'blog/haus-bewerten-isernhagen.html', 'blog/bodenrichtwert-grossburgwedel-2026.html',
         'blog/wohnung-bewerten-isernhagen-altwarmbuechen.html',
         'blog/haus-verkaufen-grossburgwedel-angebotspreis.html',
         'checkliste-immobilienbewertung.html']


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.schemas = []
        self._json = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self._json = ''

    def handle_data(self, data):
        if self._json is not None:
            self._json += data

    def handle_endtag(self, tag):
        if tag == 'script' and self._json is not None:
            self.schemas.append(json.loads(self._json))
            self._json = None

    def find(self, tag):
        return [attrs for name, attrs in self.tags if name == tag]


def url_for(filename):
    if filename == 'index.html':
        return ORIGIN + '/'
    return ORIGIN + '/' + filename.replace('/index.html', '/')


cache = {}


def parse(filename):
    if filename not in cache:
        cache[filename] = Page((ROOT / filename).read_text())
    return cache[filename]


sitemap = ET.parse(ROOT / 'sitemap.xml')
namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
entries = {node.findtext('s:loc', namespaces=namespace):
           node.findtext('s:lastmod', namespaces=namespace)
           for node in sitemap.findall('s:url', namespace)}
assert len(entries) == len(sitemap.findall('s:url', namespace)), 'Duplicate sitemap URL'

for filename in PAGES:
    page = parse(filename)
    url = url_for(filename)
    assert len(page.find('h1')) == 1, (filename, 'H1 count')
    canonical = [a['href'] for a in page.find('link') if a.get('rel') == 'canonical']
    assert canonical == [url], (filename, 'canonical', canonical)
    robots = [a.get('content', '') for a in page.find('meta') if a.get('name') == 'robots']
    assert robots and all('noindex' not in r and 'nofollow' not in r for r in robots)
    assert entries.get(url), (filename, 'missing sitemap entry')
    assert date(2026, 9, 21) <= date.fromisoformat(entries[url]) <= date.today(), (filename, 'sitemap lastmod')
    descriptions = [a.get('content', '') for a in page.find('meta') if a.get('name') == 'description']
    assert len(descriptions) == 1 and 80 <= len(descriptions[0]) <= 170, (filename, 'description')
    for schema in page.schemas:
        for entity in schema.get('@graph', [schema]):
            if 'dateModified' in entity:
                assert entity['dateModified'] == entries[url], (filename, 'schema/sitemap date mismatch')
            if entity.get('@type') == 'BlogPosting':
                assert entity['datePublished'] <= entity['dateModified'], (filename, 'article dates')
    assert page.schemas, (filename, 'missing schema')
    ids = [a['id'] for _, a in page.tags if 'id' in a]
    assert not [i for i, n in Counter(ids).items() if n > 1], (filename, 'duplicate ID')
    for tag, attrs in page.tags:
        target = attrs.get('href') if tag in ('a', 'link') else attrs.get('src')
        if not target:
            continue
        resolved = urlparse(urljoin(url, target))
        if resolved.scheme not in ('http', 'https') or resolved.netloc != urlparse(ORIGIN).netloc:
            continue
        local = unquote(resolved.path).lstrip('/') or 'index.html'
        if local.endswith('/'):
            local += 'index.html'
        assert (ROOT / local).is_file(), (filename, 'missing target', target)
        if resolved.fragment and local.endswith('.html'):
            target_ids = {a.get('id') for _, a in parse(local).tags}
            assert unquote(resolved.fragment) in target_ids, (filename, 'missing anchor', target)
    for image in page.find('img'):
        assert 'alt' in image, (filename, 'image without alt')
    if filename.startswith('immobilienbewertung-'):
        source = (ROOT / filename).read_text()
        assert not any(term in source for term in ['Eltze', 'Mühlenfeld', 'gerichtsfest'])
        assert '.r{opacity:1;transform:none}' in source
        assert 'local-contact.js?v=20260921' in source
        assert 'document.getElementById(\'leadForm\').addEventListener' not in source
        assert any(a.get('id') == 'formError' and a.get('role') == 'alert' for _, a in page.tags)
        assert any(a.get('id') == 'formSuccess' and 'hidden' in a for _, a in page.tags)
        labels = {a.get('for') for a in page.find('label')}
        assert {'lfName', 'lfTel', 'lfMail', 'lfObj', 'lfOrt', 'lfMsg'} <= labels
        graph = page.schemas[0]['@graph']
        questions = next(x for x in graph if x['@type'] == 'FAQPage')['mainEntity']
        for question in questions:
            assert '<summary>' + question['name'] + '</summary>' in source
            assert '<p>' + question['acceptedAnswer']['text'] + '</p>' in source
    print('PASS', filename)

for article, city in [('blog/haus-bewerten-isernhagen.html', 'isernhagen'),
                      ('blog/bodenrichtwert-grossburgwedel-2026.html', 'burgwedel'),
                      ('blog/wohnung-bewerten-isernhagen-altwarmbuechen.html', 'isernhagen'),
                      ('blog/haus-verkaufen-grossburgwedel-angebotspreis.html', 'burgwedel')]:
    for parent in ['index.html', 'blog/index.html', 'immobilienbewertung-' + city + '.html']:
        destinations = [urljoin(url_for(parent), a.get('href', '')) for a in parse(parent).find('a')]
        assert url_for(article) in destinations, (article, 'missing incoming link', parent)
print('PASS sitemap, links/assets/anchors, schema JSON, FAQ parity, labels, local content and incoming links')

checklist = parse('checkliste-immobilienbewertung.html')
checkboxes = [a for a in checklist.find('input') if a.get('type') == 'checkbox']
assert len(checkboxes) == 17, 'Checklist items unexpectedly changed'
labels = {a.get('for') for a in checklist.find('label')}
assert all(a['id'] in labels for a in checkboxes), 'Unlabelled checkbox'
for parent in PAGES:
    if parent == 'checkliste-immobilienbewertung.html':
        continue
    assert any(urljoin(url_for(parent), a.get('href', '')) == url_for('checkliste-immobilienbewertung.html')
               for a in parse(parent).find('a')), (parent, 'missing checklist link')
print('PASS checklist labels, 17 items, incoming links, metadata and sitemap dates')
