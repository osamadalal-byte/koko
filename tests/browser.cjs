/* Real engines required. WebKit emulation is not a physical iPhone test. */
const {chromium,webkit,devices}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),results=path.join(root,'test-results');
fs.mkdirSync(results,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const report={date:new Date().toISOString(),playwright:require('playwright/package.json').version,scope:'Real browser automation. External video playback, physical iPhone installation, app switching and screen locking require separate checks.',results:[]};
async function run(browserType,device,name,folder,basePath){
  const checks=[],entry={name,folder,basePath,checks};report.results.push(entry);
  let browser,server,page,originUnavailable=false;
  try{browser=await browserType.launch({headless:true})}catch(error){Object.assign(entry,{status:'blocked',reason:error.message.split('\n')[0]});throw error}
  try{
    const served=path.join(root,folder);
    server=http.createServer((req,res)=>{
      if(originUnavailable){req.socket.destroy();return}
      let requestPath;try{requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return res.writeHead(400).end()}
      if(!requestPath.startsWith(basePath))return res.writeHead(404).end();
      const relative=requestPath.slice(basePath.length)||'index.html',file=path.resolve(served,relative);
      if(!file.startsWith(served+path.sep))return res.writeHead(403).end();
      fs.readFile(file,(error,bytes)=>{if(error)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes)});
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin=`http://127.0.0.1:${server.address().port}`,url=origin+basePath;
    const context=await browser.newContext({...device,serviceWorkers:'allow',acceptDownloads:true});
    context.setDefaultTimeout(15000);page=await context.newPage();
    const errors=[],failedAssets=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    page.on('response',response=>{if(response.url().startsWith(url)&&response.status()>=400)failedAssets.push(response.url())});
    // Third-party playback is a separate audit; do not report a routed iframe as a playing video.
    await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    const fit=async()=>{
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflows viewport');
      for(const dialog of await page.locator('dialog[open]').all())assert(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Dialog overflows horizontally');
    };
    const readiness=async()=>{await page.locator('#ready-energy').selectOption('normal');await page.locator('#ready-soreness').selectOption('none');await page.locator('#ready-pain').selectOption('no');await page.locator('#readiness-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#session-dialog').open);await page.locator('#written-mode').click();assert.equal(await page.evaluate(()=>session.guidanceMode),'written')};
    await page.goto(url);await page.waitForSelector('[data-action="start"]');
    assert.equal(await page.evaluate(()=>state.coach.profile.days),4);await fit();
    if(page.viewportSize().width<=720){const startBox=await page.locator('[data-action="start"]').boundingBox(),navBox=await page.locator('.nav').boundingBox();assert(startBox.y>=0&&startBox.y+startBox.height<=navBox.y-6,'The first workout action must be fully visible above mobile navigation');checks.push('Start workout fully visible in the initial iPhone browser viewport')}
    await page.screenshot({path:path.join(results,name+'-today.png'),fullPage:true});
    if(name==='webkit-iphone-dist-subpath')await page.screenshot({path:path.join(results,'iphone-today.jpg'),type:'jpeg',quality:55,scale:'css'});
    const originalViewport=page.viewportSize();
    for(const width of [320,375,390]){
      await page.setViewportSize({width,height:844});
      for(const tab of ['today','plan','progress','moves']){
        await page.locator(`.nav [data-tab="${tab}"]`).click();await fit();
        await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
        assert(await page.locator('.nav').isVisible(),'Mobile navigation remains available');
      }
      await page.locator('#settings-open').click();await fit();
      await page.locator('#export-button').scrollIntoViewIfNeeded();
      await page.locator('[data-close="settings-dialog"]').click();
    }
    await page.setViewportSize(originalViewport);checks.push('all tabs at 320/375/390px, scrolling and settings controls');
    await page.locator('.nav [data-tab="today"]').click();
    const beforeSetup=await page.evaluate(()=>JSON.stringify(state));
    await page.locator('[data-onboarding]').click();
    await page.locator('[data-setup-key="goal"][data-setup-value="consistency"]').click();
    await page.locator('[data-coach-close]').click();
    assert.equal(await page.evaluate(()=>JSON.stringify(state)),beforeSetup,'Cancelled setup cannot change saved data');
    await page.locator('[data-onboarding]').click();await page.locator('[data-setup-next]').click();
    await page.locator('[data-setup-key="activity"][data-setup-value="unassessed"]').click();
    if(name==='webkit-iphone-dist-subpath')await page.screenshot({path:path.join(results,'iphone-setup.jpg'),type:'jpeg',quality:50,scale:'css'});
    await page.locator('[data-setup-next]').click();await page.locator('[data-setup-key="minutes"][data-setup-value="15"]').click();
    await page.locator('[data-setup-key="days"][data-setup-value="3"]').click();await page.locator('[data-setup-next]').click();
    assert.equal(await page.evaluate(()=>state.coach.profile.days),3);assert.equal(await page.evaluate(()=>state.coach.profile.minutes),15);
    assert.equal(await page.evaluate(()=>state.coach.level),0);assert.equal(await page.evaluate(()=>state.experience.setupDone),true);
    await page.reload();assert.equal(await page.evaluate(()=>state.coach.profile.days),3);
    await page.locator('[data-onboarding]').click();await page.locator('[data-setup-next]').click();await page.locator('[data-setup-next]').click();
    await page.locator('[data-setup-key="minutes"][data-setup-value="20"]').click();await page.locator('[data-setup-key="days"][data-setup-value="4"]').click();await page.locator('[data-setup-next]').click();
    checks.push('guided setup: cancel is nonmutating, 15/20 minutes, 3/4 sessions, baseline and reload persistence');
    await page.locator('.nav [data-tab="moves"]').click();assert.equal(await page.locator('.move-card').count(),18);
    const movementIds=await page.evaluate(()=>PLANNED_EXERCISES);
    for(const id of movementIds){
      await page.locator(`[data-exercise="${id}"]`).click();await fit();
      assert(await page.locator('#detail-dialog .steps li').count()>=3);
      assert(await page.locator('#detail-dialog .easier').isVisible());
      assert.match(await page.locator('#detail-dialog [data-demo-link]').getAttribute('href'),/^https:\/\//);
      await page.locator('[data-close="detail-dialog"]').click();
      await page.waitForFunction(()=>document.querySelector('#detail-content').innerHTML==='');
    }
    await page.locator('[data-exercise="bridge"]').click();await page.locator('[data-play-source="bridge"]').click();
    assert((await page.locator('#human-player iframe').getAttribute('src')).includes('iZ611vwxI4I'));
    await page.locator('[data-close="detail-dialog"]').click();await page.waitForFunction(()=>!document.querySelector('#human-player iframe'));
    checks.push('18 video links, written instructions, easier options and iframe cleanup (no playback claim)');
    await page.locator('[data-exercise="bridge"]').click();await page.locator('[data-favorite="bridge"]').click();await page.locator('[data-close="detail-dialog"]').click();
    await page.locator('[data-library-filter="saved"]').click();assert.equal(await page.locator('.move-card').count(),1);
    await page.locator('#exercise-search').fill('no matching exercise');assert.equal(await page.locator('.move-card').count(),0);
    await page.locator('#exercise-search').fill('bridge');assert.equal(await page.locator('.move-card').count(),1);
    await page.locator('#exercise-search').fill('');await page.locator('[data-library-filter="all"]').click();assert.equal(await page.locator('.move-card').count(),18);
    if(name==='webkit-iphone-dist-subpath')await page.screenshot({path:path.join(results,'iphone-library.jpg'),type:'jpeg',quality:50,scale:'css'});
    await page.reload();await page.locator('.nav [data-tab="moves"]').click();await page.locator('[data-library-filter="saved"]').click();assert.equal(await page.locator('.move-card').count(),1);
    await page.locator('[data-library-filter="all"]').click();checks.push('exercise search, filters, empty results, saved exercises and persistence');
    await page.locator('.nav [data-tab="plan"]').click();assert.equal(await page.locator('.day-tile').count(),28);
    await page.locator('.nav [data-tab="today"]').click();await page.locator('[data-review-workout]').click();
    assert(await page.locator('[data-review-exercise="march"]').count());await page.locator('.preview-moves [data-review-exercise="march"]').click();
    assert(await page.locator('#detail-dialog').evaluate(e=>e.open));await page.locator('[data-close="detail-dialog"]').click();
    await page.evaluate(()=>{window.voiceTest=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){window.voiceTest.push({event:'cancel'})},speak(utterance){window.voiceTest.push({event:'speak',text:utterance.text})}}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}}});
    await page.locator('[data-action="start"]').click();await page.locator('#ready-energy').selectOption('normal');
    await page.locator('#ready-soreness').selectOption('none');await page.locator('#ready-pain').selectOption('yes');
    await page.locator('#readiness-form button[type=submit]').click();assert.equal(await page.evaluate(()=>session),null);await readiness();
    checks.push('28 days, preflight and pain gate; explicit written mode for clock tests with third-party requests blocked');
    const initialRemaining=await page.evaluate(()=>session.remaining);
    assert.equal(await page.evaluate(()=>window.voiceTest.filter(e=>e.event==='speak').length),0,'Spoken cues are opt-in');
    await page.locator('#voice-toggle').click();assert.equal(await page.evaluate(()=>state.experience.voice),true);
    await page.locator('#timer-toggle').click();await page.waitForFunction(initial=>session.remaining<=initial-1000,initialRemaining);
    assert.equal(await page.evaluate(()=>window.voiceTest.filter(e=>e.event==='speak').length),1);
    assert((await page.evaluate(()=>window.voiceTest.find(e=>e.event==='speak').text)).includes('Easy march'));
    await page.locator('#timer-toggle').click();const pausedRemaining=await page.evaluate(()=>session.remaining);
    assert.equal(await page.evaluate(()=>window.voiceTest.at(-1).event),'cancel');await page.locator('#voice-toggle').click();
    assert.equal(await page.evaluate(()=>state.experience.voice),false);checks.push('spoken cues opt-in, correct interval announcement, and cancellation on pause (speech API stub; audible voice remains a device check)');
    await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>session.remaining),pausedRemaining);
    await page.locator('#session-exit').click();const remaining=await page.evaluate(()=>state.draft.remaining);
    await page.reload();await page.locator('[data-action="resume"]').click();await readiness();assert.equal(await page.evaluate(()=>session.remaining),remaining);
    const timerButton=await page.locator('#timer-toggle').boundingBox();
    assert(timerButton.y>=0&&timerButton.y+timerButton.height<=page.viewportSize().height,'Timer control fits the initial workout viewport');
    await page.screenshot({path:path.join(results,name+'-session.png'),fullPage:true});
    if(name==='webkit-iphone-dist-subpath')await page.screenshot({path:path.join(results,'iphone-session.jpg'),type:'jpeg',quality:55,scale:'css'});
    await page.locator('#timer-toggle').click();await page.waitForFunction(saved=>session.remaining<saved,remaining);
    // Real pagehide/unload, then re-open: no synthetic visibility event or iPhone background claim.
    await page.goto('about:blank');await page.goto(url);await page.locator('[data-action="resume"]').click();await readiness();
    assert.equal(await page.evaluate(()=>session.paused),true);assert(await page.evaluate(saved=>session.remaining<saved,remaining));
    checks.push('real-time timer, pause, reload/resume, pagehide persistence and paused reopening');
    await page.evaluate(()=>{if(session.paused)toggleTimer();let guard=0;while(!document.querySelector('#save-checkin')&&guard++<100){session.last=performance.now()-session.remaining;tick()}if(guard>=100)throw Error('Timer failed to finish')});
    await page.locator('[data-feeling="easy"]').click();await page.locator('#finish-note').fill('Browser-verified check-in');await page.locator('#save-checkin').click();
    assert.equal(await page.evaluate(()=>state.completed[1].mode),'full');assert.equal(await page.evaluate(()=>state.coach.easyRun),1);
    await page.locator('.nav [data-tab="progress"]').click();await fit();
    assert.equal(await page.evaluate(()=>experienceStats().sessions),1);
    assert((await page.locator('.activity-bars').getAttribute('aria-label')).includes('Week 1:'));
    if(name==='webkit-iphone-dist-subpath')await page.screenshot({path:path.join(results,'iphone-progress.jpg'),type:'jpeg',quality:50,scale:'css'});
    checks.push('automatic completion and saved feedback');
    await page.locator('#settings-open').click();
    const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();const download=await downloadPromise;
    assert.equal(await download.failure(),null);const backup=fs.readFileSync(await download.path());const parsed=JSON.parse(backup);
    assert.equal(parsed.completed[1].note,'Browser-verified check-in');
    await page.locator('[data-close="settings-dialog"]').click();
    await page.locator('.nav [data-tab="today"]').click();await page.locator('#view [data-coach-profile]').click();
    await page.locator('#profile-name').fill('Changed after backup');await page.locator('#profile-minutes').selectOption('15');await page.locator('#profile-days').selectOption('3');
    await page.locator('#profile-form button[type=submit]').click();assert.equal(await page.evaluate(()=>state.coach.profile.days),3);
    await page.locator('#settings-open').click();
    const beforeInvalid=await page.evaluate(()=>JSON.stringify(state));
    await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});
    await page.waitForFunction(()=>document.querySelector('#settings-message').textContent.includes('not a valid'));
    assert.equal(await page.evaluate(()=>JSON.stringify(state)),beforeInvalid);
    await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
    await page.waitForFunction(()=>!document.querySelector('#settings-dialog').open);
    assert.equal(await page.evaluate(()=>state.coach.profile.days),4);assert.equal(await page.evaluate(()=>state.name),parsed.name);
    await page.reload();assert.equal(await page.evaluate(()=>state.completed[1].note),'Browser-verified check-in');
    assert.equal(await page.evaluate(()=>state.experience.favorites.includes('bridge')),true);
    await page.locator('#settings-open').click();
    const legacy={...parsed};delete legacy.experience;
    await page.locator('#import-file').setInputFiles({name:'legacy-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
    await page.waitForFunction(()=>!document.querySelector('#settings-dialog').open);
    assert.equal(await page.evaluate(()=>state.completed[1].note),'Browser-verified check-in');assert.equal(await page.evaluate(()=>state.experience.favorites.length),0);
    await page.locator('#settings-open').click();await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
    await page.waitForFunction(()=>!document.querySelector('#settings-dialog').open);assert.equal(await page.evaluate(()=>state.experience.favorites.includes('bridge')),true);
    checks.push('old backups migrate without losing check-ins; upgraded backups restore favorites and setup');
    checks.push('downloaded JSON backup, profile edits, file-input restore, invalid backup rejection and reload');
    const manifestResponse=await context.request.get(url+'manifest.webmanifest');assert.equal(manifestResponse.status(),200);
    const manifest=await manifestResponse.json();assert.equal(new URL(manifest.scope,url).href,url);assert(new URL(manifest.start_url,url).href.startsWith(url));
    assert.equal(manifest.display,'standalone');
    for(const icon of manifest.icons)assert.equal((await context.request.get(new URL(icon.src,url).href)).status(),200);
    await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker readiness timed out')),15000))]));await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    assert.equal(await page.evaluate(async()=>(await navigator.serviceWorker.ready).scope),url);
    checks.push('manifest, icons and exact service-worker scope');
    await require('./player-browser.cjs')(page,checks);
    // Remove third-party interception before testing the browser's actual offline stack.
    await context.unrouteAll({behavior:'wait'});
    // First verify the browser offline event and app indicator on the loaded page.
    await context.setOffline(true);
    await page.waitForFunction(()=>document.querySelector('#connection-status').textContent.includes('Offline'));
    // WebKit's Playwright offline emulation rejects even a synthetic SW response.
    // offline-probe.cjs reproduces this independently. Disconnect the actual origin
    // for BOTH engines, verify an uncached request fails, then exercise native caches.
    originUnavailable=true;server.closeAllConnections();await context.setOffline(false);
    assert(await page.evaluate(async()=>{try{await fetch('uncached-network-probe',{cache:'no-store'});return false}catch{return true}}),'The app origin is genuinely unreachable');
    await page.reload();await page.waitForFunction(()=>document.querySelector('#connection-status')?.textContent.includes('Offline'));
    assert.equal(await page.evaluate(()=>!!state.completed[1]),true);assert((await page.locator('#connection-status').textContent()).includes('Offline'));
    // Back up saved progress, then use a fresh local training fixture to test offline exercise UI.
    await page.evaluate(()=>{state.completed={};state.draft=null;selected=1;persist();render()});
    await page.locator('[data-action="start"]').click();await readiness();await page.locator('#timer-toggle').click();
    await page.waitForFunction(()=>session.elapsed>=1);await page.locator('#player-instructions summary').click();
    assert(await page.locator('#player-instructions .steps').isVisible());assert.equal(await page.evaluate(()=>session.paused),true);
    await page.locator('#session-exit').click();
    await page.reload();assert(await page.locator('[data-action="resume"]').count());await context.setOffline(false);
    checks.push('offline event indicator; disconnected origin verified; offline reload, retained progress, workout timer, written guidance and draft persistence');
    assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);entry.status='passed';
  }catch(error){Object.assign(entry,{status:'failed',reason:error.stack});if(page)await page.screenshot({path:path.join(results,name+'-failure.png'),fullPage:true}).catch(()=>{});throw error}
  finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
}
(async()=>{
  for(const [type,device,engine] of [[chromium,{viewport:{width:1280,height:900}},'chromium-desktop'],[webkit,devices['iPhone 13'],'webkit-iphone']]){
    for(const [folder,base,label] of [['.','/','source-root'],['dist','/','dist-root'],['dist','/koko/','dist-subpath']]){
      try{await run(type,device,`${engine}-${label}`,folder,base)}catch(error){console.error(`${engine}-${label}: ${error.message.split('\n')[0]}`);process.exitCode=1}
    }
  }
})().finally(()=>{fs.writeFileSync(path.join(results,'browser-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))});
