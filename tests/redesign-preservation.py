"""Compare the preview with the approved live baseline, not with guesses."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import subprocess, re

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '4b7b4e2'
def previous(path):
    return subprocess.check_output(['git', 'show', BASELINE + ':' + str(path)], cwd=ROOT)
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.tags=[]; self.feed(source)
    def handle_starttag(self, tag, attrs): self.tags.append((tag, dict(attrs)))
def protected(source):
    tags=Page(source).tags
    return {
        'title': re.findall(r'<title>.*?</title>', source, re.S),
        'metadata': [a for t,a in tags if t=='meta'],
        'canonical': [a for t,a in tags if t=='link' and a.get('rel')=='canonical'],
        'schema': re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>.*?</script>', source, re.S),
        'media': [(t,a) for t,a in tags if t in ('img','video','source','iframe')],
    }
pages=[p for p in list(ROOT.glob('*.html'))+list((ROOT/'blog').glob('*.html')) if 'brand-editorial' in p.read_text()]
baseline_pages={p for p in subprocess.check_output(['git','ls-tree','-r','--name-only',BASELINE],cwd=ROOT,text=True).splitlines() if (p.endswith('.html') and (p.count('/')==0 or p.startswith('blog/'))) and not Path(p).name.startswith('google')}
assert {str(p.relative_to(ROOT)) for p in pages} == baseline_pages
for p in pages:
    relative=p.relative_to(ROOT); old=previous(relative).decode(); new=p.read_text()
    assert protected(old)==protected(new),(relative,'metadata/schema/media changed')
    before=Page(old).tags; after=Page(new).tags
    assert {a['id'] for _,a in before if 'id' in a} <= {a['id'] for _,a in after if 'id' in a},(relative,'lost anchors')
    assert {a['href'] for t,a in before if t=='a' and 'href' in a} <= {a['href'] for t,a in after if t=='a' and 'href' in a},(relative,'lost links')
for filename in ['robots.txt','sitemap.xml','vercel.json','api/contact.js','assets/consent.js','assets/editorial-ui.js','assets/local-contact.js']:
    assert (ROOT/filename).read_bytes()==previous(filename),(filename,'protected integration changed')
for p in (ROOT/'assets').iterdir():
    if p.suffix.lower() in ('.webp','.png','.jpg','.jpeg','.mp4','.woff2'):
        assert p.read_bytes()==previous(p.relative_to(ROOT)),(p,'media/font changed')
print(f'PASS: {len(pages)} URLs, metadata, schema, anchors, links, media, fonts, sitemap, redirects, API and tracking preserved against {BASELINE}')
