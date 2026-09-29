/* Explicit post-deployment submission. Default invocation is an offline dry run. */
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const ORIGIN='https://www.3dimmobilienbewertung.de';
const KEY='0cabf24943124b9c8fae6f69959f1d0b';
function buildPayload(){
 const pages=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/seo-release-pages.json'),'utf8'));
 const sitemap=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
 const allowed=new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]));
 const urlList=[...new Set(pages.map(p=>ORIGIN+'/'+(p==='index.html'?'':p)))];
 if(!urlList.length||urlList.length>10000)throw Error('Invalid URL count');
 for(const url of urlList){const u=new URL(url);if(u.origin!==ORIGIN||u.search||u.hash||!allowed.has(url))throw Error('URL outside canonical release sitemap: '+url);}
 if(fs.readFileSync(path.join(ROOT,KEY+'.txt'),'utf8').trim()!==KEY)throw Error('Local key mismatch');
 return {host:new URL(ORIGIN).host,key:KEY,keyLocation:ORIGIN+'/'+KEY+'.txt',urlList};
}
async function submit(payload,request=fetch){
 const options={redirect:'error',signal:AbortSignal.timeout(15000)};
 const proof=await request(payload.keyLocation,options);
 if(proof.status!==200||(await proof.text()).trim()!==KEY)throw Error('Not submitted: live key missing. Deploy and verify the approved release first.');
 // Refuse to notify search engines about a stale or partly deployed release.
 for(const url of payload.urlList){
  const response=await request(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(response.status!==200)throw Error('Not submitted: page is not live: '+url);
  const live=await response.text();
  const localPath=new URL(url).pathname==='/'?'index.html':new URL(url).pathname.slice(1);
  const local=fs.readFileSync(path.join(ROOT,localPath),'utf8');
  if(live!==local)throw Error('Not submitted: production differs from approved local release: '+url);
 }
 const response=await request('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(20000)});
 if(![200,202].includes(response.status))throw Error('IndexNow returned HTTP '+response.status+'; do not automatically repeat the submission.');
 return response.status===202?'Received; key verification pending. This is not confirmation of indexing.':'URLs received. This is not confirmation of indexing or ranking.';
}
if(require.main===module){
 (async()=>{const args=process.argv.slice(2);if(args.some(a=>a!=='--submit'))throw Error('Usage: node scripts/submit-indexnow.cjs [--submit]');const payload=buildPayload();if(args.includes('--submit'))console.log(await submit(payload));else console.log(JSON.stringify({mode:'dry-run',submitted:false,count:payload.urlList.length,urlList:payload.urlList},null,2));})().catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={buildPayload,submit};
