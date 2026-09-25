/* Local integration harness: actual contact handler, fake mail provider, no tracking.
   Never use this server in production. Binds only to loopback; no real credentials. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4'};
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'none'");
  if (url.pathname === '/assets/consent.js') {res.setHeader('Content-Type','text/javascript');return res.end('/* Tracking disabled in isolated test harness only. */');}
  if (url.pathname === '/api/contact' && req.method === 'POST') {
    let raw='';for await (const chunk of req) {raw+=chunk;if(raw.length>20000){res.statusCode=413;return res.end();}}
    let body;try{body=JSON.parse(raw);}catch{res.statusCode=400;return res.end('{}');}
    const sandbox = {module:{exports:{}},require,process:{env:{RESEND_API_KEY:'test-only-not-a-real-key'}},console:{log(){},error(){}},Date,
      fetch:async destination=>{
        if(destination!=='https://api.resend.com/emails')throw Error('Unexpected external destination blocked');
        return {ok:!String(body.email).startsWith('failure@'),status:503,json:async()=>({id:'local-test'}),text:async()=> 'Simulated provider outage'};
      }};
    vm.runInNewContext(fs.readFileSync(path.join(root,'api/contact.js'),'utf8'),sandbox);
    res.status=n=>{res.statusCode=n;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
    return sandbox.module.exports({method:req.method,headers:req.headers,body},res);
  }
  if (req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end();}
  let filename;try{filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch{res.statusCode=400;return res.end();}
  if(!filename.startsWith(root+path.sep)&&filename!==root){res.statusCode=403;return res.end();}
  if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
  if(!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
  if(req.method==='HEAD')return res.end();fs.createReadStream(filename).pipe(res);
});
server.listen(8768,'127.0.0.1',()=>console.log('Isolated preview: http://127.0.0.1:8768 — outbound mail/tracking disabled'));
