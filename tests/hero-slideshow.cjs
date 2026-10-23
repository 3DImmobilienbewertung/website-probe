'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(ROOT,'assets/diashow.js'),'utf8');
const flush=()=>new Promise(r=>setTimeout(r,0));

function klassen(){const s=new Set();return {add:n=>s.add(n),remove:n=>s.delete(n),contains:n=>s.has(n),
  toggle(n,an){if(an===undefined?!s.has(n):an)s.add(n);else s.delete(n);}};}
// Bild-Attrappe: load/error per fire(), decode() wie im Browser
function bild({src='',spaeter='',geladen=false}={}){
  const h={},attrs={};
  if(src)attrs.src=src;
  if(spaeter){attrs['data-src']=spaeter;attrs['data-srcset']=spaeter+' 700w';}
  return {attrs,complete:geladen,naturalWidth:geladen?1000:0,currentSrc:geladen?src:'',
    getAttribute:k=>k in attrs?attrs[k]:null,
    setAttribute(k,v){attrs[k]=v;if(k==='src'){this.complete=false;this.naturalWidth=0;this.currentSrc=v;}},
    addEventListener(n,f,o){(h[n]=h[n]||[]).push({f,once:!!(o&&o.once)});},
    decode(){return this.naturalWidth>0?Promise.resolve():Promise.reject(Error('decode'));},
    fire(n){if(n==='load'){this.complete=true;this.naturalWidth=1000;}if(n==='error'){this.complete=true;this.naturalWidth=0;}
      const l=h[n]||[];h[n]=l.filter(x=>!x.once);l.forEach(x=>x.f());}};
}
function aufbau(bilder,{reduziert=false}={}){
  const folien=bilder.map(img=>({img,hidden:false,classList:klassen(),querySelector:s=>s==='img'?img:null,querySelectorAll:()=>[]}));
  const figur={classList:klassen(),querySelectorAll:s=>s==='.slide'?folien:[]};
  const label={textContent:''},hoerer={},attrs={};
  const knopf={hidden:true,attrs,setAttribute:(k,v)=>{attrs[k]=v;},querySelector:()=>label,label,
    addEventListener:(n,f)=>{hoerer[n]=f;},click:()=>hoerer.click()};
  let tick=null;
  const uhr={setInterval:f=>{tick=f;return 1;},clearInterval:()=>{tick=null;}};
  const win={};vm.runInNewContext(code,{window:win,Promise});
  const d=win.Diashow(figur,Object.assign({knopf,reduziert},uhr));
  return {d,folien,figur,knopf,takt:()=>{assert.ok(tick,'Diashow laeuft nicht');tick();},laeuft:()=>!!tick};
}
const aktivIndex=x=>x.folien.indexOf(x.d.aktiv());

