process.chdir(require('path').resolve(__dirname,'..'));
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('open-preview.html','utf8');
const script=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const storage=new Map();let wallNow=Date.parse('2026-09-14T09:00:00Z'),monoNow=0;
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[wallNow]))}static now(){return wallNow}}
function fixture(){
 const nodes=new Set(),listeners={};
 class El{
  constructor(tag,attrs={},owner=null){this.tagName=tag;this.attrs=attrs;this.owner=owner;this.dataset={};this.events={};this.hidden='hidden' in attrs;this.value='';this.open=false;this._html='';this.textContent='';this.classList={toggle(){}};for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;nodes.add(this)}
  get id(){return this.attrs.id}set id(v){this.attrs.id=v}hasAttribute(k){return k in this.attrs}appendChild(el){el.owner=this;return el}insertAdjacentHTML(pos,s){parse(s,this)}set innerHTML(s){for(const n of [...nodes]){let p=n.owner;while(p){if(p===this){nodes.delete(n);break}p=p.owner}}this._html=s;parse(s,this)}get innerHTML(){return this._html}
  setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}getAttribute(k){return this.attrs[k]??null}addEventListener(k,cb){const previous=this.events[k];this.events[k]=previous?(...args)=>{previous(...args);cb(...args)}:cb}showModal(){this.open=true}close(){this.open=false;if(this.events.close)this.events.close()}click(){}closest(s){return s==='button'&&this.tagName==='button'?this:null}
 }
 function parse(s,owner){for(const m of s.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){const a={};for(const x of m[2].matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))a[x[1]]=x[2]??x[3]??x[4]??'';new El(m[1],a,owner)}}
 function match(n,s){if(s[0]==='#')return n.attrs.id===s.slice(1);if(s[0]==='['){const tokens=[...s.matchAll(/\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]/g)];return tokens.every(m=>m[2]===undefined?m[1] in n.attrs:n.attrs[m[1]]===m[2])}return false}
 parse(source.split('<script>')[0],null);
 const doc={hidden:false,querySelector:s=>[...nodes].find(n=>match(n,s))||null,querySelectorAll:s=>[...nodes].filter(n=>match(n,s)),addEventListener:(k,cb)=>{(listeners[k]??=[]).push(cb)},get body(){return [...nodes].find(n=>n.tagName==='body')},createElement:tag=>new El(tag)};
 const context=vm.createContext({document:doc,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date:ClockDate,performance:{now:()=>monoNow},console,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},navigator:{userAgent:'Android'},location:{protocol:'file:'},window:{matchMedia:()=>({matches:false}),addEventListener(){},scrollTo(){},confirm:()=>true}});
 vm.runInContext(script,context);
 const run=s=>vm.runInContext(s,context),click=s=>{const node=doc.querySelector(s);assert(node,'Missing click target '+s);listeners.click.forEach(fn=>fn({target:node}))};
 return {run,click,doc,listeners};
}

