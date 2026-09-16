'use strict';
const APP_RELEASE='1.0.1-rc';
const baseStateValidator=validState;
function validCycle(c){return c&&typeof c.date==='string'&&Number.isFinite(Date.parse(c.date))&&baseStateValidator({version:1,name:'',pace:'beginner',sound:false,completed:c.completed})&&Object.keys(c.completed).length===28}
validState=function(s){return baseStateValidator(s)&&(!('cycles' in s)||(Array.isArray(s.cycles)&&s.cycles.length<=12&&s.cycles.every(validCycle)))};
state.cycles=Array.isArray(state.cycles)?state.cycles.filter(validCycle).slice(-12):[];
let offlineReady=false,networkAvailable=null,networkCheckId=0;
function connectionText(){if(localPreview())return 'Preview · publish the mobile package for iPhone installation';if(navigator.onLine===false||networkAvailable===false)return offlineReady?'Offline · workouts available; videos need internet':'Offline · videos need internet';return offlineReady?'Workouts available offline · videos use internet':'Online · preparing offline workouts'}
function updateConnection(){const el=$('#connection-status');if(el)el.textContent=connectionText()}
async function checkNetwork(){
  if(localPreview()||typeof fetch!=='function'||typeof AbortController!=='function')return;
  const checkId=++networkCheckId;
  if(navigator.onLine===false){networkAvailable=false;updateConnection();return}
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
  try{
    // HEAD bypasses our service worker's GET-only cache; no personal data is sent.
    const response=await fetch('./manifest.webmanifest?network-check',{method:'HEAD',cache:'no-store',signal:controller.signal});
    if(checkId===networkCheckId)networkAvailable=response.ok;
  }catch{if(checkId===networkCheckId)networkAvailable=false}
  finally{clearTimeout(timeout);if(checkId===networkCheckId)updateConnection()}
}
const renderTodayBeforeRelease=renderToday;
renderToday=function(){let html=renderTodayBeforeRelease();if(getDay(selected).type!=='rest')html=html.replace('<div class="section-head"><h2>',`<button class="btn outline wide preflight-button" data-review-workout>${icon('play')} Preview all exercises & videos</button><div class="section-head"><h2>`);return html};
const renderProgressBeforeRelease=renderProgress;
renderProgress=function(){const cycles=state.cycles||[];return renderProgressBeforeRelease()+`<section class="card cycle-card"><div class="row between wrap"><h3>Keep building</h3><span class="badge">${cycles.length} saved cycles</span></div><p class="coach-help">After all 28 days are checked in, you can save this cycle and repeat at your current level. Review what feels easier and adjust your profile before the next phase.</p>${totalCompleted()===28?'<button class="btn primary" data-new-cycle>Save this cycle & start the next</button>':''}${cycles.length?`<div class="cycle-list">${cycles.map((c,i)=>{const logs=Object.values(c.completed);return `<details><summary>Saved cycle ${i+1} · ${new Date(c.date).toLocaleDateString()}</summary><p class="small">${logs.filter(l=>l.daySnapshot?.type==='strength'&&l.mode==='full').length} full strength sessions · ${Math.round(logs.reduce((sum,l)=>sum+l.seconds,0)/60)} guided minutes</p>${Object.entries(c.completed).map(([n,l])=>`<p class="small">Day ${Number(n)} · ${esc(modeLabel(l.mode))} · ${Math.round(l.seconds/60)} min${l.feeling?' · '+esc(l.feeling):''}${l.note?'<br>'+esc(l.note):''}</p>`).join('')}</details>`}).join('')}</div>`:''}<p class="small">Up to 12 cycles stay in this browser. Export a backup to keep older cycles before replacing the oldest one.</p></section>`};
function reviewWorkout(){const moves=[...new Set(buildSteps(selected,'full').filter(s=>s.id!=='rest').map(s=>s.id))];coachModal('Learn today’s movements',`<p class="coach-help">Watch unfamiliar exercises before starting. The ${mins(selected)}-minute estimate includes guided preparation, work, rest and stretches; learning time is extra.</p><div class="preview-moves">${moves.map(id=>`<button class="exercise-row" data-review-exercise="${id}"><span class="round-icon">${icon('play')}</span><span class="exercise-info"><b>${esc(EX[id].name)}</b><span class="small">Video · steps · easier option</span></span>${icon('chevron')}</button>`).join('')}</div><button class="btn primary wide" data-coach-close>Back to my workout</button>`)}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-review-workout'))reviewWorkout();
  if(button.dataset.reviewExercise){closeCoach();detail(button.dataset.reviewExercise)}
  if(button.hasAttribute('data-new-cycle')){
    if(totalCompleted()!==28)return;
    if(!window.confirm('Save all 28 check-ins in your history and begin a new cycle at your current level?'))return;
    if(state.cycles.length>=12){if(!window.confirm('Your archive contains 12 cycles. Continuing removes the oldest cycle from this browser. Export a backup first if you want to keep it. Continue?'))return;state.cycles.shift()}
    state.cycles.push({date:new Date().toISOString(),completed:JSON.parse(JSON.stringify(state.completed))});
    state.completed={};state.draft=null;state.coach.easyRun=0;state.coach.note='Your next cycle keeps your current level. Choose a comfortable variation and use feedback to guide the next step.';currentReadiness={};selected=1;tab='today';persist();render();showToast('Cycle saved. Your next 28 days are ready.');
  }
});
const renderBeforeRelease=render;
render=function(){renderBeforeRelease();updateConnection()};
window.addEventListener('online',()=>{networkAvailable=null;updateConnection();checkNetwork()});
window.addEventListener('offline',()=>{networkCheckId++;networkAvailable=false;updateConnection()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkNetwork()});
if(!localPreview()&&'serviceWorker' in navigator){navigator.serviceWorker.ready.then(()=>{offlineReady=true;updateConnection()}).catch(()=>{})}
persist();render();checkNetwork();
