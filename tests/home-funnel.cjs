'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function element(value=''){
  return {value,hidden:false,disabled:false,textContent:'',style:{},dataset:{},attrs:{},listeners:{},
    classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},
    addEventListener(k,f){this.listeners[k]=f;},focus(){this.focused=true;},setCustomValidity(m){this.invalid=m;},
    checkValidity(){return !this.invalid;},reportValidity(){},querySelector(){return this.heading;}};
}
function harness(fetch){
  const ids=Object.fromEntries(['wcBar','wcLbl','wcSubmit','wcError','wcOrt','wcZeit','wcName','wcMail','wcTel','wcSummary','wcOrtNext'].map(id=>[id,element()]));
  ids.wcName.value=' Test Person ';ids.wcMail.value='test@example.invalid';ids.wcError.hidden=true;
  const steps=['1','2','3','4','done'].map(step=>Object.assign(element(),{dataset:{step},heading:element()}));
  const opts=[['objekt','Einfamilienhaus'],['anlass','Kauf / Verkauf']].map(([field,val])=>Object.assign(element(),{dataset:{field,val}}));
  const backs=[element(),element(),element()];const progress=element();const card=element();
  card.querySelectorAll=s=>({'.wc-step':steps,'.wc-opt':opts,'[data-back]':backs})[s];
  card.querySelector=()=>progress;let expire;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/home-funnel.js'),'utf8'),{document:{querySelector:()=>card,getElementById:id=>ids[id]},fetch,AbortController,setTimeout:f=>{expire=f;return 1;},clearTimeout(){}});
  const start=()=>{opts[0].listeners.click();opts[1].listeners.click();ids.wcOrt.value=' Hannover ';ids.wcZeit.value='Innerhalb eines Monats';ids.wcOrtNext.listeners.click();};
  return {ids,steps,opts,backs,card,progress,start,send:()=>ids.wcSubmit.listeners.click(),expire:()=>expire()};
}
(async()=>{
 let calls=0,body;
 const h=harness(async(url,options)=>{calls++;assert.equal(url,'/api/contact');body=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true})};});
 assert.equal(h.progress.attrs['aria-valuenow'],'1');h.start();
 assert.equal(h.progress.attrs['aria-valuenow'],'4');
 assert.equal(h.ids.wcSummary.textContent,'Einfamilienhaus · Kauf / Verkauf · Hannover · Innerhalb eines Monats');
 h.backs[2].listeners.click();assert.equal(h.steps[2].hidden,false);assert.equal(h.ids.wcZeit.value,'Innerhalb eines Monats');h.ids.wcOrtNext.listeners.click();
 const p=h.send();await h.send();assert.equal(calls,1);await p;
 assert.equal(body.name,'Test Person');assert.equal(body.ort,'Hannover');assert.equal(body.zeitrahmen,'Innerhalb eines Monats');
 assert.deepEqual(Object.keys(body).sort(),['name','email','phone','objekt','anlass','ort','zeitrahmen','message'].sort());
 assert.equal(h.steps[4].hidden,false);assert.equal(h.steps[4].heading.focused,true);
 assert.equal(h.card.attrs['aria-busy'],undefined);
 console.log('PASS: four steps, summary, back navigation, payload, duplicate guard, confirmed success and focus');
 for(const value of ['','   ']){const x=harness(()=>assert.fail('No request for invalid name'));x.start();x.ids.wcName.value=value;await x.send();assert.equal(x.ids.wcName.focused,true);}
 const invalid=harness(()=>assert.fail('No request for invalid email'));invalid.start();invalid.ids.wcMail.value='wrong';await invalid.send();assert.equal(invalid.ids.wcMail.focused,true);
 for(const fetch of [async()=>({ok:false,json:async()=>({ok:true})}),async()=>({ok:true,json:async()=>({ok:false})}),async()=>({ok:true,json:async()=>{throw Error('JSON');}}),async()=>{throw Error('network');}]){
   const x=harness(fetch);x.start();await x.send();assert.equal(x.steps[3].hidden,false);assert.equal(x.steps[4].hidden,true);assert.equal(x.ids.wcError.hidden,false);assert.equal(x.ids.wcMail.value,'test@example.invalid');assert.equal(x.ids.wcSubmit.disabled,false);assert.equal(x.ids.wcError.focused,true);
 }
 const timeout=harness((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout')))));
 timeout.start();const waiting=timeout.send();timeout.expire();await waiting;assert.equal(timeout.ids.wcError.hidden,false);assert.equal(timeout.ids.wcSubmit.disabled,false);
 console.log('PASS: empty/whitespace/email validation, HTTP failure even with ok:true, unconfirmed/invalid JSON, network failure, timeout, preserved input and retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