let f=fixture();const run=s=>f.run(s),click=s=>f.click(s),field=(s,v)=>{const el=f.doc.querySelector(s);assert(el,'Field exists: '+s);el.value=v},submit=s=>{const target=f.doc.querySelector(s);assert(target,'Form exists: '+s);f.listeners.submit.forEach(fn=>fn({target,preventDefault(){}}))};
const profile=JSON.parse(run('JSON.stringify(state.coach.profile)'));
assert.equal(profile.age,35);assert.equal(profile.days,4);assert.equal(profile.minutes,20);assert.equal(profile.activity,'unassessed');assert.equal(profile.device,'iphone');assert.equal(profile.health,'clear');assert.equal(run('state.coach.level'),0);assert.equal(run('state.autoAdvance'),true);
let plansChecked=0;
for(const days of [3,4])for(const minutes of [15,20])for(let level=0;level<5;level++){
 run(`state.coach.profile.days=${days};state.coach.profile.minutes=${minutes};state.coach.level=${level};`);
 for(let n=1;n<=28;n++){
  const d=JSON.parse(run(`JSON.stringify(getDay(${n}))`)),ss=JSON.parse(run(`JSON.stringify(buildSteps(${n},'full'))`));
  if(d.type==='rest'){assert.equal(ss.length,0);continue}
  const secs=ss.reduce((sum,x)=>sum+x.seconds,0);
  assert(secs<=minutes*60,`${n}/${minutes}/${level} exceeds time cap`);
  assert.equal(ss[0].phase,'Warm-up');assert.equal(ss.at(-1).phase,'Cool-down');
  if(d.type==='strength'){
   assert.equal(secs,run(`recommendation(${n}).seconds`));
   assert.equal(ss.filter(x=>x.phase==='Warm-up').reduce((s,x)=>s+x.seconds,0),300);
   assert(ss.some(x=>['push','kneepush'].includes(x.id)));assert(ss.some(x=>['dead','bird','plankknees'].includes(x.id)));
  }else assert.equal(secs,900);
  assert.equal(run(`validSavedSteps(buildSteps(${n},'full'))`),true);
  plansChecked++;
 }
 assert.equal(run('Array.from({length:7},(_,i)=>getDay(i+1)).filter(d=>d.type==="strength").length'),3);
 assert.equal(run('Array.from({length:7},(_,i)=>getDay(i+1)).filter(d=>d.type==="move").length'),days===4?1:0);
}
run('state.coach.profile.days=4;state.coach.profile.minutes=20;state.coach.level=0;render()');
const normalWork=run('recommendation(1).work');run("currentReadiness={energy:'low',soreness:'none',pain:'no'}");assert(run('recommendation(1).work')<normalWork,'Low energy reduces the easiest workload');run('currentReadiness={}');
click('[data-action="start"]');field('#ready-energy','normal');field('#ready-soreness','none');field('#ready-pain','yes');submit('#readiness-form');assert.equal(run('session'),null);assert(!f.doc.querySelector('#readiness-error').hidden);
field('#ready-pain','no');submit('#readiness-form');assert.equal(run('session.coachPlan.level'),0);assert.equal(run('session.daySnapshot.type'),'strength');
click('#timer-toggle');monoNow+=run('session.remaining');run('pause()');assert.equal(run('session.index'),0,'Explicit pause at boundary does not advance');assert.equal(run('session.paused'),true);assert.equal(run('session.awaiting'),true);
click('#timer-toggle');assert.equal(run('session.index'),1);assert.equal(run('session.paused'),false);
monoNow+=run('session.remaining')+200;run('tick()');assert.equal(run('session.index'),2,'Timer automatically advances while visible');assert.equal(run('session.paused'),false);
monoNow+=2000;run('tick()');click('#session-exit');const remaining=run('state.draft.remaining'),snapshot=run('JSON.stringify(state.draft.steps)');
f=fixture();click('[data-action="resume"]');field('#ready-energy','normal');field('#ready-soreness','none');field('#ready-pain','no');submit('#readiness-form');assert.equal(run('session.remaining'),remaining);assert.equal(run('JSON.stringify(session.steps)'),snapshot);
click('#timer-toggle');f.doc.hidden=true;monoNow+=1000;f.listeners.visibilitychange.forEach(fn=>fn());assert.equal(run('session.paused'),true);f.doc.hidden=false;
let guard=0;while(!f.doc.querySelector('#save-checkin')&&guard++<100){if(run('session.paused'))click('#timer-toggle');monoNow+=run('session.remaining')+200;run('tick()')}
assert(guard<100);assert(f.doc.querySelector('#coach-pain'));field('#finish-note','Controlled reps');click('[data-feeling="easy"]');click('#save-checkin');assert.equal(run('state.coach.easyRun'),1);assert.equal(run('state.completed[1].seconds'),1040);assert.equal(run('state.completed[1].coachPlan.level'),0);assert.equal(run('state.completed[1].daySnapshot.type'),'strength');
click('[data-tab="progress"]');assert(f.doc.querySelector('#view').innerHTML.includes('Your last 7 days'));
click('[data-coach-measure]');field('#measure-kind','waist');field('#measure-value','90.5');field('#measure-date','2026-09-14');submit('#measure-form');const mid=run('state.coach.measures[0].id');f=fixture();assert.equal(run('state.coach.measures[0].id'),mid);
run("detail('bridge')");click('[data-play-source="bridge"]');assert(f.doc.querySelector('#human-player').innerHTML.includes('iZ611vwxI4I'));click('[data-close="detail-dialog"]');assert.equal(f.doc.querySelector('#detail-content').innerHTML,'');
run("detail('deadbug')");assert(f.doc.querySelector('#detail-content').innerHTML.includes('earlier version'));click('[data-close="detail-dialog"]');
assert.equal(run('PLANNED_EXERCISES.length'),18);assert.equal(run('PLANNED_EXERCISES.every(id=>DEMO_SOURCES[id]?.type==="video"&&DEMO_SOURCES[id].url.startsWith("https://"))'),true);run('Object.keys(EX).forEach(id=>detail(id))');click('[data-close="detail-dialog"]');
click('#settings-open');assert(f.doc.querySelector('#install-message').textContent.includes('HTTPS'));click('[data-coach-profile]');
for(const [key,value] of Object.entries({name:'',goal:'strength',activity:'unassessed',minutes:'15',days:'3',health:'clear',why:'Strong and mobile',anchor:'After coffee',notes:'',push:'knees'}))field('#profile-'+key,value);
f.doc.querySelector('#profile-adult').checked=true;run('state.coach.level=3;state.coach.easyRun=2');submit('#profile-form');assert.equal(run('state.coach.level'),0,'New push-up variation resets baseline');assert.equal(run('state.coach.easyRun'),0);assert.equal(run('state.coach.profile.age'),35);
f=fixture();assert.equal(run('state.coach.profile.days'),3);assert.equal(run('state.coach.profile.minutes'),15);assert.equal(run('state.coach.profile.pushVariation'),'knees','Later edits are preserved on reload');
const engine=require('../coach-engine.js');let c=engine.normalize({profile,level:0});
for(let i=0;i<3;i++)c=engine.feedback(c,{type:'strength',mode:'full',feeling:'easy',pain:false,level:0});assert.equal(c.level,1);
c=engine.feedback({...c,easyRun:2},{type:'strength',mode:'full',feeling:'easy',level:1,lighter:true});assert.equal(c.level,1);assert.equal(c.easyRun,0);
c=engine.feedback(c,{type:'strength',mode:'full',feeling:'hard',level:1});assert.equal(c.level,0);
console.log(JSON.stringify({result:'PASS',scope:'Node DOM fixture and pure coaching rules; no real browser/iPhone playback test',plansChecked,checks:['personal preferences applied once','all 28-day plans stay within selected total time','3 strength + optional 1 mobility','warm-up and cool-down retained','low energy eases baseline','pain gate','automatic timer and boundary pause','background pause','exact resume after reload','complete session feedback and history','progress measurements persist','verified bridge embed and close cleanup','all 18 current-plan movements have video sources','new exercise variation resets baseline','local-file installation message','gradual progression without progression from lighter sessions']},null,2));

