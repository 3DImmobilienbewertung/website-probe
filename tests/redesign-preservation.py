"""Compare the preview with the approved live baseline, not with guesses."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import subprocess, re, json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASELINE = 'f711a9e'
NEW_PAGES = {
    'blog/haus-bewerten-wedemark-modernisierung.html',
    'blog/haus-bewerten-schwarmstedt-lage-hochwasser.html',
    'blog/restnutzungsdauer-grossburgwedel-vermietete-haeuser.html',
    'blog/restnutzungsdauer-isernhagen-eigentumswohnung.html',
}
CREDENTIAL = {'@type':'EducationalOccupationalCredential','credentialCategory':'certificate','name':'Zertifikatslehrgang Wertermittlung (IHK)','recognizedBy':{'@type':'Organization','name':'Industrie- und Handelskammer Hannover'}}
def normalized_schema(source, path=None):
    # Only the user's explicit correction to Nandino's qualification is allowed.
    def visit(node):
        if isinstance(node, dict):
            if path in ('immobilienbewertung-isernhagen.html','immobilienbewertung-burgwedel.html') and 'dateModified' in node:
                assert node['dateModified'] in ('2026-09-22','2026-09-26')
                node['dateModified']='2026-09-22'
            if node.get('@type') == 'Person' and node.get('name') == 'Nandino Donnarumma' and 'hasCredential' in node:
                assert node['hasCredential'] == [CREDENTIAL]
                del node['hasCredential']
            for value in node.values(): visit(value)
        elif isinstance(node,list):
            for value in node: visit(value)
    blocks=[json.loads(s) for s in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',source,re.S)]
    for block in blocks: visit(block)
    return blocks
def previous(path):
    return subprocess.check_output(['git', 'show', BASELINE + ':' + str(path)], cwd=ROOT)
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.tags=[]; self.feed(source)
    def handle_starttag(self, tag, attrs): self.tags.append((tag, dict(attrs)))
def protected(source, path=None):
    tags=Page(source).tags
    return {
        'title': re.findall(r'<title>.*?</title>', source, re.S),
        'metadata': [a for t,a in tags if t=='meta'],
        'canonical': [a for t,a in tags if t=='link' and a.get('rel')=='canonical'],
        'schema': normalized_schema(source, path),
        'media': [(t,a) for t,a in tags if t in ('img','video','source','iframe')],
    }
pages=[p for p in list(ROOT.glob('*.html'))+list((ROOT/'blog').glob('*.html')) if 'brand-editorial' in p.read_text()]
baseline_pages={p for p in subprocess.check_output(['git','ls-tree','-r','--name-only',BASELINE],cwd=ROOT,text=True).splitlines() if (p.endswith('.html') and (p.count('/')==0 or p.startswith('blog/'))) and not Path(p).name.startswith('google')}
assert {str(p.relative_to(ROOT)) for p in pages} == baseline_pages | NEW_PAGES
for p in pages:
    if str(p.relative_to(ROOT)) in NEW_PAGES: continue
    relative=p.relative_to(ROOT); old=previous(relative).decode(); new=p.read_text()
    assert protected(old,str(relative))==protected(new,str(relative)),(relative,'metadata/schema/media changed')
    before=Page(old).tags; after=Page(new).tags
    assert {a['id'] for _,a in before if 'id' in a} <= {a['id'] for _,a in after if 'id' in a},(relative,'lost anchors')
    assert {a['href'] for t,a in before if t=='a' and 'href' in a} <= {a['href'] for t,a in after if t=='a' and 'href' in a},(relative,'lost links')
for filename in ['robots.txt','vercel.json','api/contact.js','assets/consent.js','assets/editorial-ui.js','assets/local-contact.js','assets/home-funnel.js']:
    assert (ROOT/filename).read_bytes()==previous(filename),(filename,'protected integration changed')
for p in (ROOT/'assets').iterdir():
    if p.suffix.lower() in ('.webp','.png','.jpg','.jpeg','.mp4','.woff2'):
        assert p.read_bytes()==previous(p.relative_to(ROOT)),(p,'media/font changed')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
def sitemap_entries(data):
    return {e.find('s:loc',ns).text:{c.tag.rsplit('}',1)[-1]:c.text for c in e} for e in ET.fromstring(data).findall('s:url',ns)}
oldmap=sitemap_entries(previous('sitemap.xml')); newmap=sitemap_entries((ROOT/'sitemap.xml').read_bytes())
origin='https://www.3dimmobilienbewertung.de/'
assert set(newmap)==set(oldmap)|{origin+p for p in NEW_PAGES}
updated={'','blog/','ueber-uns.html','immobilienbewertung-wedemark.html','immobilienbewertung-burgwedel.html','immobilienbewertung-isernhagen.html','restnutzungsdauergutachten-hannover.html'}
for url,entry in oldmap.items():
    expected=dict(entry)
    if url in {origin+p for p in updated}:expected['lastmod']='2026-09-26'
    assert newmap[url]==expected,(url,'unexpected sitemap change')
print(f'PASS: {len(baseline_pages)} existing URLs/metadata/media/anchors/integrations preserved; four articles and user-confirmed qualification added against {BASELINE}')
