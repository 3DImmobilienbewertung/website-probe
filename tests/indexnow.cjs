const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {buildPayload,submit}=require('../scripts/submit-indexnow.cjs');
const payload=buildPayload();
assert.equal(payload.urlList.length,50);
assert.equal(new Set(payload.urlList).size,50);
const keyReply={status:200,text:async()=>payload.key};
const one={...payload,urlList:['https://www.3dimmobilienbewertung.de/']};
const liveReply={status:200,text:async()=>fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')};
(async()=>{
 let calls=0;await assert.rejects(submit(one,async()=>{calls++;return {status:404,text:async()=>''}}),/live key missing/);assert.equal(calls,1);
 calls=0;await assert.rejects(submit(one,async()=>++calls===1?keyReply:{status:200,text:async()=>'stale'}),/production differs/);assert.equal(calls,2);
 for(const status of [200,202,403,429,500]){
  calls=0;let body;
  const mock=async(url,options)=>{calls++;if(calls===1)return keyReply;if(calls===2)return liveReply;assert.equal(url,'https://api.indexnow.org/indexnow');assert.equal(options.method,'POST');body=JSON.parse(options.body);return {status}};
  if(status===200||status===202){const message=await submit(one,mock);assert.match(message,/not confirmation of indexing/);}else await assert.rejects(submit(one,mock),/do not automatically repeat/);
  assert.equal(calls,3);assert.deepEqual(body,one);
 }
 console.log('PASS IndexNow: canonical release scope, missing key/stale deployment refused, 200/202 correctly labelled, errors do not retry; no network calls');
})().catch(e=>{console.error(e);process.exitCode=1});
