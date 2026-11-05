"""Regression checks for the four distinct regional editorial additions."""
from pathlib import Path
from html.parser import HTMLParser
import re,json,html
ROOT=Path(__file__).resolve().parents[1]
slugs=['haus-bewerten-wedemark-modernisierung','haus-bewerten-schwarmstedt-lage-hochwasser','restnutzungsdauer-grossburgwedel-vermietete-haeuser','restnutzungsdauer-isernhagen-eigentumswohnung']
all_pages=list(ROOT.glob('*.html'))+list((ROOT/'blog').glob('*.html'))
for slug in slugs:
    source=(ROOT/'blog'/f'{slug}.html').read_text()
    article=re.search(r'<article>(.*?)</article>',source,re.S)[1]
    words=html.unescape(re.sub('<[^>]+>',' ',article)).split()
    assert len(words)>=550,(slug,len(words))
    assert source.count('class="mobile-contact"')==1
    assert source.count('<h1>')==1
    title=html.unescape(re.search(r'<title>(.*?)</title>',source)[1])
    description=html.unescape(re.search(r'<meta name="description" content="([^"]+)"',source)[1])
    assert len(title)<=60,(slug,len(title))
    assert len(description)<=160,(slug,len(description))
    incoming=[p for p in all_pages if p.name!=slug+'.html' and f'/blog/{slug}.html' in p.read_text()]
    assert len(incoming)>=2,(slug,'orphan/weak incoming links')
    data=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',source,re.S)[1])
    post=data['@graph'][0]
    assert post['headline']==title and post['description']==description
    assert post['datePublished']==post['dateModified']=='2026-09-26'
    assert '26. September 2026' in article and 'kostenpflichtig' in article
    assert 'IHK' not in article
    assert ('Beispiel' in article and 'kein Kundenfall' in article) or 'keine dokumentierten Kundenfälle' in article
    if slug.startswith('restnutzungsdauer'):
        for host in ['gesetze-im-internet.de','bundesfinanzhof.de','bundesfinanzministerium.de']:
            assert host in article
    print(f'PASS {slug}: {len(words)} article words, {len(incoming)} incoming pages, metadata, sources and contact')
about=(ROOT/'ueber-uns.html').read_text()
assert 'Nandino Donnarumma &amp; Vito Donnarumma · Zertifikatslehrgang' in about
for filename in ['index.html','ueber-uns.html']:
    source=(ROOT/filename).read_text()
    hero=re.search(r'<section[^>]*class="hero[^>]*>.*?</section>',source,re.S)[0]
    assert 'IHK' not in hero
    data=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',source,re.S)[1])
    def people(node):
        if isinstance(node,dict):
            if node.get('@type')=='Person':yield node
            for value in node.values():yield from people(value)
        elif isinstance(node,list):
            for value in node:yield from people(value)
    nandino=[p for p in people(data) if p.get('name')=='Nandino Donnarumma'][0]
    assert nandino['hasCredential'][0]['name']=='Zertifikatslehrgang Wertermittlung (IHK)'
print('PASS: both brothers in qualification area; no IHK promotion in hero; Nandino credential matches user correction')
