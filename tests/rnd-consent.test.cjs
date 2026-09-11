// Unit-level DOM tests. jsdom never downloads or executes provider scripts.
// These assertions verify our adapter, not Google/Meta account configuration.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.RND_JSDOM_MODULE || 'jsdom');
const source = fs.readFileSync(path.join(__dirname,'../assets/consent.js'),'utf8');
const KEY='3dim_consent_v2', VERSION='3dim-2026-09-10';
const consent = change => ({version:VERSION,id:'e72d053a-1734-42c5-bf3d-1dbab2619c2e',at:Date.now(),analytics:true,marketing:true,...change});
const clean = value => JSON.parse(JSON.stringify(value));
async function setup(t, options={}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><button id="cookieSettings">Cookies</button></body></html>',{
    url:options.url || 'https://www.3dimmobilienbewertung.de/restnutzungsdauergutachten-hannover.html?utm_content=erbe&private=SECRET',
    runScripts:'outside-only'
  });
  const w=dom.window,d=w.document,calls=[];
  t.after(()=>w.close());
  if (d.readyState==='loading') await new Promise(resolve=>d.addEventListener('DOMContentLoaded',resolve,{once:true}));
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.fetch=async (input,init)=>{calls.push({input,init});return new Response(JSON.stringify(options.response || {ok:true}),{status:options.status || 200,headers:{'Content-Type':'application/json'}});};
  if (options.saved) d.cookie=KEY+'='+encodeURIComponent(JSON.stringify(options.saved))+';path=/';
  if (options.cookie) d.cookie=options.cookie;
  if (options.before) options.before(w);
  w.eval(source);
  const choose = choice => d.querySelector('#cookie-banner [data-choice="'+choice+'"]').click();
  const purposes = (analytics,marketing) => {
    w.__cmp('showUi');d.querySelector('#consentAnalytics').checked=analytics;d.querySelector('#consentMarketing').checked=marketing;
    d.querySelector('#consent-dialog [data-choice="save"]').click();
  };
  const commands = () => Array.from(w.dataLayer || [],x=>Array.from(x));
  const leads = () => commands().filter(x=>x[0]==='event' && x[1]==='generate_lead');
  const meta = () => Array.from(w.fbq ? w.fbq.queue : [],x=>Array.from(x));
  const metaLeads = () => meta().filter(x=>x[0]==='trackSingle' && x[2]==='Lead');
  return {w,d,calls,choose,purposes,commands,leads,meta,metaLeads,scripts:()=>Array.from(d.querySelectorAll('script[src]'),x=>x.src)};
}
test('fresh visit has no tracking scripts, no consent cookie, no preselected purposes',async t=>{
  const x=await setup(t);assert.deepEqual(x.scripts(),[]);assert.equal(x.d.cookie,'');
  assert.equal(x.d.querySelector('#cookie-banner').hidden,false);
  x.w.__cmp.showUi();assert.equal(x.d.querySelector('dialog').open,true);
  assert.equal(x.d.querySelector('#consentAnalytics').checked,false);assert.equal(x.d.querySelector('#consentMarketing').checked,false);
  x.d.querySelector('.cmp-close').click();assert.equal(x.d.cookie,'');
});
test('legacy Analytics consent never migrates into a marketing grant',async t=>{
  const x=await setup(t,{cookie:'3dim_consent='+encodeURIComponent(JSON.stringify({analytics:true,marketing:true}))});
  assert.deepEqual(x.scripts(),[]);assert.equal(x.w.rndMeasurement.proof().marketingConsent,false);
});
test('invalid, old, expired and future cookies fail closed',async t=>{
  for(const changed of [{version:'old'},{at:Date.now()-181*864e5},{at:Date.now()+600000},{id:'------------------------------------'},{analytics:'true'}]) {
    const x=await setup(t,{saved:consent(changed)});assert.deepEqual(x.scripts(),[]);assert.equal(x.d.querySelector('#cookie-banner').hidden,false);
  }
});
test('reject persists a versioned all-false choice while keeping the form adapter usable',async t=>{
  const x=await setup(t);x.choose('none');assert.deepEqual(x.scripts(),[]);
  const saved=JSON.parse(decodeURIComponent(x.d.cookie.split('=').slice(1).join('=')));
  assert.equal(saved.version,VERSION);assert.equal(saved.analytics,false);assert.equal(saved.marketing,false);assert.equal(x.d.querySelector('#cookie-banner').hidden,true);
  assert.equal(x.w.rndMeasurement.submission('request-1').marketingConsent,false);
});
test('analytics-only loads only GA with advertising consent denied',async t=>{
  const x=await setup(t);x.purposes(true,false);
  assert.equal(x.scripts().length,1);assert.ok(x.scripts()[0].startsWith('https://www.googletagmanager.com/'));
  const update=x.commands().find(c=>c[0]==='consent' && c[1]==='update')[2];
  assert.equal(update.analytics_storage,'granted');assert.equal(update.ad_storage,'denied');assert.equal(update.ad_user_data,'denied');assert.equal(update.ad_personalization,'denied');
  assert.equal(x.w.rndMeasurement.proof().marketingConsent,false);
});
test('marketing-only loads only Meta with automatic matching/configuration disabled',async t=>{
  const x=await setup(t);x.purposes(false,true);
  assert.equal(x.scripts().length,1);assert.ok(x.scripts()[0].startsWith('https://connect.facebook.net/'));
  assert.ok(x.meta().some(c=>c[0]==='set' && c[1]==='autoConfig' && c[2]===false));
  assert.equal(x.meta().find(c=>c[0]==='init').length,2);
  assert.equal(x.commands().length,0);
});
test('Meta remains off outside the RND page, even with saved marketing consent',async t=>{
  const x=await setup(t,{url:'https://www.3dimmobilienbewertung.de/index.html',saved:consent()});
  assert.equal(x.scripts().length,1);assert.equal(x.w.fbq,undefined);assert.equal(x.w.rndMeasurement.proof().marketingConsent,false);
});
test('localhost and deployment previews remain provider-free even after accepting all',async t=>{
  for(const url of ['http://127.0.0.1:8766/restnutzungsdauergutachten-hannover.html','https://preview.example/restnutzungsdauergutachten-hannover.html']) {
    const x=await setup(t,{url});x.choose('all');assert.deepEqual(x.scripts(),[]);
    assert.equal(x.w.rndMeasurement.proof().marketingConsent,false);assert.equal(x.w.rndMeasurement.proof().analyticsConsent,false);
  }
});
test('our GA events use sanitized URLs and drop personal, property and financial values',async t=>{
  const x=await setup(t,{saved:consent()});
  x.w.rndMeasurement.event('form_step',{step:2,email:'private@example.com',value:800000,baujahr:'1975',name:'SECRET'});
  x.w.rndMeasurement.event('unapproved_event',{secret:'PRIVATE'});
  const event=x.commands().filter(c=>c[0]==='event' && c[1]==='form_step')[0];
  assert.deepEqual(Object.keys(event[2]).sort(),['form_name','page_location','page_referrer','send_to','step']);
  assert.ok(!JSON.stringify(x.commands()).includes('?'));assert.ok(!JSON.stringify(x.commands()).includes('SECRET'));
  assert.ok(!JSON.stringify(x.commands()).includes('800000'));assert.ok(!x.commands().some(c=>c[1]==='unapproved_event'));
});
test('accepted inquiry produces one browser Lead and one GA lead with stable Meta eventID',async t=>{
  const x=await setup(t,{saved:consent()});const id='b30447b5-8b42-4c13-821d-7472c5eb089a';
  const proof=x.w.rndMeasurement.submission(id);assert.equal(proof.eventId,id);assert.equal(proof.consentVersion,VERSION);
  x.w.rndMeasurement.accepted(id,{ok:true});x.w.rndMeasurement.accepted(id,{ok:true});
  x.w.gtag('event','generate_lead');x.w.trackLead('generate_lead','Lead');
  assert.equal(x.leads().length,1);assert.equal(x.metaLeads().length,1);assert.equal(x.metaLeads()[0][4].eventID,id);
  assert.deepEqual(clean(x.metaLeads()[0][3]),{});
});
test('failed, rejected and designated test inquiries never create browser conversion events',async t=>{
  const x=await setup(t,{saved:consent()});
  for(const result of [{ok:false},{ok:true,accepted:false},{ok:true,testMode:true}]) {
    const id=JSON.stringify(result);x.w.rndMeasurement.submission(id);x.w.rndMeasurement.accepted(id,result);
  }
  assert.equal(x.leads().length,0);assert.equal(x.metaLeads().length,0);
});
test('granting consent after submission does not retroactively measure the inquiry',async t=>{
  const x=await setup(t);x.w.rndMeasurement.submission('pending');x.choose('all');x.w.rndMeasurement.accepted('pending',{ok:true});
  assert.equal(x.leads().length,0);assert.equal(x.metaLeads().length,0);
});
test('revocation clears tracking cookies and queues, disables own calls, and invalidates pending leads',async t=>{
  const x=await setup(t,{saved:consent()});
  for(const pair of ['_ga=test','_ga_XS9EQ5RSRC=test','_fbp=fb.1.1789060000000.12345','_fbc=fb.1.1789060000000.click'])x.d.cookie=pair+';path=/';
  x.w.rndMeasurement.submission('pending');x.choose('none');x.w.rndMeasurement.event('form_step',{step:3});x.w.rndMeasurement.accepted('pending',{ok:true});
  assert.ok(!x.d.cookie.includes('_ga='));assert.ok(!x.d.cookie.includes('_fbp='));assert.ok(!x.d.cookie.includes('_fbc='));
  assert.equal(x.w['ga-disable-G-XS9EQ5RSRC'],true);assert.equal(x.leads().length,0);assert.equal(x.metaLeads().length,0);
  assert.deepEqual(clean(x.meta()),[['consent','revoke']]);
  x.choose('all');assert.equal(x.scripts().length,2);assert.equal(x.w['ga-disable-G-XS9EQ5RSRC'],false);
});
test('grant changes invalidate an in-flight request even when a purpose stays granted',async t=>{
  const x=await setup(t,{saved:consent()});x.w.rndMeasurement.submission('pending');x.purposes(true,false);x.w.rndMeasurement.accepted('pending',{ok:true});
  assert.equal(x.leads().length,0);assert.equal(x.metaLeads().length,0);
});
test('advertising cookies and click IDs enter the submission only after marketing consent',async t=>{
  const x=await setup(t,{url:'https://www.3dimmobilienbewertung.de/restnutzungsdauergutachten-hannover.html?fbclid=allowed-click'});
  const denied=x.w.rndMeasurement.submission('denied');assert.equal('fbp' in denied,false);assert.equal('fbc' in denied,false);
  x.purposes(false,true);const granted=x.w.rndMeasurement.submission('granted');assert.match(granted.fbc,/^fb\.1\.\d{13}\.allowed-click$/);
  assert.ok(!x.d.cookie.includes('_fbc='));assert.ok(!granted.seite.includes('?'));
});
test('another tab revoking consent is recognized on focus',async t=>{
  const x=await setup(t,{saved:consent()});x.w.rndMeasurement.submission('pending');
  x.d.cookie=KEY+'='+encodeURIComponent(JSON.stringify(consent({analytics:false,marketing:false,id:'b30447b5-8b42-4c13-821d-7472c5eb089a'})))+';path=/';
  x.w.dispatchEvent(new x.w.Event('focus'));x.w.rndMeasurement.accepted('pending',{ok:true});
  assert.equal(x.w.rndMeasurement.proof().marketingConsent,false);assert.equal(x.leads().length,0);assert.equal(x.metaLeads().length,0);
});
test('consent expiration actively disables loaded providers in a long-lived tab',async t=>{
  let clock=Date.now(), scheduled;
  const x=await setup(t,{saved:consent({at:clock-180*864e5+1000}),before:w=>{
    w.Date.now=()=>clock;w.setTimeout=callback=>{scheduled=callback;return 1;};w.clearTimeout=()=>{};
  }});
  assert.equal(x.scripts().length,2);clock+=2000;scheduled();
  assert.equal(x.w.rndMeasurement.proof().analyticsConsent,false);assert.equal(x.w.rndMeasurement.proof().marketingConsent,false);
  assert.equal(x.w['ga-disable-G-XS9EQ5RSRC'],true);assert.equal(x.d.querySelector('#cookie-banner').hidden,false);
});
test('legacy fetch adapter measures accepted contact once in GA, never Meta',async t=>{
  const x=await setup(t,{saved:consent()});
  await x.w.fetch('/api/contact',{method:'POST',body:JSON.stringify({name:'Legacy',email:'private@example.com'})});
  await new Promise(resolve=>setImmediate(resolve));
  const posted=JSON.parse(x.calls[0].init.body);assert.equal(posted.marketingConsent,false);assert.equal('eventId' in posted,false);
  assert.equal(x.leads().length,1);assert.equal(x.metaLeads().length,0);
});
test('legacy rejected/honeypot responses and HTTP failures never count as leads',async t=>{
  for(const options of [{response:{ok:false}},{response:{ok:true,accepted:false}},{status:500}]) {
    const x=await setup(t,{saved:consent(),...options});await x.w.fetch('/api/contact',{method:'POST',body:'{}'});
    await new Promise(resolve=>setImmediate(resolve));assert.equal(x.leads().length,0);assert.equal(x.metaLeads().length,0);
  }
});
test('fetch adapter never modifies unrelated URLs, origins or the new RND contract',async t=>{
  const x=await setup(t,{saved:consent()});
  for(const url of ['https://other.example/api/contact','/api/contact-extra','/other?target=/api/contact']) {
    await x.w.fetch(url,{method:'POST',body:'{}'});assert.equal(x.calls.at(-1).init.body,'{}');
  }
  const own=JSON.stringify({formId:'rnd-v2'});await x.w.fetch('/api/contact',{method:'POST',body:own});assert.equal(x.calls.at(-1).init.body,own);
  assert.equal(x.leads().length,0);
});
