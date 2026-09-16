'use strict';
// Keep the screen visible during a guided session when the browser allows it.
let workoutScreenLock=null,screenLockPending=false,keepScreenOn=true;
function screenMessage(){return !keepScreenOn?'Screen stays on: off':workoutScreenLock?'Screen stays on during this session':'If your screen locks, the timer pauses. Keep the app visible.'}
function updateScreenMessage(){const label=$('#screen-message');if(label)label.textContent=screenMessage();const button=$('#screen-toggle');if(button){button.textContent=keepScreenOn?'Allow screen to sleep':'Keep screen on';button.setAttribute('aria-pressed',String(keepScreenOn));button.hidden=!('wakeLock' in navigator)}}
async function keepWorkoutVisible(){
  if(!session||!$('#session-dialog').open||document.hidden||!keepScreenOn||!('wakeLock' in navigator)||workoutScreenLock||screenLockPending)return;
  const owner=session;screenLockPending=true;
  try{
    const lock=await navigator.wakeLock.request('screen');
    if(session!==owner||!$('#session-dialog').open||document.hidden||!keepScreenOn){await lock.release();return}
    workoutScreenLock=lock;
    lock.addEventListener('release',()=>{if(workoutScreenLock===lock)workoutScreenLock=null;updateScreenMessage()});
  }catch(error){/* The timer remains usable when the browser declines. */}
  finally{screenLockPending=false;updateScreenMessage()}
}
function releaseWorkoutScreen(){const lock=workoutScreenLock;workoutScreenLock=null;if(lock)lock.release().catch(()=>{});updateScreenMessage()}
const renderSessionBeforePhone=renderSession;
renderSession=function(){renderSessionBeforePhone();if(session){$('#session-content').insertAdjacentHTML('beforeend','<div class="screen-controls"><p class="small" id="screen-message"></p><button class="text-btn" id="screen-toggle" type="button"></button></div>');updateScreenMessage()}};
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.id==='screen-toggle'){keepScreenOn=!keepScreenOn;if(!keepScreenOn)releaseWorkoutScreen();updateScreenMessage()}if(session&&$('#session-dialog').open)keepWorkoutVisible();else releaseWorkoutScreen()});
document.addEventListener('submit',()=>{if(session&&$('#session-dialog').open)keepWorkoutVisible()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseWorkoutScreen();else keepWorkoutVisible()});
$('#session-dialog').addEventListener('close',releaseWorkoutScreen);
window.addEventListener('pagehide',releaseWorkoutScreen);