(async()=>{
  // 1) Startbild aus dem Cache, drei weitere nachgeladen, eines davon defekt
  let x=aufbau([bild({src:'team.webp',geladen:true}),bild({spaeter:'a.webp'}),bild({spaeter:'b.webp'}),bild({spaeter:'c.webp'})]);
  assert.equal(aktivIndex(x),0,'Startbild sofort sichtbar');
  assert.ok(x.figur.classList.contains('diashow-js'));
  await flush();
  assert.deepEqual(Array.from(x.d.bereit(),f=>x.folien.indexOf(f)),[0],'Cache-Treffer ohne load-Ereignis erkannt');
  assert.equal(x.knopf.hidden,true,'mit einem Bild keine Pause-Taste');
  assert.equal(x.laeuft(),false);
  x.d.nachladen();
  assert.equal(x.folien[1].img.attrs.src,'a.webp');assert.equal(x.folien[1].img.attrs.srcset,'a.webp 700w');
  x.folien[1].img.fire('load');x.folien[2].img.fire('error');x.folien[3].img.fire('load');
  await flush();
  assert.deepEqual(Array.from(x.d.bereit(),f=>x.folien.indexOf(f)),[0,1,3],'defektes Bild nicht in der Rotation');
  assert.equal(x.folien[2].hidden,true);
  assert.equal(x.knopf.hidden,false);assert.equal(x.laeuft(),true);
  x.takt();assert.equal(aktivIndex(x),1);x.takt();assert.equal(aktivIndex(x),3,'Ausfall uebersprungen');x.takt();assert.equal(aktivIndex(x),0);
  for(const f of x.folien)assert.ok(!(f.hidden&&f.classList.contains('aktiv')),'nie eine ausgefallene Folie aktiv');
  console.log('PASS: Startbild sofort, Cache-Treffer, nur erfolgreich geladene Motive, Ausfall uebersprungen');

  // 2) Pause und Fortsetzen
  assert.equal(x.knopf.label.textContent,'Diashow anhalten');
  x.knopf.click();
  assert.equal(x.laeuft(),false);assert.equal(x.knopf.label.textContent,'Diashow fortsetzen');
  assert.equal(x.knopf.attrs['data-zustand'],'pause');assert.ok(x.figur.classList.contains('angehalten'));
  const stand=aktivIndex(x);await flush();assert.equal(aktivIndex(x),stand,'angehalten bleibt das Bild stehen');
  x.knopf.click();
  assert.equal(x.laeuft(),true);assert.equal(x.knopf.label.textContent,'Diashow anhalten');assert.equal(x.knopf.attrs['data-zustand'],'laeuft');
  console.log('PASS: Pause-Taste haelt an, beschriftet sich um und setzt fort');

  // 3) Spaeterer Fehler (z. B. andere Quelle nach Drehen): aktive Folie faellt aus
  x.takt();assert.equal(aktivIndex(x),1);
  x.folien[1].img.fire('error');
  assert.equal(aktivIndex(x),0,'naechstes gueltiges Bild sichtbar');
  x.folien[3].img.fire('error');
  assert.equal(x.laeuft(),false,'mit nur einem Bild keine Rotation');assert.equal(x.knopf.hidden,true);
  assert.equal(aktivIndex(x),0);
  console.log('PASS: spaeterer Ladefehler entfernt Folie, gueltiges Bild bleibt, Rotation stoppt unter zwei Bildern');

  // 4) Startbild defekt: erstes funktionierendes Motiv wird Startbild
  x=aufbau([bild({src:'team.webp'}),bild({spaeter:'a.webp'}),bild({spaeter:'b.webp'})]);
  x.folien[0].img.fire('error');await flush();
  assert.equal(x.d.aktiv(),null);assert.equal(x.folien[0].hidden,true);
  x.d.nachladen();x.folien[1].img.fire('error');x.folien[2].img.fire('load');await flush();
  assert.equal(aktivIndex(x),2,'erstes funktionierendes Motiv sichtbar');
  assert.equal(x.laeuft(),false);assert.equal(x.knopf.hidden,true);
  // decode() schlaegt fehl, Bild ist trotzdem da -> zaehlt als geladen
  x=aufbau([bild({src:'team.webp'}),bild({spaeter:'a.webp'})]);
  x.folien[0].img.decode=()=>Promise.reject(Error('gross'));x.folien[0].img.fire('load');await flush();
  assert.equal(x.d.bereit().length,1);
  console.log('PASS: defektes Startbild ersetzt, decode()-Fehler bei vorhandenem Bild toleriert');

  // 5) Bewegung reduzieren: nichts nachladen, keine Rotation, keine Taste
  x=aufbau([bild({src:'team.webp',geladen:true}),bild({spaeter:'a.webp'})],{reduziert:true});
  await flush();x.d.nachladen();
  assert.equal(x.folien[1].img.attrs.src,undefined);assert.equal(x.laeuft(),false);assert.equal(x.knopf.hidden,true);
  assert.equal(aktivIndex(x),0);
  console.log('PASS: reduzierte Bewegung zeigt nur das Startbild');

  // 6) Markup: Taste ausserhalb aria-hidden, Skript eingebunden, Startbild eager
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const figur=html.match(/<figure[^>]*class="[^"]*hero-slides[^"]*"[^>]*>[\s\S]*?<\/figure>/);
  assert.ok(figur,'Diashow-Figur fehlt');
  assert.doesNotMatch(figur[0].match(/<figure[^>]*>/)[0],/aria-hidden/,'Figur darf nicht aria-hidden sein');
  const knopf=figur[0].match(/<button[^>]*class="diashow-knopf"[^>]*>/);
  assert.ok(knopf,'Pause-Taste fehlt');
  assert.match(knopf[0],/type="button"/);assert.match(knopf[0],/\shidden/);assert.doesNotMatch(knopf[0],/aria-hidden/);
  assert.match(figur[0],/class="diashow-text"[^>]*>Diashow anhalten</);
  const ersteFolie=figur[0].match(/<img[^>]*>/)[0];
  assert.match(ersteFolie,/fetchpriority="high"/);assert.doesNotMatch(ersteFolie,/data-src=/);assert.match(ersteFolie,/alt="[^"]+"/);
  assert.match(html,/<script src="\/assets\/diashow\.js\?v=[\w-]+" defer><\/script>/);
  console.log('PASS: Markup - Pause-Taste erreichbar, Startbild sofort geladen und beschrieben, Skript eingebunden');
})().catch(e=>{console.error(e);process.exitCode=1;});
