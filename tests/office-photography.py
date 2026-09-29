"""Real photography: exact assets, responsive sources, loading and semantic markup."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import re

ROOT=Path(__file__).resolve().parents[1]
KEYS={'nandino-beratung','nandino-grundriss','nandino-unterlagen','nandino-besichtigung','nandino-pruefung','team-auswertung','team-besprechung','vito-beratung','vito-auswertung'}
EXPECTED={'index.html':5,'ueber-uns.html':1,'lp-immobilienbewertung-hannover.html':1,'lp-haus-bewerten-hannover.html':1,'wohnungsbewertung-hannover.html':1,'restnutzungsdauergutachten-hannover.html':1,'checkliste-immobilienbewertung.html':1,**{f'immobilienbewertung-{city}.html':1 for city in ('wedemark','isernhagen','burgwedel','seelze')}}
class Page(HTMLParser):
    def __init__(self,source):super().__init__();self.images=[];self.feed(source)
    def handle_starttag(self,tag,attrs):
        if tag=='img':self.images.append(dict(attrs))

seen=set();total=0
EXPECTED.update({f'immobilienbewertung-{city}.html':1 for city in ('celle','schwarmstedt','laatzen')})
for path,count in EXPECTED.items():
    source=(ROOT/path).read_text()
    assert source.count('/assets/office-photography.css?v=20260928')==1,path
    images=[a for a in Page(source).images if 'data-office-photo' in a]
    assert len(images)==count,(path,len(images))
    for a in images:
        key=a['data-office-photo'];assert key in KEYS;seen.add(key);total+=1
        assert a['alt'] and a['class']=='office-shot'
        assert a['decoding']=='async' and 'sizes' in a
        image=Image.open(ROOT/a['src'].lstrip('/'))
        assert image.size==(int(a['width']),int(a['height']))
        for part in a['srcset'].split(','):
            filename,descriptor=part.strip().split()
            picture=Image.open(ROOT/filename.lstrip('/'))
            assert picture.width==int(descriptor[:-1])
            assert picture.format=='WEBP' and 'exif' not in picture.info
            assert (ROOT/filename.lstrip('/')).stat().st_size<130000
        is_hero=key==('team-besprechung' if path=='index.html' else 'team-auswertung') and path in ('index.html','ueber-uns.html')
        assert (a.get('fetchpriority')=='high')==is_hero
        assert (a.get('loading')=='lazy')!=is_hero
    assert source.count('<figure')==source.count('</figure>'),path
assert seen==KEYS
for path in ROOT.glob('*.html'):
    if path.name not in EXPECTED:assert 'data-office-photo' not in path.read_text(),path
home=(ROOT/'index.html').read_text()
hero=re.search(r'<section class="hero".*?</section>',home,re.S)[0]
assert 'office-portrait' not in hero and len(Page(hero).images)==1
assert 'data-office-photo="team-besprechung"' in hero
hero_image=Page(hero).images[0]
assert hero_image['sizes']=='(max-width: 1240px) calc(100vw - 40px), 1184px'
assert 'class="hero-heading"' in hero and 'class="hero-next-step"' in hero
css=(ROOT/'assets/office-photography.css').read_text()
assert '@media(prefers-reduced-motion:no-preference)' in css
assert '@media(hover:hover) and (pointer:fine)' in css
assert 'opacity:0' not in css and 'visibility:hidden' not in css
assert '.brand-editorial .office-process>.office-photo:first-child{grid-row:span 2}' in css
components=(ROOT/'assets/brand-components.css').read_text()
assert '.brand-editorial .section-dark .tcard blockquote,.brand-editorial .section-dark .tcard cite .nm{color:var(--ink)}' in components
print(f'PASS: all 9 supplied photos, {total} placements on {len(EXPECTED)} pages, responsive WebP, lazy loading, descriptions and team-first hero')
