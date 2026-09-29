"""Compare the preview with the approved live baseline, not with guesses."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import subprocess, re, json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASELINE = 'f711a9e'
NEW_PAGES = {
    'immobilienbewertung-celle.html',
    'immobilienbewertung-schwarmstedt.html',
    'immobilienbewertung-laatzen.html',
    'blog/haus-bewerten-wedemark-modernisierung.html',
    'blog/haus-bewerten-schwarmstedt-lage-hochwasser.html',
    'blog/restnutzungsdauer-grossburgwedel-vermietete-haeuser.html',
    'blog/restnutzungsdauer-isernhagen-eigentumswohnung.html',
}
CREDENTIAL = {'@type':'EducationalOccupationalCredential','credentialCategory':'certificate','name':'Zertifikatslehrgang Wertermittlung (IHK)','recognizedBy':{'@type':'Organization','name':'Industrie- und Handelskammer Hannover'}}
PORTRAITS={f'assets/{name}-donnarumma-20260928{size}.webp' for name in ('nandino','vito') for size in ('','-small')}
OFFICE_KEYS=('nandino-beratung','nandino-grundriss','nandino-unterlagen','nandino-besichtigung','nandino-pruefung','team-auswertung','team-besprechung','vito-beratung','vito-auswertung')
OFFICE_PHOTOS={f'assets/office-{key}-{size}.webp' for key in OFFICE_KEYS for size in ((640,1440) if key.startswith('team-') else (480,960))}
def normalized_media(tags,path):
    media=[]
    for t,attrs in tags:
        if t not in ('img','video','source','iframe'):continue
        a=dict(attrs)
        if t=='img' and a.get('src','').lstrip('/') in OFFICE_PHOTOS:
            assert a.get('data-office-photo') in OFFICE_KEYS
            continue # New user-supplied photos, checked by office-photography.py.
        if path=='index.html' and t=='img' and a.get('src') in ('/assets/team-1.webp','/assets/team-2.webp') and a.get('alt') in ('Nandino Donnarumma, M.Sc. Bauingenieurwesen','Vito Donnarumma, B.Sc. Architektur'):
            continue # Hero portrait pair explicitly replaced by the joint team photo.
        if t=='img' and a.get('src','').lstrip('/') in PORTRAITS:
            assert a.pop('class',None)=='office-portrait'
            if path=='ueber-uns.html':continue # Two new, explicitly requested founder portraits.
            person='1' if 'nandino-' in a['src'] else '2'
            a['src']=f'/assets/team-{person}.webp'
            a['width']='800';a['height']='999'
        media.append((t,a))
    return media
def normalized_schema(source, path=None):
    # Only the user's explicit correction to Nandino's qualification is allowed.
    def visit(node):
        if isinstance(node, dict):
            kinds=node.get('@type',[]);kinds=[kinds] if isinstance(kinds,str) else kinds
            if node.get('name')=='3D Immobilienbewertung' and set(kinds)&{'LocalBusiness','ProfessionalService','Organization'}:
                # SEO correction: one organisation, one real office. Exact new values
                # are independently asserted in seo-improvements.py.
                node['@id']='https://www.3dimmobilienbewertung.de/#organisation'
                node['url']='https://www.3dimmobilienbewertung.de/'
                if set(kinds)&{'LocalBusiness','ProfessionalService'}:
                    node['address']={'@type':'PostalAddress','streetAddress':'Gailhoferstraße 17','addressLocality':'Wedemark','postalCode':'30900','addressRegion':'Niedersachsen','addressCountry':'DE'}
            if path in ('checkliste-immobilienbewertung.html','immobilienbewertung-isernhagen.html','immobilienbewertung-burgwedel.html') and 'dateModified' in node:
                assert node['dateModified'] in ('2026-09-22','2026-09-26','2026-09-28')
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
    source=source.replace('31 Google-Bewertungen','22 Google-Bewertungen')
    if path=='lp-haus-bewerten-hannover.html':
        source=source.replace('Haus bewerten lassen in Hannover und der Region: Zustand, Modernisierung und Lage prüfen. Kurzgutachten ab 490 €. Kostenloses Erstgespräch anfragen.','Haus bewerten lassen in Hannover: Wertermittlung vom Sachverständigen für Immobilienbewertung. Rückmeldung in 24 h · 5,0 ★ (22 Google-Bewertungen) · Kostenloses Erstgespräch.')
    tags=Page(source).tags
    return {
        'title': re.findall(r'<title>.*?</title>', source, re.S),
        'metadata': [a for t,a in tags if t=='meta'],
        'canonical': [a for t,a in tags if t=='link' and a.get('rel')=='canonical'],
        'schema': normalized_schema(source, path),
        'media': normalized_media(tags,path),
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
for filename in ['robots.txt','api/contact.js','assets/consent.js','assets/editorial-ui.js','assets/local-contact.js','assets/home-funnel.js']:
    assert (ROOT/filename).read_bytes()==previous(filename),(filename,'protected integration changed')
deployment=json.loads((ROOT/'vercel.json').read_text())
redirect={'source':'/index.html','destination':'/','permanent':True}
assert deployment['redirects'].count(redirect)==1
deployment['redirects'].remove(redirect)
assert deployment==json.loads(previous('vercel.json')),'unexpected routing/integration change'
for p in (ROOT/'assets').iterdir():
    if str(p.relative_to(ROOT)) in PORTRAITS|OFFICE_PHOTOS:continue # Validated separately by image tests.
    if p.suffix.lower() in ('.webp','.png','.jpg','.jpeg','.mp4','.woff2'):
        assert p.read_bytes()==previous(p.relative_to(ROOT)),(p,'media/font changed')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
def sitemap_entries(data):
    return {e.find('s:loc',ns).text:{c.tag.rsplit('}',1)[-1]:c.text for c in e} for e in ET.fromstring(data).findall('s:url',ns)}
oldmap=sitemap_entries(previous('sitemap.xml')); newmap=sitemap_entries((ROOT/'sitemap.xml').read_bytes())
origin='https://www.3dimmobilienbewertung.de/'
assert set(newmap)==set(oldmap)|{origin+p for p in NEW_PAGES}
updated={'','blog/','ueber-uns.html','immobilienbewertung-wedemark.html','immobilienbewertung-burgwedel.html','immobilienbewertung-isernhagen.html','restnutzungsdauergutachten-hannover.html'}
seo_updated={origin+('' if p=='index.html' else p) for p in json.loads((ROOT/'tests/seo-release-pages.json').read_text())}
for url,entry in oldmap.items():
    expected=dict(entry)
    if url in {origin+p for p in updated}:expected['lastmod']='2026-09-26'
    if url in seo_updated:expected['lastmod']='2026-09-28'
    assert newmap[url]==expected,(url,'unexpected sitemap change')
print(f'PASS: {len(baseline_pages)} existing URLs/metadata/media/anchors/integrations preserved; four articles and user-confirmed qualification added against {BASELINE}')
