"""September SEO fixes: reviews, one business identity, links and crawl intent."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://www.3dimmobilienbewertung.de/'
ADDRESS={'@type':'PostalAddress','streetAddress':'Gailhoferstraße 17','addressLocality':'Wedemark','postalCode':'30900','addressRegion':'Niedersachsen','addressCountry':'DE'}
def nodes(n):
 if isinstance(n,dict):
  yield n
  for v in n.values():yield from nodes(v)
 elif isinstance(n,list):
  for v in n:yield from nodes(v)
pages=[*ROOT.glob('*.html'),*(ROOT/'blog').glob('*.html')];businesses=0;review_pages=0
for p in pages:
 s=p.read_text()
 assert not re.search(r'\b22\s+(?:Google-Bewertungen|Bewertungen|Rezensionen)',s),p
 if 'Google-Bewertungen' in s:
  review_pages+=1;assert '31 Google-Bewertungen' in s,p
 for payload in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S):
  for n in nodes(json.loads(payload)):
   assert 'aggregateRating' not in n,'Do not invent first-party review rich results'
   types=n.get('@type',[]);types=[types] if isinstance(types,str) else types
   if n.get('name')=='3D Immobilienbewertung' and set(types)&{'LocalBusiness','ProfessionalService','Organization'}:
    businesses+=1;assert n['@id']==ORIGIN+'#organisation' and n['url']==ORIGIN,p
    if set(types)&{'LocalBusiness','ProfessionalService'}:assert n['address']==ADDRESS,p
assert review_pages==32,review_pages
home=(ROOT/'index.html').read_text();assert '31 Google-Bewertungen ansehen' in home
for filename,anchor in [('lp-haus-bewerten-hannover.html','hauswert-pruefen'),('lp-immobilienbewertung-hannover.html','gutachten-auswaehlen')]:
 s=(ROOT/filename).read_text();assert s.count('id="'+anchor+'"')==1
 assert 'Gerichtsfestes Verkehrswertgutachten' not in s
 assert 'Anerkannt von Finanzamt, Gericht &amp; Behörden' not in s
 assert 'kostenpflichtig' in s or 'kostenlos' in s
 assert '/checkliste-immobilienbewertung.html' in s
for city in ['wedemark','isernhagen','burgwedel']:
 s=(ROOT/f'immobilienbewertung-{city}.html').read_text()
 section=re.search(r'<section[^>]+id="bewertungsweg".*?</section>',s,re.S)[0]
 for target in ['lp-haus-bewerten-hannover.html','wohnungsbewertung-hannover.html','restnutzungsdauergutachten-hannover.html']:assert 'href="/'+target+'"' in section
 assert 'keine zusätzliche' not in section or 'Niederlassung' in section
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
entries={n.find('s:loc',ns).text:n.find('s:lastmod',ns).text for n in ET.parse(ROOT/'sitemap.xml').findall('s:url',ns)}
release=json.loads((ROOT/'tests/seo-release-pages.json').read_text())
new_regions={f'immobilienbewertung-{c}.html' for c in ('celle','schwarmstedt','laatzen')}
assert len(release)==50 and len(entries)==51
for p in release:assert entries[ORIGIN+('' if p=='index.html' else p)]==('2026-09-29' if p in new_regions else '2026-09-28')
config=json.loads((ROOT/'vercel.json').read_text());assert {'source':'/index.html','destination':'/','permanent':True} in config['redirects']
assert (ROOT/'robots.txt').read_text().find('Allow: /')>=0
print(f'PASS: 31 Google reviews on {review_pages} pages, {businesses} consistent business/publisher entities, service clusters, distinct landing-page intent and accurate release sitemap')
