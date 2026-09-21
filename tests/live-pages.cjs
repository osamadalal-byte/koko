/* Verify the deployed public HTTPS app in fresh, isolated browser profiles. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const base='https://osamadalal-byte.github.io/koko/';
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),url:base,deployedSource:'fdd3f762273b31420a9b67763e25afe1756ad654',scope:'Live HTTPS verification in isolated Chromium and WebKit iPhone profiles. No physical iPhone or external video playback claim.',assets:[],browsers:[]};
async function run(type,options,name){
 const result={name,checks:[]};report.browsers.push(result);let browser;
 try{
  browser=await type.launch();const context=await browser.newContext({...options,serviceWorkers:'allow',acceptDownloads:true});
  context.setDefaultTimeout(20000);const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(base,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
  await page.waitForSelector('[data-action="start"]');assert.equal(await page.evaluate(()=>isSecureContext),true);
  result.checks.push('HTTPS response 200, secure context and app initialization');
  for(const width of [320,375,390]){
   await page.setViewportSize({width,height:844});
   for(const tab of ['today','plan','progress','moves']){
    await page.locator(`.nav [data-tab="${tab}"]`).click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
   }
  }
  assert.equal(await page.locator('.move-card').count(),18);await page.locator('.nav [data-tab="today"]').click();
  await page.screenshot({path:path.join(out,`live-${name}.jpg`),type:'jpeg',quality:45,scale:'css'});
  result.checks.push('All tabs at 320/375/390px; 18 movements');
  const ready=async()=>{await page.locator('#ready-energy').selectOption('normal');await page.locator('#ready-soreness').selectOption('none');await page.locator('#ready-pain').selectOption('no');await page.locator('#readiness-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#session-dialog').open)};
  await page.locator('[data-action="start"]').click();await ready();
  const initial=await page.evaluate(()=>session.remaining);await page.locator('#timer-toggle').click();
  await page.waitForFunction(value=>session.remaining<value,initial);await page.locator('#timer-toggle').click();
  const paused=await page.evaluate(()=>session.remaining);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>session.remaining),paused);
  await page.locator('#session-how').click();assert(await page.locator('#detail-dialog .steps').isVisible());
  await page.locator('[data-close="detail-dialog"]').click();await page.locator('#session-exit').click();
  const saved=await page.evaluate(()=>state.draft.remaining);await page.reload();await page.locator('[data-action="resume"]').click();await ready();
  assert.equal(await page.evaluate(()=>session.remaining),saved);assert.equal(await page.evaluate(()=>session.paused),true);
  await page.screenshot({path:path.join(out,`live-${name}-session.jpg`),type:'jpeg',quality:45,scale:'css'});
  await page.locator('#session-exit').click();result.checks.push('Readiness, real timer, pause, written guidance, saved draft and reload/resume');
  await page.locator('#settings-open').click();const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();
  const download=await downloadPromise;assert.equal(await download.failure(),null);const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(backup.draft.remaining,saved);await page.locator('[data-close="settings-dialog"]').click();result.checks.push('JSON backup download contains saved workout');
  const worker=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;const names=await caches.keys();const name=names.find(n=>n.startsWith('form28::'+reg.scope+'::build-'));if(!name)throw Error('Built release cache missing');const cache=await caches.open(name);return {scope:reg.scope,script:reg.active.scriptURL,cache:name,keys:(await cache.keys()).map(r=>r.url)}});
  assert.equal(worker.scope,base);assert.equal(worker.script,base+'service-worker.js');assert.equal(worker.keys.length,12);
  for(const url of worker.keys)assert(url.startsWith(base),'Cached URL escapes repository scope');
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);result.worker=worker;result.checks.push('Active service worker controls /koko/; all 12 offline assets cached');
  if(name==='chromium'){
   await context.setOffline(true);await page.reload();await page.waitForSelector('[data-action="resume"]');
   assert.equal(await page.evaluate(()=>state.draft.remaining),saved);await page.locator('[data-action="resume"]').click();await ready();
   await page.locator('#timer-toggle').click();await page.waitForFunction(value=>session.remaining<value,saved);
   result.checks.push('Live-origin offline reload, draft restoration and running timer in Chromium');
  }else result.offlineLimit='Live WebKit cache installation verified. WebKit emulated offline reload has a separately documented engine defect; disconnected-origin coverage passed in the release suite. Physical iPhone airplane mode remains manual.';
  assert.deepEqual(errors,[]);result.status='passed';
 }catch(error){result.status='failed';result.error=error.stack;process.exitCode=1}
 finally{if(browser)await browser.close()}
}
(async()=>{
 const files=fs.readdirSync(path.join(root,'dist'),{recursive:true}).filter(file=>fs.statSync(path.join(root,'dist',file)).isFile()&&file!=='.nojekyll');
 for(const file of files){
  const response=await fetch(new URL(file,base),{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,`Live asset ${file}`);
  const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,fs.readFileSync(path.join(root,'dist',file)),`Deployed bytes differ: ${file}`);
  if(file.endsWith('.js'))assert.match(response.headers.get('content-type'),/javascript/);
  report.assets.push({file,status:response.status,bytes:bytes.length});
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist','manifest.webmanifest'),'utf8'));assert.equal(new URL(manifest.scope,base).href,base);assert.equal(new URL(manifest.start_url,base).href,base+'index.html');assert.equal(manifest.display,'standalone');
 await run(chromium,{viewport:{width:390,height:844}},'chromium');await run(webkit,devices['iPhone 13'],'webkit-iphone');
})().catch(error=>{report.error=error.stack;process.exitCode=1}).finally(()=>{fs.writeFileSync(path.join(out,'live-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))});
