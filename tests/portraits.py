"""Only approved portraits change; natural dimensions and person labels agree."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import subprocess
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self,s):super().__init__();self.images=[];self.feed(s)
    def handle_starttag(self,t,a):
        if t=='img':self.images.append(dict(a))
count=0;pages=0
for p in ROOT.glob('*.html'):
    source=p.read_text();portraits=[a for a in Page(source).images if 'donnarumma-20260928' in a.get('src','')]
    if not portraits:continue
    pages+=1
    assert '/assets/portraits-20260928.css' in source
    assert '/assets/team-1.webp' not in source and '/assets/team-2.webp' not in source
    for a in portraits:
        image=Image.open(ROOT/a['src'].lstrip('/'))
        assert image.size==(int(a['width']),int(a['height']))
        assert image.format=='WEBP' and 'exif' not in image.info
        name='Nandino' if 'nandino-' in a['src'] else 'Vito'
        assert name+' Donnarumma' in a['alt']
        assert a['class']=='office-portrait'
        small='-small.webp' in a['src']
        assert image.size==((160,200) if small else (800,1000))
        assert (ROOT/a['src'].lstrip('/')).stat().st_size<(10000 if small else 80000)
        count+=1
assert (pages,count)==(20,40),(pages,count)
for name in ('team-1.webp','team-2.webp','team-1.jpg','team-2.jpg'):
    assert (ROOT/'assets'/name).read_bytes()==subprocess.check_output(['git','show','95d254a:assets/'+name],cwd=ROOT)
print(f'PASS: {count} correctly labelled portraits on {pages} pages, dimensions and WebP budgets, original assets retained')
