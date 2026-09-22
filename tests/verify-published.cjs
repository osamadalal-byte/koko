// Check the just-published HTTPS build in fresh, isolated profiles.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const base='https://osamadalal-byte.github.io/koko/',root=path.resolve(__dirname,'..');
const report={date:new Date().toISOString(),url:base,commit:process.env.GITHUB_SHA||null,assets:[],browsers:[]};
const worker=fs.readFileSync(path.join(root,'dist/service-worker.js'),'utf8');
const assets=Array.from(vm.runInNewContext(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]));
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
const revision=worker.match(/build-([a-f0-9]+)/)[1];
(async()=>{
 const files=fs.readdirSync(path.join(root,'dist'),{recursive:true}).filter(f=>f!=='.nojekyll'&&fs.statSync(path.join(root,'dist',f)).isFile());
 for(const file of files){
  const response=await fetch(new URL(file,base),{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,file);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(root,'dist',file)),'Live bytes differ: '+file);
  if(file.endsWith('.js'))assert.match(response.headers.get('content-type'),/javascript/);report.assets.push(file);
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.webmanifest'),'utf8'));
 assert.equal(new URL(manifest.scope,base).href,base);assert.equal(new URL(manifest.start_url,base).href,base+'index.html');assert.equal(manifest.display,'standalone');
 for(const [name,type,device] of [['chromium',chromium,{viewport:{width:390,height:844}}],['webkit',webkit,devices['iPhone 13']]]){
  const browser=await type.launch();const row={name,passed:false};report.browsers.push(row);
  try{
   const context=await browser.newContext({...device,serviceWorkers:'allow'}),page=await context.newPage();page.setDefaultTimeout(20000);
   await page.goto(base);await page.waitForSelector('[data-action="start"]');
   assert(await page.evaluate(()=>isSecureContext));assert.equal(await page.evaluate(()=>APP_RELEASE),require('../package.json').version);
   await page.locator('.nav [data-tab="plan"]').click();await page.locator('.day-tile[data-day="1"]').click();
   const ready=async()=>{await page.locator('#ready-energy').selectOption('normal');await page.locator('#ready-soreness').selectOption('none');await page.locator('#ready-pain').selectOption('no');await page.locator('#readiness-form button[type=submit]').click()};
   await ready();await page.waitForFunction(()=>workoutMediaReady&&!session.paused&&workoutMedia.getPlayerState()===1);
   const before=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),remaining:session.remaining}));await page.waitForTimeout(1200);
   assert(await page.evaluate(b=>workoutMedia.getCurrentTime()>b.time+.4&&session.remaining<b.remaining,before));
   await page.locator('#timer-toggle').click();const saved=await page.evaluate(()=>session.remaining);
   await page.locator('#player-instructions summary').click();assert(await page.locator('#player-instructions .steps').isVisible());
   assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(page.url(),base);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(root,'test-results/published-'+name+'.jpg'),type:'jpeg',quality:65});
   await page.locator('#session-exit').click();await page.reload();assert.equal(await page.evaluate(()=>state.draft.remaining),saved);
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   row.worker=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;const name=(await caches.keys()).find(n=>n.startsWith('form28::'+reg.scope+'::build-'));return {scope:reg.scope,script:reg.active.scriptURL,cache:name,urls:(await (await caches.open(name)).keys()).map(r=>r.url)}});
   assert.equal(row.worker.scope,base);assert.equal(row.worker.script,base+'service-worker.js');assert(row.worker.cache.endsWith('build-'+revision));
   assert.deepEqual(row.worker.urls.sort(),assets.map(a=>new URL(a,base).href).sort());
   if(name==='chromium'){
    await context.setOffline(true);await page.reload();assert.equal(await page.evaluate(()=>state.draft.remaining),saved);
    await page.locator('[data-action="resume"]').click();await ready();await page.locator('#written-mode').click();await page.locator('#timer-toggle').click();
    await page.waitForFunction(n=>session.remaining<n,saved);row.offline='Live-origin offline reload, saved draft and explicit written workout passed';
   }else row.offline='Exact offline cache verified; disconnected-origin browser coverage is in the release suite. Physical iPhone airplane mode remains manual.';
   row.passed=true;
  }finally{await browser.close()}
 }
})().catch(error=>{report.error=error.stack;process.exitCode=1}).finally(()=>{fs.mkdirSync(path.join(root,'test-results'),{recursive:true});fs.writeFileSync(path.join(root,'test-results/published-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))});
