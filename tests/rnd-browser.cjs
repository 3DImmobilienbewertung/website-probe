/* Run against the local static preview. All API/provider calls are intercepted.
 * RND_PLAYWRIGHT_MODULE can point to a preinstalled Playwright module.
 */
const {chromium} = require(process.env.RND_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const origin='http://127.0.0.1:8766';
const url=origin+'/restnutzungsdauergutachten-hannover.html';
const artifacts=process.env.RND_ARTIFACT_DIR || '/tmp';
let passed=0;
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const external=[], errors=[], posts=[];
    let responseStatus=200, responseBody={ok:true}, responseDelay=0;
    await context.route('**/*',async route=>{
      const req=route.request();
      if (req.url().startsWith(origin+'/api/contact')) {
        posts.push(req.postDataJSON());
        if (responseDelay) await new Promise(resolve=>setTimeout(resolve,responseDelay));
        return route.fulfill({status:responseStatus,contentType:'application/json',body:JSON.stringify(responseBody)});
      }
      if (!req.url().startsWith(origin)) {external.push(req.url());return route.abort();}
      await route.continue();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const go=async()=>{await page.goto(url);await page.locator('#leadForm').waitFor({state:'visible'});if(await page.locator('#cookie-banner').isVisible())await page.locator('#cookie-banner [data-choice="none"]').click();};
    const next=async()=>{await page.waitForTimeout(360);await page.locator('#next').click();};
    const toContact=async(usage='vermietet',ownership='Geerbt – Teil einer Erbengemeinschaft')=>{
      await go();await page.locator('[value="'+usage+'"]').check();await next();
      await page.locator('#objekt').selectOption('Mehrfamilienhaus');await page.locator('#baujahr').selectOption('1975–1984');await page.locator('#ort').fill('30900');await next();
      await page.locator('#eigentum').selectOption(ownership);await page.locator('#zustand').selectOption('Weiß ich noch nicht');await next();
    };
    const contact=async()=>{await page.locator('#name').fill('Test Eigentümer');await page.locator('#phone').fill('0174 1234567');await page.locator('#email').fill('test@example.com');};
    await check('desktop/mobile layouts, no horizontal overflow or broken images',async()=>{
      for(const width of [320,375,390,768,1440,1920]){
        await page.setViewportSize({width,height:1000});await go();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width));
        await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode();}});
      }
      await page.setViewportSize({width:1440,height:1000});await go();
      await page.screenshot({path:path.join(artifacts,'rnd-desktop.png'),fullPage:true});
      await page.screenshot({path:path.join(artifacts,'rnd-desktop-hero.png')});
      await page.setViewportSize({width:390,height:844});await go();
      await page.screenshot({path:path.join(artifacts,'rnd-mobile.png'),fullPage:true});
      await page.screenshot({path:path.join(artifacts,'rnd-mobile-hero.png')});
    });
    await check('first step validates; private self-use is reversible',async()=>{
      await go();await next();assert.match(await page.locator('#formError').innerText(),/Nutzung/);
      await page.locator('[value="privat"]').check();assert.equal(await page.locator('#next').isDisabled(),true);assert.equal(await page.locator('#privateNote').isVisible(),true);
      await page.locator('[value="geplant"]').check();assert.equal(await page.locator('#next').isEnabled(),true);await next();assert.match(await page.locator('#stepLabel').innerText(),/Schritt 2/);
    });
    await check('missing building data, ZIP and newer age handled',async()=>{
      await next();assert.equal(await page.locator('#objekt').getAttribute('aria-invalid'),'true');
      await page.locator('#objekt').selectOption('Eigentumswohnung');await page.locator('#baujahr').selectOption('1985 oder jünger');assert.equal(await page.locator('#yearNote').isVisible(),true);
      await page.locator('#ort').fill('00000');await next();assert.match(await page.locator('#formError').innerText(),/Postleitzahl/);
      await page.locator('#ort').fill('30900');assert.equal(await page.locator('#ort').inputValue(),'30900');await next();assert.match(await page.locator('#stepLabel').innerText(),/Schritt 3/,JSON.stringify(await page.locator('[data-step="2"] input, [data-step="2"] select').evaluateAll(nodes=>nodes.map(el=>({id:el.id,value:el.value,message:el.validationMessage,pattern:el.pattern})))));
    });
    await check('inheritance independent of usage, summary and contact validation',async()=>{
      await toContact('betrieblich');await page.locator('.summary summary').click();assert.match(await page.locator('#answerSummary').innerText(),/Betrieblich genutzt/);assert.match(await page.locator('#answerSummary').innerText(),/Erbengemeinschaft/);
      await page.locator('#submit').click();assert.equal(await page.locator('#name').getAttribute('aria-invalid'),'true');
      await contact();await page.locator('#phone').fill('abcdef1234567');await page.locator('#submit').click();assert.match(await page.locator('#formError').innerText(),/Telefonnummer/);
      await page.locator('#phone').fill('0174 1234567');await page.locator('#email').fill('bad');await page.locator('#submit').click();assert.match(await page.locator('#formError').innerText(),/E-Mail/);
      assert.equal(posts.length,0);
    });
    await check('HTTP/application failures retain data, retries reuse ID; success only after acceptance',async()=>{
      await contact();responseStatus=503;await page.locator('#submit').click();await page.locator('#formError').waitFor({state:'visible'});
      assert.equal(await page.locator('#email').inputValue(),'test@example.com');assert.equal(await page.locator('#formSuccess').isHidden(),true);
      responseStatus=200;responseBody={ok:false};await page.locator('#submit').click();await page.locator('#formError').waitFor({state:'visible'});assert.equal(await page.locator('#formSuccess').isHidden(),true);
      responseBody={ok:true,accepted:false};await page.locator('#submit').click();await page.locator('#formError').waitFor({state:'visible'});assert.equal(await page.locator('#formSuccess').isHidden(),true);
      responseBody={ok:true};responseDelay=500;
      await page.locator('#submit').evaluate(el=>{el.click();el.click();});await page.locator('#formSuccess').waitFor({state:'visible'});
      assert.equal(posts.length,4);assert.equal(new Set(posts.map(x=>x.requestId)).size,1);
      assert.ok(posts.every(x=>x.marketingConsent===false));assert.ok(posts.every(x=>!x.fbp&&!x.fbc&&!x.eventId));
      assert.equal(posts[3].nutzung,'betrieblich');assert.match(posts[3].message,/Erbengemeinschaft/);assert.ok(!posts[3].message.includes('Potenzial:'));
      responseDelay=0;
    });
    await check('back navigation retains data; rapid next does not skip a step',async()=>{
      await toContact();await page.locator('#back').click();assert.equal(await page.locator('#eigentum').inputValue(),'Geerbt – Teil einer Erbengemeinschaft');assert.equal(await page.locator('#inheritanceNote').isVisible(),true);
      await page.waitForTimeout(360);await page.locator('#next').evaluate(el=>{el.click();el.click();});assert.match(await page.locator('#stepLabel').innerText(),/Schritt 4/);
    });
    await check('inherited campaign message has no automatic AfA reset claim',async()=>{
      await page.goto(url+'?utm_content=erbe');assert.match(await page.locator('h1').innerText(),/geerbt/);assert.match(await page.locator('.hero-sub').innerText(),/nicht automatisch neu/);
      await page.goto(url+'?utm_content=%3Cscript%3E');assert.match(await page.locator('h1').innerText(),/älteres Gebäude/);
    });
    await check('preview stays provider-free even with legacy consent; settings accessible',async()=>{
      await context.addCookies([{name:'3dim_consent',value:JSON.stringify({analytics:true}),url:origin},{name:'_fbp',value:'legacy-cookie',url:origin}]);await go();
      assert.deepEqual(external,[]);assert.equal(await page.evaluate(()=>typeof window.fbq),'undefined');assert.equal(await page.evaluate(()=>window.rndMeasurement.proof().marketingConsent),false);assert.equal(await page.evaluate(()=>window.rndMeasurement.proof().analyticsConsent),false);
      await page.locator('#cookieSettings').click();assert.equal(await page.locator('dialog').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);
    });
    await check('no JavaScript fallback provides a telephone contact',async()=>{
      const noJs=await browser.newContext({javaScriptEnabled:false});await noJs.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());const p=await noJs.newPage();await p.goto(url);assert.match(await p.locator('noscript').innerText(),/telefonisch/);await noJs.close();
    });
    await check('no runtime errors',async()=>assert.deepEqual(errors,[]));
    console.log(JSON.stringify({passed,screenshots:[path.join(artifacts,'rnd-desktop.png'),path.join(artifacts,'rnd-mobile.png')],liveSubmissions:0,externalRequests:external.length}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
