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
    assert styles == ['/assets/brand-editorial.css?v=warm-20260922'], path
    assert 'fonts.googleapis.com' not in source, path
    if path.name not in ('datenschutz.html', 'impressum.html'):
        assert sum(t == 'link' and a.get('rel') == 'canonical' for t, a in tags) == 1, path
    else:
        assert any(t == 'meta' and a.get('name') == 'robots' and 'noindex' in a.get('content', '') for t, a in tags), path
    for block in re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', source, re.S):
        json.loads(block)
    if path.name in ('index.html', 'ueber-uns.html') and path.parent == ROOT:
        for date in ('2025-07-08', '2025-08-06', '2024-11-08', '08.07.2025', '08.11.2024'):
            assert date not in source, (path, date)
assert len(pages) == 46, len(pages)
print(f'PASS: {len(pages)} pages — shared theme, H1, canonical, JSON-LD, local fonts and private qualification dates')
