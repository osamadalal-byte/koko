'use strict';
// Browser interaction tests with an explicitly simulated YouTube API. These
// exercise our integration and stale-event handling, NOT provider playback.
const assert=require('node:assert/strict');
module.exports=async function(page,checks){
 const saved=await page.evaluate(()=>JSON.stringify(state));
 await page.evaluate(()=>{
  state.completed={};state.cycles=[];state.draft=null;state.autoAdvance=true;selected=1;tab='plan';render();
  window.playerDoubles=[];
  window.YT={Player:class{
   constructor(id,options){
    this.options=options;this.dead=false;this.time=0;
    this.frame=document.createElement('iframe');this.frame.src='about:blank';document.getElementById(id).replaceWith(this.frame);
    window.playerDoubles.push(this);queueMicrotask(()=>options.events.onReady({target:this}));
   }
   getIframe(){return this.frame}mute(){}unMute(){}getCurrentTime(){return this.time}
   playVideo(){this.requested=true}pauseVideo(){this.requested=false}
   seekTo(t){this.time=t;this.looped=true}destroy(){this.dead=true;this.frame.remove()}
   emit(n){this.options.events.onStateChange({data:n,target:this})}
  }};
 });
 await page.locator('.day-tile[data-day="1"]').click();
 assert(await page.locator('#readiness-form').isVisible(),'Choosing Day 1 enters the in-app readiness flow directly');
 await page.locator('#ready-energy').selectOption('normal');await page.locator('#ready-soreness').selectOption('none');await page.locator('#ready-pain').selectOption('no');await page.locator('#readiness-form button[type=submit]').click();
 await page.waitForFunction(()=>window.playerDoubles.length===1&&workoutMediaReady);
 const original=await page.evaluate(()=>session.remaining);
 await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>session.remaining),original,'Video loading must not consume training time');
 await page.evaluate(()=>playerDoubles[0].emit(1));
 await page.waitForFunction(n=>session.remaining<n,original);
 await page.evaluate(()=>playerDoubles[0].emit(3));const buffered=await page.evaluate(()=>session.remaining);
 await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>session.remaining),buffered);
 await page.locator('#timer-toggle').click();await page.evaluate(()=>playerDoubles[0].emit(1));
 assert.equal(await page.evaluate(()=>session.paused),true,'Late playback after explicit pause cannot restart the timer');
 await page.locator('#timer-toggle').click();await page.evaluate(()=>playerDoubles[0].emit(1));
 await page.evaluate(()=>playerDoubles[0].emit(0));assert.equal(await page.evaluate(()=>playerDoubles[0].looped),true);
 assert.equal(await page.evaluate(()=>session.index),0,'A demonstration ending must not skip its workout interval');
 await page.evaluate(()=>{playerDoubles[0].emit(1);session.last=performance.now()-session.remaining;tick()});
 await page.waitForFunction(()=>playerDoubles.length===2&&workoutMediaReady);
 assert.equal(await page.evaluate(()=>session.index),1);
 assert.equal(await page.evaluate(()=>playerDoubles[0].dead),true,'Previous video is destroyed at the transition');
 await page.evaluate(()=>playerDoubles[0].emit(1));assert.equal(await page.evaluate(()=>session.paused),true,'Stale media events cannot start the next interval');
 await page.evaluate(()=>playerDoubles[1].options.events.onAutoplayBlocked());assert.equal(await page.evaluate(()=>session.paused),true);
 assert((await page.locator('#timer-toggle').innerText()).includes('Tap to play'));
 await page.locator('#timer-toggle').click();await page.evaluate(()=>playerDoubles[1].emit(1));
 await page.locator('#player-instructions summary').click();assert.equal(await page.evaluate(()=>session.paused),true);
 assert(await page.locator('#player-instructions .steps').isVisible(),'Technique stays in the same workout screen');
 assert.equal(await page.locator('dialog[open]').count(),1,'No second page or instructions modal');
 await page.evaluate(()=>playerDoubles[1].options.events.onError({data:150}));assert.equal(await page.evaluate(()=>session.paused),true);
 await page.locator('#written-mode').click();await page.locator('#timer-toggle').click();
 await page.waitForFunction(()=>!session.paused);
 assert.equal(await page.locator('#workout-video-host iframe').count(),0,'Explicit written fallback removes the external player');
 assert.equal(await page.evaluate(()=>session.guidanceMode),'written');
 const stages=await page.evaluate(()=>{
  const seen=new Set();let count=0;
  while(document.querySelector('#timer-toggle')&&count++<100){seen.add(session.steps[session.index].phase);if(session.paused)toggleTimer();session.last=performance.now()-session.remaining;tick()}
  if(count>=100)throw Error('Continuous session did not finish');return [...seen];
 });
 for(const phase of ['Warm-up','Work','Rest','Cool-down'])assert(stages.includes(phase),phase+' remains in the sequence');
 assert(await page.locator('#save-checkin').isVisible());
 await page.locator('#finish-exit').click();
 await page.evaluate(raw=>{state=JSON.parse(raw);session=null;selected=1;tab='today';delete window.YT;youtubeLoad=null;persist();render()},saved);
 checks.push('Simulated media API: day selection, loading/buffering clock gate, pause race, replay, automatic transition, stale events, autoplay block, same-screen instructions, video error, explicit written fallback and full phase sequence. Not a live playback test.');
};
