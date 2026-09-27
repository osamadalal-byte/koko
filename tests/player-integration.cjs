'use strict';
// Reuse the existing DOM fixture and real application code. Only the external
// YouTube transport is simulated. These assertions do not certify video playback.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'check-personal.cjs'),'utf8').split('\nlet f=fixture();')[0];
const scenario=async function(){
 const f=fixture(),run=f.run,click=f.click;
 run("location.protocol='https:';location.origin='https://example.test';networkAvailable=true;state.completed={};state.cycles=[];state.draft=null;state.autoAdvance=true;selected=1;tab='plan';render()");
 run(`Object.values(WORKOUT_VIDEOS).forEach(c=>{delete c.src;delete c.brightcove});window.doubles=[];window.YT={Player:class{
  constructor(id,o){this.options=o;this.frame=document.createElement('iframe');this.dead=false;this.time=0;window.doubles.push(this)}
  getIframe(){return this.frame}mute(){}unMute(){}getCurrentTime(){return this.time}playVideo(){this.requested=true}pauseVideo(){this.requested=false}
  seekTo(t){this.time=t;this.looped=true}destroy(){this.dead=true}emit(n){this.options.events.onStateChange({data:n,target:this})}
 }};`);
 const ready=async()=>{await run('Promise.resolve()');run('var newest=window.doubles.at(-1);newest.options.events.onReady({target:newest})')};
 click('[data-day="1"]');assert(f.doc.querySelector('#readiness-form'),'Day enters readiness directly');
 for(const [id,value] of [['#ready-energy','normal'],['#ready-soreness','none'],['#ready-pain','no']])f.doc.querySelector(id).value=value;
 f.listeners.submit.forEach(fn=>fn({target:f.doc.querySelector('#readiness-form'),preventDefault(){}}));
 click('#timer-toggle');click('#timer-toggle'); // pause/resume before the API promise resolves
 await ready();assert.equal(run('window.doubles.length'),1,'Overlapping load attempts create only one current player');assert.equal(run('session.paused'),true);
 const initial=run('session.remaining');monoNow+=5000;run('tick()');assert.equal(run('session.remaining'),initial,'Loading does not count');
 run('window.doubles[0].emit(1)');monoNow+=1200;run('tick()');assert.equal(run('session.remaining'),initial-1200);
 run('window.doubles[0].emit(3)');monoNow+=8000;run('tick()');assert.equal(run('session.remaining'),initial-1200,'Buffering does not count');
 click('#timer-toggle');run('window.doubles[0].emit(1)');assert.equal(run('session.paused'),true,'Late play is ignored after pause');
 click('#timer-toggle');run('window.doubles[0].emit(1)');
 f.doc.hidden=true;f.listeners.visibilitychange.forEach(fn=>fn());assert.equal(run('session.paused'),true);
 run('window.doubles[0].emit(1)');assert.equal(run('session.paused'),true);
 f.doc.hidden=false;f.listeners.visibilitychange.forEach(fn=>fn());assert.equal(run('session.paused'),true);
 click('#timer-toggle');run('window.doubles[0].emit(1);window.doubles[0].emit(0)');assert.equal(run('window.doubles[0].looped'),true);assert.equal(run('session.index'),0);
 run('window.doubles[0].emit(1)');monoNow+=run('session.remaining');run('tick()');await ready();
 assert.equal(run('session.index'),1);assert.equal(run('window.doubles[0].dead'),true);
 run('window.doubles[0].emit(1)');assert.equal(run('session.paused'),true,'Stale event cannot start the next move');
 run('window.doubles[1].options.events.onAutoplayBlocked()');assert.equal(run('session.paused'),true);assert.equal(run('workoutPlayback.wanted'),false);
 click('#timer-toggle');run('window.doubles[1].emit(1)');
 run('window.doubles[1].options.events.onError({data:150})');assert.equal(run('session.paused'),true);
 click('#timer-toggle');await ready();assert.equal(run('window.doubles.length'),3,'Retry creates a fresh player');
 run('window.doubles[1].emit(1)');assert.equal(run('session.paused'),true,'Destroyed retry source cannot restart clock');
 run('window.doubles[2].emit(1)');assert.equal(run('session.paused'),false);
 let guard=0;const phases=new Set();
 while(f.doc.querySelector('#timer-toggle')&&guard++<100){
  phases.add(run('session.steps[session.index].phase'));
  if(run('session.paused')){await ready();run('window.doubles.at(-1).emit(1)')}
  monoNow+=run('session.remaining');run('tick()');
 }
 assert(guard<100);assert(f.doc.querySelector('#save-checkin'));
 assert.equal(run('session.elapsed'),1040,'Only the planned 1040 seconds counted, with loading and buffering excluded');
 assert.equal([...phases].sort().join(','),['Cool-down','Rest','Warm-up','Work'].sort().join(','));
 assert.equal(run('workoutMedia'),null,'Finishing destroys the player');
 click('#save-checkin');assert.equal(run('state.completed[1].mode'),'full');assert.equal(run('state.completed[1].seconds'),1040);
 // Saved legacy steps lacking a new clip pause rather than silently skip.
 run("state.completed={};state.draft=null;launchFromReadiness=true;startSession('full');launchFromReadiness=false");await ready();
 run("session.steps[0].id='ankle';renderSession();toggleTimer()");assert.equal(run('workoutPlayback.status'),'error');assert.equal(run('session.paused'),true);
 click('#written-mode');click('#timer-toggle');monoNow+=1000;run('tick()');assert.equal(run('session.paused'),false);assert.equal(run('session.guidanceMode'),'written');
 click('#timer-next');assert.equal(run('session.index'),1);assert.equal(run('session.paused'),false,'Skip continues when the workout was running');assert.equal(run('session.skipped'),true,'Skip still makes this a partial session');
 click('#session-exit');assert(run('state.draft.remaining')>0);assert.equal(run('workoutMedia'),null);
 console.log('PASS: application + simulated media API: day entry, real timer integration, buffering, pause/background races, looping, autoplay refusal, retry generation, automatic warm-up/work/rest/cool-down, exact saved seconds, unknown legacy clip and explicit written fallback. No live playback claim.');
};
vm.runInNewContext(harness+'\n('+scenario.toString()+')().catch(error=>{console.error(error);process.exitCode=1})',{require:require('node:module').createRequire(__filename),__dirname,process,console,Blob});
