"""Visible emoji and SVG reference regression check; no browser/network needed."""
from pathlib import Path
from html.parser import HTMLParser
import re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ids={e.attrib['id'] for e in ET.parse(ROOT/'assets/office-icons.svg').iter() if 'id' in e.attrib}
class Check(HTMLParser):
    def __init__(self):super().__init__();self.ignore=0;self.uses=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ('script','style'):self.ignore+=1
        if tag=='use' and a.get('href','').startswith('/assets/office-icons.svg#'):
            assert a['href'].split('#')[1] in ids,a
            self.uses+=1
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.ignore-=1
    def handle_data(self,text):
        if not self.ignore:assert not re.search(r'[\U0001F000-\U0001FAFF\u2705\u26A0\uFE0F]',text),text
total=0
for p in list(ROOT.glob('*.html'))+list((ROOT/'blog').glob('*.html')):
    if 'brand-editorial' not in p.read_text():continue
    c=Check();c.feed(p.read_text());total+=c.uses
assert total>100
print(f'PASS: {total} own SVG icon references, all symbols valid, no visible pictographic emoji')