// Release flows: preflight covers warm-up and stretches; archives survive backups.
run("state.completed={};state.draft=null;selected=1;tab='today';render()");click('[data-review-workout]');assert(f.doc.querySelector('[data-review-exercise="march"]'));assert(f.doc.querySelector('[data-review-exercise="cheststretch"]'));click('[data-review-exercise="kneepush"]');assert(f.doc.querySelector('#detail-dialog').open);click('[data-close="detail-dialog"]');
run(`state.completed=Object.fromEntries(Array.from({length:28},(_,i)=>{const n=i+1,d=getDay(n);return [n,{mode:d.type==='rest'?'recovery':'full',date:new Date(Date.now()-(28-n)*86400000).toISOString(),seconds:d.type==='rest'?0:860,feeling:'good',note:'Cycle record '+n,daySnapshot:d}]}));tab='progress';render()`);
click('[data-new-cycle]');assert.equal(run('Object.keys(state.completed).length'),0);assert.equal(run('state.cycles.length'),1);assert.equal(run('Object.keys(state.cycles[0].completed).length'),28);assert.equal(run('validState(JSON.parse(JSON.stringify(state)))'),true);assert(run('cautionNeeded(1)').includes('already checked in'),'New cycle respects the previous cycle’s calendar-day recovery');
f=fixture();assert.equal(run('state.cycles.length'),1);assert.equal(run('state.cycles[0].completed[28].note'),'Cycle record 28');assert.equal(run('validState({...state,cycles:[{date:"invalid",completed:{}}]})'),false);
console.log('PASS: preflight guidance, cycle archival and reload, backup validation, and recovery spacing across cycle boundaries.');
(async()=>{
 run(`session={day:3};$('#session-dialog').showModal();var lockReleases=0;var lockRequests=0;navigator.wakeLock={request:async()=>{lockRequests++;return {release:async()=>{lockReleases++},addEventListener(){}}}};`);
 await run('keepWorkoutVisible()');assert.equal(run('workoutScreenLock!==null'),true);assert.equal(run('lockRequests'),1);
 await run('keepWorkoutVisible()');assert.equal(run('lockRequests'),1,'One lock per open session');run("$('#session-dialog').close()");assert.equal(run('workoutScreenLock'),null);assert.equal(run('lockReleases'),1);
 run("$('#session-dialog').showModal();navigator.wakeLock.request=async()=>{throw Error('Unavailable')}");await run('keepWorkoutVisible()');assert.equal(run('workoutScreenLock'),null);assert.equal(run('screenLockPending'),false);
 run("var resolveWake;navigator.wakeLock.request=()=>new Promise(resolve=>{resolveWake=resolve})");const pending=run('keepWorkoutVisible()');run("$('#session-dialog').close();session=null;resolveWake({release:async()=>{lockReleases++},addEventListener(){}})");await pending;assert.equal(run('workoutScreenLock'),null);assert.equal(run('lockReleases'),2,'Late lock is released after session closes');

 const backup=run('JSON.stringify(state)');run('state.cycles=[];state.coach.profile.minutes=20');
 await f.doc.querySelector('#import-file').events.change({target:{files:[{size:backup.length,text:async()=>backup}],value:'backup.json'}});
 assert.equal(run('state.cycles.length'),1);assert.equal(run('state.coach.profile.minutes'),15);assert.equal(run('state.draft'),null);
 const afterImport=run('JSON.stringify(state)');const invalid=JSON.stringify({...JSON.parse(backup),cycles:[{date:'not-a-date',completed:{}}]});
 await f.doc.querySelector('#import-file').events.change({target:{files:[{size:invalid.length,text:async()=>invalid}],value:'invalid.json'}});
 assert.equal(run('JSON.stringify(state)'),afterImport,'Invalid archive cannot replace good progress');
 console.log('PASS: actual backup import restores profile and cycle history; invalid archive leaves existing progress intact.');
 console.log('PASS: screen-awake lifecycle, unsupported/declined fallback, and pending request cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1});
