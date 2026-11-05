"""Real photography: exact assets, responsive sources, loading and semantic markup."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import re

ROOT=Path(__file__).resolve().parents[1]
KEYS={'nandino-beratung','nandino-grundriss','nandino-unterlagen','nandino-besichtigung','nandino-pruefung','team-auswertung','team-besprechung','vito-beratung','vito-auswertung'}
EXPECTED={'index.html':0,'ueber-uns.html':1,'lp-immobilienbewertung-hannover.html':1,'lp-haus-bewerten-hannover.html':1,'wohnungsbewertung-hannover.html':1,'restnutzungsdauergutachten-hannover.html':1,'checkliste-immobilienbewertung.html':1,**{f'immobilienbewertung-{city}.html':1 for city in ('wedemark','isernhagen','burgwedel','seelze')}}
class Page(HTMLParser):
    def __init__(self,source):super().__init__();self.images=[];self.feed(source)
    def handle_starttag(self,tag,attrs):
        if tag=='img':self.images.append(dict(attrs))

seen=set();total=0
EXPECTED.update({f'immobilienbewertung-{city}.html':1 for city in ('celle','schwarmstedt','laatzen')})
for path,count in EXPECTED.items():
    source=(ROOT/path).read_text()
    assert source.count('/assets/office-photography.css?v=20261021')==1,path
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
# Seit dem Redesign (21./22.10.2026, Vorgabe des Inhabers: weniger Teamfotos)
# sind zwei der neun Aufnahmen nicht eingebunden; die Dateien bleiben erhalten.
UNUSED={'nandino-beratung','vito-auswertung'}
assert seen==KEYS-UNUSED,(seen,KEYS)
for key in UNUSED:
    for w in (480,960):assert (ROOT/f'assets/office-{key}-{w}.webp').is_file(),key
for path in ROOT.glob('*.html'):
    if path.name not in EXPECTED:assert 'data-office-photo' not in path.read_text(),path
home=(ROOT/'index.html').read_text()
hero=re.search(r'<section class="hero[ "].*?</section>',home,re.S)[0]
assert 'office-portrait' not in hero
# Team-first: das gemeinsame Arbeitsfoto ist das Startbild der Diashow
hero_images=Page(hero).images
hero_image=hero_images[0]
assert 'hero-team-' in hero_image['src'] and hero_image.get('fetchpriority')=='high' and hero_image['alt']
assert 'loading' not in hero_image and 'data-src' not in hero_image
for part in hero_image['srcset'].split(','):
    filename,descriptor=part.strip().split()
    picture=Image.open(ROOT/filename.lstrip('/'))
    assert picture.width==int(descriptor[:-1]) and picture.format=='WEBP'
    assert picture.width<=1536  # nie hochgerechnet: Quelle hat 1536px
assert hero_image['sizes']=='(min-width:1000px) min(46vw,720px), calc(100vw - 40px)'
assert all(a.get('alt')=='' for a in hero_images[1:]),'Hannover-Motive sind dekorativ'
assert 'class="hero-heading"' in hero and 'class="hero-next-step"' in hero
css=(ROOT/'assets/office-photography.css').read_text()
assert '@media(prefers-reduced-motion:no-preference)' in css
assert '@media(hover:hover) and (pointer:fine)' in css
assert 'opacity:0' not in css and 'visibility:hidden' not in css
assert '.brand-editorial .office-process>.office-photo:first-child{grid-row:span 2}' in css
components=(ROOT/'assets/brand-components.css').read_text()
assert '.brand-editorial .section-dark .tcard blockquote,.brand-editorial .section-dark .tcard cite .nm{color:var(--ink)}' in components
print(f'PASS: {len(seen)} of 9 supplied photos, {total} placements on {len(EXPECTED)} pages, responsive WebP, lazy loading, descriptions and team-first hero')
