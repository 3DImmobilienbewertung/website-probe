const {test} = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const handler = require('../api/contact');
const base = {
  formId:'rnd-v2', name:'Test Eigentümer', email:'test@example.com', phone:'0174 1234567',
  ort:'30900', objekt:'Mehrfamilienhaus', anlass:'Restnutzungsdauergutachten – Rückruf',
  message:'Testanfrage – keine echte Zustellung', website:'', nutzung:'vermietet',
  baujahr:'1975–1984', eigentum:'Geerbt – Teil einer Erbengemeinschaft', zustand:'Weiß ich noch nicht',
  requestId:'b30447b5-8b42-4c13-821d-7472c5eb089a', marketingConsent:false
};
function optIn(change={}) {
  const saved = {version:'3dim-2026-09-10',id:'e72d053a-1734-42c5-bf3d-1dbab2619c2e',at:Date.now(),analytics:true,marketing:true,...change};
  return {body:{...base,consentVersion:saved.version,consentId:saved.id,consentAt:saved.at,analyticsConsent:true,marketingConsent:true},
    headers:{cookie:'3dim_consent_v2=' + encodeURIComponent(JSON.stringify(saved))}};
}
async function invoke(body, options={}) {
  const originalFetch = global.fetch;
  const originalEnv = {...process.env};
  const calls = [], logs = [];
  const originalLog = console.log, originalError = console.error;
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => logs.push(args.join(' '));
  process.env.RESEND_API_KEY = 'test-not-a-real-key';
  process.env.META_PIXEL_ID = 'test-pixel';
  process.env.META_CAPI_TOKEN = 'test-not-a-real-token';
  delete process.env.META_TEST_EVENT_CODE;
  if (options.testCode) process.env.META_TEST_EVENT_CODE = options.testCode;
  if (options.noKey) delete process.env.RESEND_API_KEY;
  global.fetch = async (url, init) => {
    calls.push({url, init, body:JSON.parse(init.body)});
    const fail = options.failure && options.failure(calls.length, url);
    return {ok:!fail, status:fail ? 503 : 200, text:async () => fail ? 'mock failure' : '{"events_received":1}', json:async () => ({id:'mock-id'})};
  };
  const res = {statusCode:200, data:null, headers:{}, setHeader(key,value){this.headers[key]=value;}, status(code){this.statusCode=code;return this;}, json(data){this.data=data;return this;}, end(){return this;}};
  try { await handler({body,method:options.method || 'POST',headers:{host:'www.3dimmobilienbewertung.de',referer:'https://example.com/?private=no', 'user-agent':'test-agent',...options.headers}}, res); }
  finally {
    global.fetch=originalFetch;console.log=originalLog;console.error=originalError;
    for (const key of ['RESEND_API_KEY','META_PIXEL_ID','META_CAPI_TOKEN','META_TEST_EVENT_CODE']) { if (originalEnv[key] === undefined) delete process.env[key];else process.env[key]=originalEnv[key]; }
  }
  return {res,calls,logs};
}
test('valid RND inquiry: owner + confirmation, no Meta without opt-in', async()=>{
  const {res,calls}=await invoke({...base});
  assert.equal(res.statusCode,200); assert.equal(res.data.ok,true); assert.equal(calls.length,2);
  assert.ok(calls.every(x=>x.url === 'https://api.resend.com/emails'));
  assert.ok(calls[0].init.headers['Idempotency-Key'].endsWith('-owner'));
  assert.ok(calls[1].init.headers['Idempotency-Key'].endsWith('-confirmation'));
  assert.equal(res.data.confirmationSent,true);
  assert.equal(res.data.testMode,false);
});
test('retry uses identical email bodies and idempotency keys',async()=>{
  const first=await invoke({...base}); const retry=await invoke({...base});
  assert.deepEqual(first.calls.map(x=>[x.body,x.init.headers]),retry.calls.map(x=>[x.body,x.init.headers]));
});
test('private self-use, malformed phone/ZIP and missing qualification are rejected server-side',async()=>{
  for (const change of [{nutzung:'privat'},{phone:''},{phone:'call me 1234567'},{ort:'00000'},{ort:'30'},{baujahr:''},{eigentum:'bogus'},{requestId:''},{name:'  '}]) {
    const {res,calls}=await invoke({...base,...change}); assert.equal(res.statusCode,400,JSON.stringify(change));assert.equal(calls.length,0);
  }
});
test('unknown age and commercial usage remain eligible for manual assessment',async()=>{
  const {res}=await invoke({...base,nutzung:'betrieblich',baujahr:'Weiß ich noch nicht'});assert.equal(res.statusCode,200);
});
test('owner mail failure is not success and does not disclose lead data in logs',async()=>{
  const {res,calls,logs}=await invoke({...base},{failure:()=>true});assert.equal(res.statusCode,500);assert.equal(calls.length,1);
  assert.ok(!logs.join(' ').includes(base.email));assert.ok(!logs.join(' ').includes(base.name));
});
test('confirmation failure does not lose an accepted owner inquiry',async()=>{
  const {res,calls}=await invoke({...base},{failure:n=>n===2});assert.equal(res.statusCode,200);assert.equal(calls.length,2);assert.equal(res.data.confirmationSent,false);
});
test('honeypot does not count as accepted lead and never calls providers',async()=>{
  const {res,calls}=await invoke({...base,website:'spam'});assert.equal(res.data.accepted,false);assert.equal(calls.length,0);
});
test('missing credentials return a failure without exposing contact data',async()=>{
  const {res,calls,logs}=await invoke({...base},{noKey:true});assert.equal(res.statusCode,500);assert.equal(calls.length,0);assert.ok(!logs.join(' ').includes(base.email));
});
test('legacy contact forms still work but cannot imply marketing opt-in',async()=>{
  const {res,calls}=await invoke({name:'Legacy Test',email:'legacy@example.com',marketingConsent:true,consentVersion:'rnd-v2'});
  assert.equal(res.statusCode,200);assert.equal(calls.length,2);
});
test('a string or unversioned flag does not authorize CAPI',async()=>{
  for (const consent of [{marketingConsent:'true',consentVersion:'rnd-v2'},{marketingConsent:true},{marketingConsent:true,consentVersion:'legacy'}]) {
    const {calls}=await invoke({...base,...consent});assert.equal(calls.length,2);
  }
});
test('versioned explicit consent enables one generic Meta event, deduplicated by event ID',async()=>{
  const {body,headers}=optIn();
  const {calls,logs}=await invoke({...body,eventId:'untrusted-alternative',fbp:'fb.1.1789060000000.12345',fbc:'fb.1.1789060000000.click-id'},{headers});
  const events=calls.filter(x=>x.url.startsWith('https://graph.facebook.com/'));
  assert.equal(events.length,1); const event=events[0].body.data[0];
  assert.equal(event.event_id,base.requestId);assert.equal(event.event_name,'Lead');
  assert.deepEqual(event.custom_data,{content_name:'Restnutzungsdauergutachten'});
  assert.ok(!event.event_source_url.includes('?'));
  assert.deepEqual(Object.keys(event.user_data).sort(),['client_user_agent','em','fbc','fbp','ph']);
  assert.equal(event.user_data.em,crypto.createHash('sha256').update(base.email).digest('hex'));
  assert.equal(event.user_data.ph,crypto.createHash('sha256').update('491741234567').digest('hex'));
  assert.ok(!JSON.stringify(event).includes(base.email));
  assert.ok(!JSON.stringify(event).includes(base.baujahr));
  assert.ok(logs.some(x=>x.includes('"capiStatus":"accepted"')));
  assert.ok(!logs.join(' ').includes(base.email));
});
test('a matching valid cookie is required; body claims alone never authorize CAPI',async()=>{
  const {body,headers}=optIn();
  for (const change of [{headers:{}},{headers:{cookie:'3dim_consent_v2=not-json'}},{headers,body:{...body,consentId:base.requestId}},{headers,body:{...body,consentAt:0}},{headers,body:{...body,marketingConsent:'true'}}]) {
    const result=await invoke(change.body || body,{headers:change.headers});assert.equal(result.calls.length,2);
  }
});
test('expired, future, outdated, invalid and rejected consent cannot authorize CAPI',async()=>{
  for (const change of [{at:Date.now()-181*864e5},{at:Date.now()+600000},{version:'old'},{id:'00000000-0000-0000-0000-000000000000'},{marketing:false}]) {
    const {body,headers}=optIn(change);const {calls}=await invoke(body,{headers});assert.equal(calls.length,2);
  }
});
test('a consent receipt keeps retry bodies stable and excludes advertising IDs from mail',async()=>{
  const {body,headers}=optIn();body.fbp='fb.1.1789060000000.12345';
  const first=await invoke(body,{headers}), second=await invoke(body,{headers});
  assert.deepEqual(first.calls.filter(x=>x.url.includes('resend')).map(x=>x.body),second.calls.filter(x=>x.url.includes('resend')).map(x=>x.body));
  assert.ok(first.calls[0].body.html.includes(body.consentId));
  assert.ok(!first.calls[0].body.html.includes(body.fbp));
});
test('malformed advertising identifiers and ambiguous phone prefixes are omitted',async()=>{
  const {body,headers}=optIn();
  const {calls}=await invoke({...body,phone:'174 1234567',fbp:'email@example.com',fbc:'bad'},{headers});
  const user=calls.find(x=>x.url.includes('facebook')).body.data[0].user_data;
  assert.ok(!('ph' in user));assert.ok(!('fbp' in user));assert.ok(!('fbc' in user));
});
test('CAPI failure never turns an accepted owner inquiry into a failed submission',async()=>{
  const {body,headers}=optIn();const {res,calls,logs}=await invoke(body,{headers,failure:(_n,url)=>url.includes('facebook')});
  assert.equal(res.statusCode,200);assert.equal(res.data.confirmationSent,true);assert.equal(calls.length,3);
  assert.ok(logs.some(x=>x.includes('"capiStatus":"failed"')));
});
test('clearly labeled company test lead stays out of production CAPI without a test code',async()=>{
  const {body,headers}=optIn();const {res,calls}=await invoke({...body,email:'info@3dimmobilienbewertung.de',testMode:true},{headers});
  assert.equal(res.data.testMode,true);assert.equal(calls.length,2);
  assert.ok(calls[0].body.subject.startsWith('[TEST – KEIN KUNDENLEAD]'));
  assert.ok(calls[1].body.subject.startsWith('[TEST]'));
});
test('company test lead uses Meta test_event_code only with matching consent',async()=>{
  const {body,headers}=optIn();const {calls}=await invoke({...body,email:'info@3dimmobilienbewertung.de',testMode:true},{headers,testCode:'TEST123'});
  assert.equal(calls.find(x=>x.url.includes('facebook')).body.test_event_code,'TEST123');
  const declined=await invoke({...base,email:'info@3dimmobilienbewertung.de',testMode:true},{testCode:'TEST123'});
  assert.equal(declined.calls.length,2);
});
test('non-company email cannot claim the designated test mode',async()=>{
  const {res,calls}=await invoke({...base,testMode:true});
  assert.equal(res.data.testMode,false);assert.ok(!calls[0].body.subject.startsWith('[TEST'));
});
test('foreign origins are rejected and matching origins receive no wildcard CORS',async()=>{
  const foreign=await invoke(base,{headers:{origin:'https://attacker.example'}});
  assert.equal(foreign.res.statusCode,403);assert.equal(foreign.calls.length,0);
  const own=await invoke(base,{headers:{origin:'https://www.3dimmobilienbewertung.de'}});
  assert.equal(own.res.statusCode,200);assert.equal(own.res.headers['Access-Control-Allow-Origin'],'https://www.3dimmobilienbewertung.de');
  assert.equal(own.res.headers['Cache-Control'],'no-store');
});
test('method handling',async()=>{
  assert.equal((await invoke({}, {method:'GET'})).res.statusCode,405);
  assert.equal((await invoke({}, {method:'OPTIONS'})).res.statusCode,200);
});
