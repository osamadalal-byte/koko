'use strict';
// Sound is optional. This original instrumental pattern is generated locally;
// no recordings, subscriptions, tracking, or third-party music downloads.
const HOLD_DEMOS=new Set(['plankknees','cheststretch','stretch','calfhold','breath']);
function demoRate(id){return HOLD_DEMOS.has(id)?1:state.experience.demoPace}
function setDemoRate(video,id){video.defaultPlaybackRate=demoRate(id);video.playbackRate=demoRate(id);video.preservesPitch=true;if('webkitPreservesPitch' in video)video.webkitPreservesPitch=true}
function paceControls(id,preview=false){
  const hold=HOLD_DEMOS.has(id),prefix=preview?'preview':'workout';
  return `<div class="pace-controls"><label for="${prefix}-pace">Demo pace</label><select id="${prefix}-pace" data-demo-pace ${hold?'disabled':''}><option value="1" ${demoRate(id)===1?'selected':''}>Original · 1×</option><option value="1.25" ${demoRate(id)===1.25?'selected':''}>Brisk · 1.25×</option></select><p class="small">${hold?'Holds and breathing keep their original pace.':'Video speed only. Your interval length stays the same; move with control.'}</p></div>`;
}
let beatContext=null,beatGain=null,beatBus=null,beatTimer=null,beatNext=0,beatStep=0;
const beatNodes=new Set();
let coachingActive=false,coachingToken=0,coachingScope=null,coachTimeout=null,coachedSession=null;
function musicAvailable(){return typeof (window.AudioContext||window.webkitAudioContext)==='function'}
function musicRunning(){return !!beatTimer}
function musicLevel(){return state.experience.musicVolume*(coachingActive||videoMuted===false?0.22:1)}
function adjustMusic(){if(beatGain&&beatContext){beatGain.gain.cancelScheduledValues(beatContext.currentTime);beatGain.gain.setTargetAtTime(musicLevel(),beatContext.currentTime,.12)}}
function musicNote(frequency,time,duration,level,type='sine',fall=null){
  const osc=beatContext.createOscillator(),gain=beatContext.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,time);
  if(fall)osc.frequency.exponentialRampToValueAtTime(fall,time+duration);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  osc.connect(gain);gain.connect(beatBus);beatNodes.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();beatNodes.delete(osc)};osc.start(time);osc.stop(time+duration+.02);
}
function scheduleBeat(){
  if(!beatContext||beatContext.state!=='running')return;
  const eighth=60/96/2,now=beatContext.currentTime;
  if(beatNext<now-.1)beatNext=now+.03;
  while(beatNext<now+.12){
    const s=beatStep%32,chord=[[130.81,164.81,196],[110,130.81,164.81],[87.31,110,130.81],[98,123.47,146.83]][Math.floor(s/8)],time=beatNext;
    if(s%4===0)musicNote(95,time,.17,.22,'sine',40);
    if(s%8===0){musicNote(chord[0]/2,time,.7,.1);for(const note of chord)musicNote(note,time,2.2,.026,'triangle')}
    if(s%2===0)musicNote(chord[[0,1,2,1][(s/2)%4]]*2,time,.23,.037,'triangle');
    beatNext+=eighth;beatStep++;
  }
}
function stopMusic(){
  clearInterval(beatTimer);beatTimer=null;
  for(const node of [...beatNodes]){try{node.stop()}catch{}node.disconnect();beatNodes.delete(node)}
  if(beatBus){beatBus.disconnect();beatBus=null}
}
function canPlayMusic(){return !!(state.experience.music&&session&&!session.paused&&!session.awaiting&&!document.hidden&&$('#timer-toggle'))}
function syncWorkoutAudio(){
  if(!canPlayMusic()){stopMusic();return}
  if(!beatContext||beatContext.state!=='running'||beatTimer)return;
  beatBus=beatContext.createGain();beatBus.connect(beatGain);beatNext=beatContext.currentTime+.03;adjustMusic();scheduleBeat();beatTimer=setInterval(scheduleBeat,50);
}
function unlockMusic(){
  if(!state.experience.music||!musicAvailable())return;
  try{
    if(!beatContext){const Context=window.AudioContext||window.webkitAudioContext;beatContext=new Context();beatGain=beatContext.createGain();beatGain.connect(beatContext.destination);beatContext.onstatechange=()=>{if(beatContext.state!=='running')stopMusic();else syncWorkoutAudio()}}
    beatContext.resume().then(syncWorkoutAudio).catch(()=>{stopMusic();showToast('Music could not start. Tap Music again to retry.')});
  }catch{stopMusic();showToast('Music is unavailable in this browser.')}
}
function audioControls(){return `<div class="music-controls"><button class="text-btn" id="music-toggle" aria-pressed="${state.experience.music}" ${musicAvailable()?'':'disabled'}>${state.experience.music?'Music on':'Music off'}</button><label for="music-volume">Music volume</label><input id="music-volume" type="range" min="0.05" max="0.35" step="0.05" value="${state.experience.musicVolume}" aria-label="Music volume"><p class="small">Focus beat · original instrumental loop. Voice cues use your device’s synthetic voice.</p></div>`}
function updateCoachingButton(){for(const [id,scope] of [['preview-explain','preview'],['workout-explain','lesson']]){const b=$('#'+id);if(b){b.textContent=coachingScope===scope?'Stop explanation':'Explain the technique';b.setAttribute('aria-pressed',String(coachingScope===scope))}}}
stopVoice=function(){
  coachingToken++;clearTimeout(coachTimeout);coachingActive=false;coachingScope=null;
  if(voiceAvailable())window.speechSynthesis.cancel();adjustMusic();updateCoachingButton();
};
function sayTechnique(text,scope){
  if(!voiceAvailable()||document.hidden)return;
  stopVoice();const token=coachingToken;coachingScope=scope;coachingActive=true;adjustMusic();updateCoachingButton();
  const u=new window.SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=1;
  const voices=window.speechSynthesis.getVoices?.()||[];u.voice=voices.find(v=>/^en[-_]/i.test(v.lang)&&v.localService)||voices.find(v=>/^en[-_]/i.test(v.lang))||null;
  const finish=()=>{if(token!==coachingToken)return;clearTimeout(coachTimeout);coachingActive=false;coachingScope=null;adjustMusic();updateCoachingButton()};
  u.onend=finish;u.onerror=finish;
  // Guard against missing end/error events after OS interruption.
  coachTimeout=setTimeout(()=>{if(token===coachingToken)stopVoice()},Math.max(15000,text.split(/\s+/).length*650));
  try{window.speechSynthesis.speak(u)}catch{finish()}
}
speakInterval=function(force=false){
  if(!voiceAvailable()||!state.experience.voice||!session||session.paused||document.hidden)return;
  const key=session.day+':'+session.index;if(!force&&coachedSession===session&&spokenInterval===key)return;
  coachedSession=session;spokenInterval=key;
  const step=session.steps[session.index],e=EX[step.id];
  // Short orientation within the existing interval; full steps are available in
  // the exercise preview without consuming workout time.
  const guide=step.id==='rest'?'Relax and get ready for the next movement.':e.steps[0]+' '+e.cue;
  sayTechnique(`${step.phase}. ${step.id==='rest'?'Rest':e.name}. ${step.seconds} seconds. ${guide}`,'workout');
};
document.addEventListener('change',event=>{
  if(!event.target.hasAttribute?.('data-demo-pace'))return;
  const value=Number(event.target.value);if(![1,1.25].includes(value))return;
  state.experience.demoPace=value;persist();
  const v=$('#workout-video-host video'),p=$('#preview-video-host video');
  if(v&&session)setDemoRate(v,session.steps[session.index].id);
  if(p&&exercisePreview)setDemoRate(p,exercisePreview.id);
});
document.addEventListener('input',event=>{
  if(event.target.id!=='music-volume')return;
  const value=Number(event.target.value);if(!Number.isFinite(value)||value<.05||value>.35)return;
  state.experience.musicVolume=value;persist();adjustMusic();
});
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.id==='music-toggle'){
    state.experience.music=!state.experience.music;persist();b.textContent=state.experience.music?'Music on':'Music off';b.setAttribute('aria-pressed',String(state.experience.music));
    state.experience.music?unlockMusic():stopMusic();
  }
  if(b.id==='timer-toggle'||b.id==='timer-next')unlockMusic();
  if(b.id==='workout-explain'&&session){
    if(coachingScope==='lesson'){stopVoice();return}
    pause();const e=EX[session.steps[session.index].id];
    sayTechnique(`${e.name}. ${e.steps.join(' ')} ${e.cue} Easier option. ${e.easy}`,'lesson');
  }
  if(b.id==='preview-explain'&&exercisePreview){
    if(coachingScope==='preview'){stopVoice();return}
    const p=exercisePreview,e=EX[p.id];p.muted=true;p.media?.mute(true);
    const sound=$('#preview-mute');if(sound){sound.textContent='Video sound off';sound.setAttribute('aria-pressed','false')}
    sayTechnique(`${e.name}. ${e.steps.join(' ')} ${e.cue} Easier option. ${e.easy}`,'preview');
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();stopVoice()}});
window.addEventListener('pagehide',()=>{stopMusic();stopVoice()});
