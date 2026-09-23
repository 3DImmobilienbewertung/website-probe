"""Site-wide static SEO/link regression checks; no external requests."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, urljoin
from collections import Counter
import json, re, html
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.3dimmobilienbewertung.de'
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.tags = []; self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

files = [p for p in list(ROOT.glob('*.html')) + list((ROOT/'blog').glob('*.html')) if 'brand-editorial' in p.read_text()]
sources = {p: p.read_text() for p in files}
parsed = {p: Page(s) for p, s in sources.items()}
urls = []
titles = []
incoming = Counter()
links = 0
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap = [n.text for n in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc', ns)]
assert len(sitemap) == len(set(sitemap)), 'Duplicate sitemap URLs'
for path, page in parsed.items():
    source = sources[path]
    canonical = [a['href'] for t,a in page.tags if t == 'link' and a.get('rel') == 'canonical']
    meta = {a.get('name', a.get('property')): a.get('content', '') for t,a in page.tags if t == 'meta'}
    ids = [a['id'] for _,a in page.tags if 'id' in a]
    assert len(ids) == len(set(ids)), (path, 'duplicate ids')
    title = re.search(r'<title>(.*?)</title>', source, re.S)[1]
    titles.append(title)
    assert meta.get('description'), path
    url = ORIGIN + '/' + str(path.relative_to(ROOT)).replace('index.html', '')
    if 'noindex' not in meta.get('robots', ''):
        assert canonical == [url], (path, 'canonical', canonical)
        assert meta.get('og:url') == url, (path, 'OG URL')
        assert url in sitemap, (path, 'missing sitemap URL')
        urls.append(url)
    else:
        assert url not in sitemap, (path, 'noindex in sitemap')
    normalize = lambda text: re.sub(r'\W', '', html.unescape(re.sub('<[^>]+>', '', text))).lower()
    visible = normalize(re.sub(r'<(script|style)[^>]*>.*?</\1>', '', source, flags=re.S))
    def check_faq(node):
        if isinstance(node, dict):
            if node.get('@type') == 'Question':
                assert normalize(node['name']) in visible, (path, 'hidden FAQ question')
                assert normalize(node['acceptedAnswer']['text']) in visible, (path, 'FAQ answer mismatch', node['name'])
            for value in node.values(): check_faq(value)
        elif isinstance(node, list):
            for value in node: check_faq(value)
    for block in re.findall(r'<script[^>]+type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', source, re.S):
        check_faq(json.loads(block))
    for tag, attrs in page.tags:
        for key in ('href', 'src', 'poster'):
            value = attrs.get(key)
            if not value: continue
            target = urlsplit(urljoin(url, value))
            if target.scheme not in ('https','http') or target.netloc != 'www.3dimmobilienbewertung.de': continue
            if target.path.startswith('/api/'): continue
            local = ROOT / unquote(target.path).lstrip('/')
            if local.is_dir(): local /= 'index.html'
            assert local.is_file(), (path, 'missing target', value)
            links += 1
            if target.fragment and local.suffix == '.html':
                ids_target = {a.get('id') for _,a in Page(local.read_text()).tags}
                assert unquote(target.fragment) in ids_target, (path, 'broken anchor', value)
            if tag == 'a' and path != local: incoming[local] += 1
assert len(titles) == len(set(titles)), 'Duplicate titles'
assert set(urls) == set(sitemap), 'Sitemap/public page mismatch'
assert all(incoming[p] for p in files), 'Orphan page'
assert 'Disallow: /\n' not in (ROOT/'robots.txt').read_text()
print(f'PASS: {len(files)} pages, {len(urls)} indexable URLs, {links} local links/assets; metadata, canonical, sitemap, JSON-LD, unique IDs/titles and incoming links')
