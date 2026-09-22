'use strict';
// One workout screen. The existing clock, readiness checks, plan and storage
// remain authoritative. External media only grants permission to run the clock.
const clockPauseBeforePlayer=pause,clockToggleBeforePlayer=toggleTimer;
const updateBeforePlayer=updateTimerUI,startBeforePlayer=startSession,finishBeforePlayer=showFinish,advanceBeforePlayer=advance;
let workoutMedia=null,workoutMediaReady=false,mediaLoadTimer=null,mediaWatchdog=null;
let youtubeLoad=null,videoMuted=true,mediaFailure='',mediaAttempt=0,workoutMediaError=null;
let hlsLoad=null;
let brightcoveLoad=null;
function brightcoveAPI(){
  if(window.bc)return Promise.resolve(window.bc);
  if(brightcoveLoad)return brightcoveLoad;
  brightcoveLoad=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let finished=false;
    const timer=setTimeout(()=>finish(Error('Video player timed out')),12000);
    function finish(error){if(finished)return;finished=true;clearTimeout(timer);if(error){script.remove();brightcoveLoad=null;reject(error)}else resolve(window.bc)}
    script.src='https://players.brightcove.net/79855382001/EkC1XU82e_default/index.min.js';script.async=true;
    script.onload=()=>window.bc?finish():finish(Error('Video player unavailable'));
    script.onerror=()=>finish(Error('Video player unavailable'));document.head.appendChild(script);
  });return brightcoveLoad;
}
async function brightcoveWorkoutMedia(clip,token,attempt,owner){
  const valid=()=>token===workoutPlayback.generation&&attempt===mediaAttempt&&session===owner&&workoutPlayback.active;
  const fail=error=>{if(!valid())return;clearMediaTimers();workoutMediaError={code:error?.code||error?.name||'brightcove',videoId:clip.mediaId};mediaFailure='This video could not play. Retry, or follow the written guidance here.';workoutPlayback.event(error?.name==='NotAllowedError'?'blocked':'error',token)};
  try{
    const bc=await brightcoveAPI();if(!valid())return;
    const host=$('#workout-video-host');if(!host)return;host.innerHTML='';
    const video=document.createElement('video');video.id='workout-brightcove-'+attempt;video.className='video-js';video.controls=true;video.muted=videoMuted;video.playsInline=true;
    for(const [name,value] of Object.entries({'data-account':'79855382001','data-player':'EkC1XU82e','data-embed':'default','data-video-id':clip.mediaId,'playsinline':'','aria-label':EX[owner.steps[owner.index].id].name+' — human demonstration'}))video.setAttribute(name,value);
    host.appendChild(video);const player=bc(video);
    const play=()=>{if(valid()&&workoutPlayback.wanted&&!document.hidden)player.play()?.catch(fail)};
    workoutMedia={playVideo:play,pauseVideo(){player.pause()},mute(){player.muted(true)},unMute(){player.muted(false)},seekTo(time){player.currentTime(time)},getCurrentTime(){return player.currentTime()},getDuration(){return player.duration()},getPlayerState(){return player.ended()?0:player.paused()?2:player.readyState()<3?3:1},getVideoData(){return {video_id:String(player.mediainfo?.id||''),title:player.mediainfo?.name,source:clip.source}},destroy(){player.dispose()}};
    player.on('playing',()=>{if(valid()){clearTimeout(mediaLoadTimer);workoutPlayback.event('playing',token)}});
    player.on('waiting',()=>{if(valid()&&workoutPlayback.wanted){workoutPlayback.event('buffering',token);armMediaTimeout()}});
    player.on('pause',()=>{if(valid()&&workoutPlayback.status==='playing')workoutPlayback.event('paused',token)});
    player.on('ended',()=>{if(valid())workoutPlayback.event('ended',token)});
    player.on('error',()=>fail(player.error()));
    player.on('timeupdate',()=>{if(valid()&&clip.end&&player.currentTime()>=clip.end&&workoutPlayback.wanted)workoutPlayback.event('ended',token)});
    player.on('loadedmetadata',()=>{if(!valid())return;workoutMediaReady=true;player.muted(videoMuted);if(clip.start>0)player.currentTime(clip.start);play()});
  }catch(error){fail(error)}
}
let vimeoLoad=null;
function vimeoAPI(){
  if(window.Vimeo?.Player)return Promise.resolve(window.Vimeo);
  if(vimeoLoad)return vimeoLoad;
  vimeoLoad=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let finished=false;
    const timer=setTimeout(()=>finish(Error('Video player timed out')),12000);
    function finish(error){if(finished)return;finished=true;clearTimeout(timer);if(error){script.remove();vimeoLoad=null;reject(error)}else resolve(window.Vimeo)}
    script.src='https://player.vimeo.com/api/player.js';script.async=true;
    script.onload=()=>window.Vimeo?.Player?finish():finish(Error('Video player unavailable'));
    script.onerror=()=>finish(Error('Video player unavailable'));document.head.appendChild(script);
  });return vimeoLoad;
}
async function vimeoWorkoutMedia(clip,token,attempt,owner){
  const valid=()=>token===workoutPlayback.generation&&attempt===mediaAttempt&&session===owner&&workoutPlayback.active;
  const fail=error=>{if(!valid())return;clearMediaTimers();workoutMediaError={code:error?.name||'vimeo',videoId:clip.mediaId};mediaFailure='This video could not play. Retry, or follow the written guidance here.';workoutPlayback.event(error?.name==='NotAllowedError'?'blocked':'error',token)};
  try{
    const Vimeo=await vimeoAPI();if(!valid())return;
    const host=$('#workout-video-host');if(!host)return;
    host.innerHTML='';const frame=document.createElement('iframe');
    frame.src='https://player.vimeo.com/video/'+clip.mediaId+'?playsinline=1&muted='+(videoMuted?'1':'0')+'&dnt=1';
    frame.title=EX[owner.steps[owner.index].id].name+' — human demonstration';
    frame.setAttribute('allow','autoplay; fullscreen; picture-in-picture');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    host.appendChild(frame);const player=new Vimeo.Player(frame);let time=0,duration=0,mediaState=2,title=clip.title,actualId='',seeking=false;
    const play=()=>{if(valid()&&workoutPlayback.wanted&&!document.hidden)player.play().catch(fail)};
    workoutMedia={playVideo:play,pauseVideo(){mediaState=2;player.pause().catch(()=>{})},mute(){player.setMuted(true).catch(fail)},unMute(){player.setMuted(false).catch(fail)},
      seekTo(seconds){seeking=true;mediaState=3;if(valid()&&workoutPlayback.wanted)workoutPlayback.event('buffering',token);return player.setCurrentTime(seconds).then(t=>{time=t;seeking=false}).catch(fail)},
      getCurrentTime(){return time},getDuration(){return duration},getPlayerState(){return mediaState},
      getVideoData(){return {video_id:String(actualId),title,source:clip.source}},destroy(){player.destroy().catch(()=>{});frame.remove()}};
    player.on('playing',()=>{if(valid()){mediaState=1;clearTimeout(mediaLoadTimer);workoutPlayback.event('playing',token)}});
    player.on('bufferstart',()=>{if(valid()&&workoutPlayback.wanted){mediaState=3;workoutPlayback.event('buffering',token);armMediaTimeout()}});
    player.on('pause',()=>{mediaState=2;if(valid()&&workoutPlayback.status==='playing')workoutPlayback.event('paused',token)});
    player.on('ended',()=>{mediaState=0;if(valid())workoutPlayback.event('ended',token)});
    player.on('error',fail);
    player.on('timeupdate',data=>{
      const previous=time;time=data.seconds;duration=data.duration;
      if(!valid()||!workoutPlayback.wanted||seeking)return;
      if(clip.end&&time>=clip.end){workoutPlayback.event('ended',token);return}
      if(time>previous&&workoutPlayback.status==='buffering'){mediaState=1;clearTimeout(mediaLoadTimer);workoutPlayback.event('playing',token)}
    });
    await player.ready();if(!valid())return;
    [duration,title,actualId]=await Promise.all([player.getDuration(),player.getVideoTitle(),player.getVideoId()]);if(!valid())return;
    await player.setMuted(videoMuted);if(clip.start>0)time=await player.setCurrentTime(clip.start);
    if(!valid())return;workoutMediaReady=true;play();
  }catch(error){fail(error)}
}
function hlsAPI(){
  if(window.Hls)return Promise.resolve(window.Hls);
  if(hlsLoad)return hlsLoad;
  hlsLoad=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let finished=false;
    const timer=setTimeout(()=>finish(Error('Streaming player timed out')),12000);
    function finish(error){if(finished)return;finished=true;clearTimeout(timer);if(error){script.remove();hlsLoad=null;reject(error)}else resolve(window.Hls)}
    script.src='https://cdn.jsdelivr.net/npm/hls.js@1.7.3/dist/hls.min.js';script.async=true;
    script.onload=()=>window.Hls?finish():finish(Error('Streaming player is unavailable'));
    script.onerror=()=>finish(Error('Streaming player is unavailable'));document.head.appendChild(script);
  });return hlsLoad;
}
async function nativeWorkoutMedia(clip,token,attempt,owner){
  const valid=()=>token===workoutPlayback.generation&&attempt===mediaAttempt&&session===owner&&workoutPlayback.active;
  const host=$('#workout-video-host');if(!host||!valid())return;
  const video=document.createElement('video');video.controls=true;video.playsInline=true;video.muted=videoMuted;video.preload='auto';
  video.setAttribute('playsinline','');video.setAttribute('aria-label',EX[owner.steps[owner.index].id].name+' — human demonstration');
  host.innerHTML='';host.appendChild(video);let streaming=null,disposed=false;
  const fail=error=>{if(!valid())return;clearMediaTimers();workoutMediaError={code:error?.code||error?.name||'media',mediaId:clip.mediaId};mediaFailure='This video could not play. Retry, or use written guidance here.';workoutPlayback.event(error?.name==='NotAllowedError'?'blocked':'error',token)};
  const play=()=>{if(valid()&&workoutPlayback.wanted&&!document.hidden)video.play().catch(error=>{if(error.name!=='AbortError')fail(error)})};
  const adapter={
    playVideo:play,pauseVideo(){video.pause()},mute(){video.muted=true},unMute(){video.muted=false},
    seekTo(time){video.currentTime=time},getCurrentTime(){return video.currentTime},getDuration(){return video.duration},
    getPlayerState(){return video.ended?0:video.paused?2:video.readyState<3?3:1},
    getVideoData(){return {video_id:clip.mediaId,title:clip.title,source:clip.src,currentSrc:video.currentSrc}},
    destroy(){disposed=true;streaming?.destroy();video.pause();video.removeAttribute('src');video.load();video.remove()}
  };
  workoutMedia=adapter;workoutMediaReady=true;
  video.addEventListener('playing',()=>{if(valid()){clearTimeout(mediaLoadTimer);workoutPlayback.event('playing',token)}});
  video.addEventListener('waiting',()=>{if(valid()&&workoutPlayback.wanted){workoutPlayback.event('buffering',token);armMediaTimeout()}});
  video.addEventListener('pause',()=>{if(valid()&&workoutPlayback.status==='playing')workoutPlayback.event('paused',token)});
  video.addEventListener('ended',()=>{if(valid())workoutPlayback.event('ended',token)});
  video.addEventListener('error',()=>fail(video.error));
  video.addEventListener('loadedmetadata',()=>{if(valid()&&clip.start>0)video.currentTime=clip.start});
  video.addEventListener('timeupdate',()=>{if(valid()&&clip.end&&video.currentTime>=clip.end&&workoutPlayback.wanted){workoutPlayback.event('ended',token)}});
  try{
    if(clip.src.includes('.m3u8')){
      const Hls=await hlsAPI();if(!valid()||disposed)return;
      if(Hls.isSupported()){
        streaming=new Hls({startPosition:clip.start||0,maxBufferLength:15});
        streaming.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)fail({code:data.details})});
        streaming.on(Hls.Events.MANIFEST_PARSED,play);streaming.loadSource(clip.src);streaming.attachMedia(video);
      }else if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=clip.src;play()}
      else fail({code:'unsupported-stream'});
    }else{video.src=clip.src;play()}
  }catch(error){fail(error)}
}
function currentVideo(){return session?WORKOUT_VIDEOS[session.steps[session.index].id]:null}
function stopWorkoutClock(){clockPauseBeforePlayer()}
function startWorkoutClock(){
  if(!session||document.hidden||!$('#timer-toggle'))return;
  if(session.awaiting){if(state.autoAdvance){advance(false);if($('#timer-toggle'))workoutPlayback.play()}return}
  if(session.paused)clockToggleBeforePlayer();
}
function pauseWorkoutMedia(){if(workoutMediaReady)try{workoutMedia.pauseVideo()}catch{}}
const workoutPlayback=new PlaybackGate({
  start:startWorkoutClock,stop:stopWorkoutClock,pause:pauseWorkoutMedia,
  change:()=>{if(session)updateTimerUI()},
  play:()=>{if(workoutMediaReady){armMediaTimeout();workoutMedia.playVideo()}else loadWorkoutMedia()},
  replay:()=>{if(workoutMediaReady){armMediaTimeout();workoutMedia.seekTo(currentVideo()?.start||0,true);workoutMedia.playVideo()}}
});
function clearMediaTimers(){clearTimeout(mediaLoadTimer);clearInterval(mediaWatchdog);mediaLoadTimer=null;mediaWatchdog=null}
function destroyWorkoutMedia(){
  mediaAttempt++;clearMediaTimers();const old=workoutMedia;workoutMedia=null;workoutMediaReady=false;
  if(old)try{old.destroy()}catch{}
}
function youtubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(youtubeLoad)return youtubeLoad;
  youtubeLoad=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let settled=false;
    const previous=window.onYouTubeIframeAPIReady;
    const timeout=setTimeout(()=>finish(Error('Video service did not respond')),12000);
    const finish=error=>{if(settled)return;settled=true;clearTimeout(timeout);window.onYouTubeIframeAPIReady=previous;if(error){script.remove();youtubeLoad=null;reject(error)}else resolve(window.YT)};
    window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')previous();finish()};
    script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>finish(Error('Video service is unavailable'));document.head.appendChild(script);
  });
  return youtubeLoad;
}
function armMediaTimeout(){
  clearTimeout(mediaLoadTimer);const token=workoutPlayback.generation;
  mediaLoadTimer=setTimeout(()=>{if(token!==workoutPlayback.generation||!workoutPlayback.wanted)return;mediaFailure='The video is taking too long to play. Retry, or use the written steps below.';workoutPlayback.event('error',token)},15000);
}
async function loadWorkoutMedia(){
  const token=workoutPlayback.generation,owner=session,clip=currentVideo();
  if(!owner||!workoutPlayback.active)return;
  if(!clip){mediaFailure='An inline video is not available for this saved movement. You can follow its written steps here.';workoutPlayback.event('error',token);return}
  if(navigator.onLine===false||networkAvailable===false){mediaFailure='You’re offline. Your workout and written steps are saved here; videos need internet.';workoutPlayback.event('error',token);return}
  if(!/^https?:$/.test(location.protocol)){mediaFailure='Open the HTTPS app to play videos. Written guidance works in this downloaded preview.';workoutPlayback.event('error',token);return}
  destroyWorkoutMedia();const attempt=mediaAttempt;mediaFailure='';workoutMediaError=null;armMediaTimeout();
  if(clip.src){await nativeWorkoutMedia(clip,token,attempt,owner);return}
  if(clip.vimeo){await vimeoWorkoutMedia(clip,token,attempt,owner);return}
  if(clip.brightcove){await brightcoveWorkoutMedia(clip,token,attempt,owner);return}
  try{
    const YT=await youtubeAPI();
    if(attempt!==mediaAttempt||token!==workoutPlayback.generation||session!==owner||!workoutPlayback.active||!workoutPlayback.wanted)return;
    const host=$('#workout-video-host');if(!host)return;
    host.innerHTML='<div id="workout-youtube"></div>';
    const valid=()=>attempt===mediaAttempt&&token===workoutPlayback.generation&&session===owner&&workoutPlayback.active;
    workoutMedia=new YT.Player('workout-youtube',{
      host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',videoId:clip.videoId,
      playerVars:{playsinline:1,controls:1,rel:0,autoplay:0,origin:location.origin,start:clip.start||0},
      events:{
        onReady:event=>{
          if(!valid()){event.target.destroy();return}
          workoutMedia=event.target;workoutMediaReady=true;
          const frame=event.target.getIframe();frame.setAttribute('title',EX[session.steps[session.index].id].name+' — human demonstration');frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
          videoMuted?event.target.mute():event.target.unMute();
          if(workoutPlayback.wanted&&!document.hidden)event.target.playVideo();
          else event.target.pauseVideo();
          // Stop if the media stalls without delivering a BUFFERING event.
          let lastTime=-1,lastMotion=performance.now();
          mediaWatchdog=setInterval(()=>{
            if(!valid()||!workoutPlayback.wanted){lastTime=-1;lastMotion=performance.now();return}
            if(!['playing','buffering'].includes(workoutPlayback.status))return;
            const time=event.target.getCurrentTime();
            if(time!==lastTime){lastTime=time;lastMotion=performance.now();if(workoutPlayback.status==='buffering'){clearTimeout(mediaLoadTimer);workoutPlayback.event('playing',token)}}
            else if(workoutPlayback.status==='playing'&&performance.now()-lastMotion>1800){workoutPlayback.event('buffering',token);armMediaTimeout()}
          },500);
        },
        onStateChange:event=>{
          if(!valid())return;
          if(event.data===1){clearTimeout(mediaLoadTimer);workoutPlayback.event('playing',token)}
          if(event.data===3){workoutPlayback.event('buffering',token);if(workoutPlayback.wanted)armMediaTimeout()}
          if(event.data===2&&workoutPlayback.status==='playing')workoutPlayback.event('paused',token);
          if(event.data===0)workoutPlayback.event('ended',token);
        },
        onAutoplayBlocked:()=>{if(valid()){clearTimeout(mediaLoadTimer);workoutPlayback.event('blocked',token)}},
        onError:event=>{if(valid()){workoutMediaError={code:event?.data,videoId:clip.videoId};clearMediaTimers();mediaFailure='This video cannot play here right now. Retry, or stay in the workout with written guidance.';workoutPlayback.event('error',token)}}
      }
    });
  }catch{if(attempt===mediaAttempt&&token===workoutPlayback.generation){mediaFailure='The video service could not load. Retry, or use the written guidance here.';workoutPlayback.event('error',token)}}
}
function playerStage(step){return step.phase==='Warm-up'?0:step.phase==='Cool-down'?2:1}
renderSession=function(){
  if(!session)return;
  workoutPlayback.close();destroyWorkoutMedia();mediaFailure='';
  const s=session,step=s.steps[s.index],rest=step.id==='rest',e=EX[step.id],next=s.steps[s.index+1],stage=playerStage(step);
  const remaining=s.steps.slice(s.index+1).reduce((sum,x)=>sum+x.seconds,0)+s.remaining/1000;
  $('#session-dialog').setAttribute('data-player','follow');
  $('#session-content').innerHTML=`<div class="follow-player">
    <header class="follow-header"><div><span class="label">DAY ${String(s.day).padStart(2,'0')} · ${s.mode==='short'?'SHORT SESSION':'YOUR WORKOUT'}</span><p>${Math.ceil(remaining/60)} min left · ${s.index+1} / ${s.steps.length} intervals</p></div><button class="icon-btn" id="session-exit" aria-label="Save session and close">${icon('close')}</button></header>
    <div class="follow-stages" aria-label="Workout stages">${['Warm-up','Workout','Cool-down'].map((name,i)=>`<span class="${i===stage?'current':i<stage?'complete':''}" ${i===stage?'aria-current="step"':''}><b>${i<stage?'✓':i+1}</b>${name}</span>`).join('')}</div>
    <div class="follow-heading"><span id="session-status" role="status">${esc(step.phase)}</span><h2 id="session-title">${rest?'Take a breather':esc(e.name)}</h2></div>
    <div class="follow-media ${rest?'is-rest':''}" id="workout-video-host" aria-label="${rest?'Rest interval':'Exercise video'}">${rest?'<div class="rest-message"><span>RECOVER</span><h3>Relax. Breathe.</h3><p>Let your muscles recover before the next movement.</p></div>':'<div class="video-placeholder"><span class="play-outline">▷</span><p>Your demonstration plays here</p></div>'}</div>
    <div class="follow-media-message" id="video-message" role="status"></div>
    ${!rest&&currentVideo()?.provider?`<p class="follow-credit">Video: ${esc(currentVideo().provider)}</p>`:''}
    <div class="follow-clock"><div class="timer" id="timer" aria-label="Time remaining">${formatTime(s.remaining)}</div><div><b>${rest?'Recovery time':step.phase==='Cool-down'?'Release & recover':'Move at your pace'}</b><p>${step.round?'Round '+step.round:'Stay comfortable'}</p></div></div>
    <p class="follow-cue">${rest?'Relax, breathe and get set for the next move.':esc(e.cue)}</p>
    <div class="follow-actions"><button class="btn primary" id="timer-toggle">${icon('play')} Start workout</button><button class="btn outline" id="timer-next" aria-label="${next?'Skip this interval':'Finish early'}">${next?'Skip':'Finish'}</button></div>
    <div class="follow-next"><span>UP NEXT</span><b>${next?esc(next.id==='rest'?'Rest & reset':EX[next.id].name):'Save your check-in'}</b>${next?`<small>${next.seconds}s ${icon('arrow')}</small>`:''}</div>
    ${rest?'':`<details class="follow-instructions" id="player-instructions"><summary>Technique & easier option</summary><ol class="steps">${e.steps.map(text=>'<li>'+esc(text)+'</li>').join('')}</ol><div class="easier"><b>Make it easier</b><br>${esc(e.easy)}</div></details>`}
    <div class="follow-options">${rest?'':`<button class="text-btn" id="video-mute" aria-pressed="${!videoMuted}">${videoMuted?'Video sound off':'Video sound on'}</button><button class="text-btn" id="written-mode">Use written guidance</button><button class="text-btn" id="video-mode" hidden>Return to video</button>`}<button class="text-btn" id="voice-toggle" aria-pressed="${state.experience.voice}" ${voiceAvailable()?'':'disabled'}>${state.experience.voice?'Voice cues on':'Voice cues off'}</button></div>
    <p class="follow-footnote">${state.autoAdvance?'Intervals continue automatically.':'Auto-next is off in Settings.'} Pause whenever you need. Stop for pain or dizziness.</p>
    <div class="screen-controls"><p class="small" id="screen-message"></p><button class="text-btn" id="screen-toggle" type="button"></button></div>
  </div>`;
  workoutPlayback.select(rest||s.guidanceMode==='written'?'timer':'video');
  if(s.guidanceMode==='written')showWrittenGuidance();
  updateScreenMessage();updateTimerUI();
  $('#session-dialog').scrollTop=0;
  // Chrome queues the details toggle event. Pause synchronously on activation
  // so reading instructions never spends another timer tick.
  $('#player-instructions')?.querySelector?.('summary')?.addEventListener('click',pause);
  $('#player-instructions')?.addEventListener('toggle',()=>{if($('#player-instructions')?.open&&session&&!session.paused)pause()});
};
function showWrittenGuidance(){
  if(!session||session.steps[session.index].id==='rest')return;
  const e=EX[session.steps[session.index].id];
  $('#workout-video-host').innerHTML=`<div class="written-guidance"><span class="label">WRITTEN GUIDANCE</span><h3>${esc(e.name)}</h3><p>${esc(e.steps[0])}</p><p>${esc(e.cue)}</p></div>`;
  $('#written-mode').hidden=true;$('#video-mode').hidden=false;$('#video-mute').hidden=true;
  $('#session-dialog').scrollTop=0;
}
updateTimerUI=function(){
  updateBeforePlayer();if(!session||!$('#timer-toggle')||!workoutPlayback.active)return;
  const gate=workoutPlayback,step=session.steps[session.index],b=$('#timer-toggle'),message=$('#video-message');
  if(!session.awaiting)b.innerHTML=gate.wanted?icon('pause')+' Pause':icon('play')+(gate.status==='error'?'Retry video':gate.status==='blocked'?'Tap to play':session.elapsed===0?'Start workout':'Resume');
  const messages={loading:'Loading video · timer paused',buffering:'Video buffering · timer paused',blocked:'Tap to play. Your timer waits until the video starts.',error:mediaFailure||'Video unavailable · timer paused',ready:'Press Start to follow along',paused:'Paused · continue when you’re ready',playing:gate.kind==='video'?'Follow the demonstration · video sound '+(videoMuted?'off':'on'):step.id==='rest'?'Recovery interval':'Following written guidance'};
  if(message)message.textContent=messages[gate.status]||'';
  const status=$('#session-status');if(status&&!session.awaiting)status.textContent=step.phase+(step.round?' · Round '+step.round:'');
};
pause=function(){workoutPlayback.active?workoutPlayback.pause():clockPauseBeforePlayer()};
toggleTimer=function(){
  if(!session)return;
  if(session.awaiting){advance(false);if(session&&$('#timer-toggle'))workoutPlayback.play();return}
  if(workoutPlayback.wanted)workoutPlayback.pause();else{
    if(workoutPlayback.status==='error'){workoutPlayback.select('video');destroyWorkoutMedia()}
    workoutPlayback.play();
  }
};
startSession=function(mode,resume=false){const previous=session;startBeforePlayer(mode,resume);if(session&&session!==previous&&!resume)workoutPlayback.play()};
advance=function(skipped){const continuePlayback=skipped&&workoutPlayback.wanted;advanceBeforePlayer(skipped);if(continuePlayback&&session&&$('#timer-toggle'))workoutPlayback.play()};
showFinish=function(recovery=false){workoutPlayback.close();destroyWorkoutMedia();$('#session-dialog').removeAttribute('data-player');finishBeforePlayer(recovery)};
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  // The existing handler selects the day first. Completed/recovery days remain
  // reviewable, and the original readiness / spacing checks are still required.
  if(button.dataset.day&&button.id!=='save-checkin'&&!state.completed[selected]&&getDay(selected).type!=='rest'&&!session){
    if(state.draft?.day===selected)startSession('full',true);else startSession('full');
  }
  if(button.id==='written-mode'&&session){pause();destroyWorkoutMedia();session.guidanceMode='written';workoutPlayback.select('timer');showWrittenGuidance();updateTimerUI()}
  if(button.id==='video-mode'&&session){pause();session.guidanceMode='video';renderSession();workoutPlayback.play()}
  if(button.id==='video-mute'&&session){videoMuted=!videoMuted;if(workoutMediaReady)videoMuted?workoutMedia.mute():workoutMedia.unMute();button.setAttribute('aria-pressed',String(!videoMuted));button.textContent=videoMuted?'Video sound off':'Video sound on';updateTimerUI()}
});
document.addEventListener('visibilitychange',()=>{workoutPlayback.visibility(document.hidden)});
window.addEventListener('pagehide',()=>{workoutPlayback.pause();destroyWorkoutMedia()});
window.addEventListener('offline',()=>{if(workoutPlayback.active&&workoutPlayback.kind==='video'){mediaFailure='You’re offline. Your progress is saved. Use written guidance to continue here.';workoutPlayback.event('error')}});
$('#session-dialog').addEventListener('close',()=>{workoutPlayback.close();destroyWorkoutMedia();$('#session-dialog').removeAttribute('data-player')});
