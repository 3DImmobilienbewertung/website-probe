// DOM integration tests for the actual page + consent + form controller.
// No external SDK, network request, email or live lead is created.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.RND_JSDOM_MODULE || 'jsdom');
const root=path.join(__dirname,'..');
async function setup(t,query='') {
  const dom=new JSDOM(fs.readFileSync(path.join(root,'restnutzungsdauergutachten-hannover.html'),'utf8'),{
    url:'http://127.0.0.1:8766/restnutzungsdauergutachten-hannover.html'+query,runScripts:'outside-only'
  });
  t.after(()=>dom.window.close());const w=dom.window,d=w.document,posts=[];
  if(d.readyState==='loading')await new Promise(resolve=>d.addEventListener('DOMContentLoaded',resolve,{once:true}));
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  let response={ok:true,confirmationSent:true},status=200,clock=Date.now();
  w.Date.now=()=>clock;
  w.fetch=async(_url,init)=>{posts.push(JSON.parse(init.body));return {ok:status===200,json:async()=>response};};
  w.eval(fs.readFileSync(path.join(root,'assets/consent.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(root,'assets/rnd-landingpage.js'),'utf8'));
  const field=id=>d.getElementById(id);
  const fill=(id,value)=>{field(id).value=value;field(id).dispatchEvent(new w.Event('input',{bubbles:true}));field(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
  const usage=value=>{const input=d.querySelector('[name=nutzung][value="'+value+'"]');input.checked=true;input.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const next=()=>{clock+=400;field('next').click();};
  const contact=()=>{
    usage('vermietet');next();fill('objekt','Mehrfamilienhaus');fill('baujahr','1975–1984');fill('ort','30900');next();
    fill('eigentum','Geerbt – Teil einer Erbengemeinschaft');fill('zustand','Weiß ich noch nicht');next();
    fill('name','Test Eigentümer');fill('phone','0174 1234567');fill('email','test@example.com');
  };
  const submit=async()=>{field('leadForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));};
  return {w,d,field,fill,usage,next,contact,submit,posts,response:(body,code=200)=>{response=body;status=code;}};
}
test('required usage, private-use exclusion and reversal work in the actual page',async t=>{
  const x=await setup(t);x.next();assert.equal(x.field('formError').hidden,false);assert.match(x.field('formError').textContent,/Nutzung/);
  x.usage('privat');assert.equal(x.field('next').disabled,true);assert.equal(x.field('privateNote').hidden,false);
  x.usage('geplant');x.next();assert.match(x.field('stepLabel').textContent,/Schritt 2/);
});
test('year and inheritance guidance, summary and back navigation preserve qualifications',async t=>{
  const x=await setup(t);x.contact();assert.match(x.field('answerSummary').textContent,/Erbengemeinschaft/);
  assert.match(x.field('answerSummary').textContent,/1975–1984/);x.field('back').click();assert.equal(x.field('inheritanceNote').hidden,false);
  x.field('back').click();x.fill('baujahr','1985 oder jünger');assert.equal(x.field('yearNote').hidden,false);
  x.fill('ort','00000');x.next();assert.match(x.field('formError').textContent,/Postleitzahl/);assert.equal(x.posts.length,0);
});
test('invalid contact input does not reach the endpoint',async t=>{
  const x=await setup(t);x.contact();x.fill('phone','abc1234567');await x.submit();assert.equal(x.posts.length,0);assert.match(x.field('formError').textContent,/Telefonnummer/);
  x.fill('phone','0174 1234567');x.fill('email','bad');await x.submit();assert.equal(x.posts.length,0);assert.match(x.field('formError').textContent,/E-Mail/);
});
test('HTTP, application and honeypot failures retain inputs and reuse the request ID on retry',async t=>{
  const x=await setup(t);x.contact();
  for(const [body,status] of [[{ok:false},503],[{ok:false},200],[{ok:true,accepted:false},200]]) {
    x.response(body,status);await x.submit();assert.equal(x.field('formSuccess').hidden,true);assert.equal(x.field('email').value,'test@example.com');assert.equal(x.field('formError').hidden,false);
  }
  x.response({ok:true,confirmationSent:true});await x.submit();assert.equal(x.field('formSuccess').hidden,false);assert.equal(x.field('leadForm').hidden,true);
  assert.equal(x.posts.length,4);assert.equal(new Set(x.posts.map(p=>p.requestId)).size,1);
  assert.ok(x.posts.every(p=>p.marketingConsent===false && !p.fbp && !p.fbc));
  await x.submit();assert.equal(x.posts.length,4);
});
test('a changed payload or changed consent receipt gets a new email idempotency key',async t=>{
  const x=await setup(t);x.contact();x.response({ok:false},503);await x.submit();x.fill('name','Korrigierter Test');await x.submit();
  x.d.querySelector('#cookie-banner [data-choice=none]').click();await x.submit();assert.equal(new Set(x.posts.map(p=>p.requestId)).size,3);
});
test('confirmation-mail failure honestly preserves the accepted callback request',async t=>{
  const x=await setup(t);x.contact();x.response({ok:true,confirmationSent:false});await x.submit();
  assert.equal(x.field('formSuccess').hidden,false);assert.match(x.field('confirmationNote').textContent,/konnte nicht versendet/);assert.match(x.field('confirmationNote').textContent,/trotzdem angenommen/);
});
test('repeated submit while awaiting the response sends only one request',async t=>{
  const x=await setup(t);x.contact();
  const pending=x.submit();await x.submit();await pending;assert.equal(x.posts.length,1);
});
test('only the approved inheritance motif changes copy; arbitrary query text never enters it',async t=>{
  const heir=await setup(t,'?utm_content=erbe');assert.match(heir.d.querySelector('h1').textContent,/geerbt/);assert.match(heir.d.querySelector('.hero-sub').textContent,/nicht automatisch neu/);
  const unsafe=await setup(t,'?utm_content=%3Cscript%3E');assert.match(unsafe.d.querySelector('h1').textContent,/älteres Gebäude/);
});
