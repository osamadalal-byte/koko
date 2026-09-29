'use strict';
// Real provider embeds inside the app; no request routing, fake media or forced
// timer events. Frame samples support a subsequent human movement review.
const {chromium,webkit,devices}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results/inline-video-audit');
fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),scope:'Real public provider media in the built app at /koko/. Playback observations are not exact-variant approval.',engines:[]};
async function reportClip(engine,row){
 if(!process.env.GITHUB_TOKEN)return;
 const response=await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/check-runs`,{method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({name:`Clip observation: ${engine}/${row.id}`,head_sha:process.env.REPORT_HEAD_SHA,status:'completed',conclusion:row.played?'neutral':'failure',output:{title:'Individual playback observation',summary:'Partial diagnostic only; all 18 clips and both engines must still pass. Visual review is separate.',text:JSON.stringify(row,null,2)}})});
 if(!response.ok)throw Error('Could not publish playback diagnostic: HTTP '+response.status);
}
async function contactSheets(page,name,row){
 row.sheets=[];
 for(let offset=0;offset<row.frames.length;offset+=6){
  const frames=row.frames.slice(offset,offset+6).map(f=>({...f,data:fs.readFileSync(path.join(out,f.file)).toString('base64')}));
  const data=await page.evaluate(async frames=>{
   const canvas=document.createElement('canvas');canvas.width=900;canvas.height=Math.ceil(frames.length/3)*220;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   for(let i=0;i<frames.length;i++){const f=frames[i],img=new Image();img.src='data:image/jpeg;base64,'+f.data;await img.decode();const x=(i%3)*300,y=Math.floor(i/3)*220;ctx.drawImage(img,x,y,300,190);ctx.fillStyle='#111';ctx.font='15px sans-serif';ctx.fillText(f.file+' ('+f.time.toFixed(2)+'s)',x+4,y+210)}
   let quality=.65,data;do{data=canvas.toDataURL('image/jpeg',quality);quality-=.08}while(data.length>59000&&quality>.15);return data.split(',')[1];
  },frames);
  const file=`${name}-${row.id}-sheet-${offset/6+1}.jpg`;fs.writeFileSync(path.join(out,file),Buffer.from(data,'base64'));row.sheets.push({file,time:frames[0].time});
 }
}
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
function bounded(promise,ms,label){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),ms)})]).finally(()=>clearTimeout(timer))}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(!pathname.startsWith('/koko/'))return res.writeHead(404).end();
 const file=path.resolve(root,pathname.slice(6)||'index.html');
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=process.env.FORM28_AUDIT_URL||`http://127.0.0.1:${server.address().port}/koko/`;
 report.url=url;
 try{
  await Promise.all([['chromium',chromium,{viewport:{width:390,height:844}}],['webkit',webkit,devices['iPhone 13']]].map(async ([name,type,device])=>{
   const engine={name,clips:[]};report.engines.push(engine);let browser;
   try{
    // Exercise native sound controls with Chromium's normal audio pipeline.
    // Playwright globally mutes headless Chromium unless this default is removed.
    // Autoplay policy and every playback assertion remain unchanged.
    browser=await type.launch(name==='chromium'?{ignoreDefaultArgs:['--mute-audio']}:{});const context=await browser.newContext(device);const page=await context.newPage();page.setDefaultTimeout(6000);
    await page.goto(url);const clips=await page.evaluate(()=>Object.entries(WORKOUT_VIDEOS).sort(([,a],[,b])=>Number(!!b.brightcove)-Number(!!a.brightcove)).map(([id,c])=>({id,videoId:c.mediaId||c.videoId,src:c.src||null,source:c.source,start:c.start,end:c.end??null})));
    for(const clip of clips){
     const row={...clip,played:false,humanReview:'Pending visual inspection'};engine.clips.push(row);
     try{
      await bounded(page.evaluate(({id})=>{
       if(session)pause();workoutPlayback.close();destroyWorkoutMedia();state.completed={};state.cycles=[];state.draft=null;selected=1;
       const step={id,seconds:120,phase:['cheststretch','stretch','calfhold','breath'].includes(id)?'Cool-down':['march','circles','hinge'].includes(id)?'Warm-up':'Work',round:0};
       session={day:1,mode:'full',pace:'beginner',steps:[step],index:0,remaining:120000,elapsed:0,skipped:false,awaiting:false,paused:true,last:0};
       renderSession();if(!document.querySelector('#session-dialog').open)document.querySelector('#session-dialog').showModal();
      },clip),12000,'Preparing the next movement');
      await page.locator('#timer-toggle').click();
      await page.waitForFunction(()=>(workoutMediaReady&&workoutMedia.getPlayerState()===1&&!session.paused)||['error','blocked'].includes(workoutPlayback.status),{},{timeout:18000});
      const failure=await page.evaluate(()=>['error','blocked'].includes(workoutPlayback.status)?{status:workoutPlayback.status,detail:workoutMediaError}:null);
      if(failure){row.failure=failure;throw Error('Playback refused: '+JSON.stringify(failure))}
      row.before=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),video:workoutMedia.getVideoData(),remaining:session.remaining,duration:workoutMedia.getDuration()}));
      await page.waitForTimeout(1800);
      row.after=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),state:workoutMedia.getPlayerState(),remaining:session.remaining}));
      row.played=row.before.time>=clip.start-.1&&row.after.time>row.before.time+.5&&row.after.remaining<row.before.remaining&&row.before.video.video_id===clip.videoId;
      if(!row.played)throw Error('Media identity, advancing frames and workout clock did not agree');
      if(['march','cheststretch'].includes(clip.id)){const file=`${name}-player-${clip.id}.jpg`;await page.screenshot({path:path.join(out,file),type:'jpeg',quality:65,scale:'css'});row.screens=[{file,time:row.after.time}];}
      // Hold the real press across at least one 200 ms timer render.
      await page.locator('#timer-toggle').click({delay:350});await page.waitForTimeout(250);
      const paused=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),remaining:session.remaining,paused:session.paused,wanted:workoutPlayback.wanted,status:workoutPlayback.status}));
      await page.waitForTimeout(800);
      const still=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),remaining:session.remaining,paused:session.paused,wanted:workoutPlayback.wanted,status:workoutPlayback.status}));
      row.pauseObservation={paused,still};
      row.pauseControl=paused.paused&&still.paused&&still.remaining===paused.remaining&&Math.abs(still.time-paused.time)<.3;
      if(!row.pauseControl)throw Error('Pause did not stop both media and workout clock');
      await page.locator('#timer-toggle').click();
      await page.waitForFunction(()=>workoutMedia.getPlayerState()===1&&!session.paused,{},{timeout:18000});
      row.resumeControl=true;
      row.demoPace=await page.evaluate(()=>{const v=document.querySelector('#workout-video-host video'),id=session.steps[session.index].id;return {id,requested:demoRate(id),actual:v.playbackRate,pitch:v.preservesPitch??v.webkitPreservesPitch}});
      if(row.demoPace.actual!==row.demoPace.requested||row.demoPace.pitch!==true)throw Error('Demo pace or voice pitch preservation failed');
      if(clip.id==='march'){
       // Native control changes emit volumechange, independently of our button.
       await page.evaluate(()=>{state.experience.voice=true;document.querySelector('#session-title').addEventListener('click',()=>{document.querySelector('#workout-video-host video').muted=false},{once:true})});
       await page.locator('#session-title').click();
       await page.waitForFunction(()=>!state.experience.voice&&!videoMuted&&document.querySelector('#video-mute').getAttribute('aria-pressed')==='true');
       await page.locator('#workout-video-host video').evaluate(v=>{v.muted=true});
       await page.waitForFunction(()=>videoMuted&&document.querySelector('#video-mute').getAttribute('aria-pressed')==='false');
       row.nativeSoundControl=true;
       await page.locator('#workout-pace').selectOption('1');
       if(await page.locator('#workout-video-host video').evaluate(v=>v.playbackRate)!==1)throw Error('Original pace control failed');
       await page.locator('#workout-pace').selectOption('1.25');
       await page.evaluate(()=>workoutMedia.seekTo(3));
       await page.waitForFunction(()=>{const v=document.querySelector('#workout-video-host video');return !v.seeking&&v.readyState>=3&&v.playbackRate===1.25&&workoutPlayback.status==='playing'});
       await page.waitForTimeout(1500);
       const start=await page.evaluate(()=>{
        const v=document.querySelector('#workout-video-host video');
        window.tempoFrames=[];window.tempoSamples=[];
        const frame=(now,meta)=>{tempoFrames.push({wall:now,display:meta.expectedDisplayTime,media:meta.mediaTime});window.tempoFrame=v.requestVideoFrameCallback(frame)};
        window.tempoFrame=v.requestVideoFrameCallback(frame);
        window.tempoPoll=setInterval(()=>tempoSamples.push({wall:performance.now(),media:v.currentTime,paused:v.paused,seeking:v.seeking,ready:v.readyState,status:workoutPlayback.status,rate:v.playbackRate}),250);
        return {media:v.currentTime,wall:performance.now(),remaining:session.remaining,rate:v.playbackRate};
       });
       // Five seconds averages the decoder/audio clock's short scheduling
       // bursts, while remaining inside the same reviewed demonstration loop.
       await page.waitForTimeout(5000);
       const end=await page.evaluate(()=>{
        const v=document.querySelector('#workout-video-host video');clearInterval(tempoPoll);v.cancelVideoFrameCallback(tempoFrame);
        return {media:v.currentTime,wall:performance.now(),remaining:session.remaining,rate:v.playbackRate};
       });
       const seconds=(end.wall-start.wall)/1000;
       const observations=await page.evaluate(()=>({frames:tempoFrames,samples:tempoSamples})),first=observations.frames[0],last=observations.frames.at(-1);
       row.tempoTiming={start,end,videoRatio:(end.media-start.media)/seconds,timerRatio:(start.remaining-end.remaining)/(seconds*1000),frameRatio:first&&last?(last.media-first.media)/((last.display-first.display)/1000):null,...observations};
       if(row.tempoTiming.videoRatio<1.12||row.tempoTiming.videoRatio>1.4||row.tempoTiming.timerRatio<.88||row.tempoTiming.timerRatio>1.12)throw Error('Brisk video and real-time workout clock diverged');
      }

      row.frames=[];
      // Sample the beginning plus early demonstration positions, always recording
      // actual positions. These are visual frame samples, not a full audiovisual review.
      const sampleTimes=clip.end?[...Array.from({length:Math.ceil((clip.end-clip.start)/2)},(_,i)=>clip.start+i*2),clip.end-.8]:[clip.start,10,20,30,40,50,...(['march','circles','kneepush'].includes(clip.id)?[60,75,90,105,120,140]:[])];
      for(const seconds of [...new Set(sampleTimes)]){
       if(seconds>=row.before.duration)continue;
       await page.evaluate(t=>workoutMedia.seekTo(t,true),seconds);await page.waitForTimeout(500);
       const filename=`${name}-${clip.id}-${seconds}.jpg`;
       await page.locator('#workout-video-host').screenshot({path:path.join(out,filename),type:'jpeg',quality:70});
       row.frames.push({file:filename,time:await page.evaluate(()=>workoutMedia.getCurrentTime())});
      }
      await contactSheets(page,name,row);
      if(clip.end){
       await page.evaluate(t=>workoutMedia.seekTo(t,true),clip.end-.5);
       await page.waitForFunction(start=>workoutMedia.getCurrentTime()>=start-.1&&workoutMedia.getCurrentTime()<start+2&&!session.paused,clip.start,{timeout:18000});
       row.loopControl=await page.evaluate(()=>session.index===0&&workoutPlayback.wanted);
       if(!row.loopControl)throw Error('The demonstration did not repeat inside the same workout interval');
      }
     }catch(error){
      row.played=false;
      row.error=error.message.split('\n')[0];row.playerMessage=await page.locator('#video-message').textContent().catch(()=>null);
      row.frames=row.frames||[];
      for(const frame of page.frames().filter(f=>/youtube/.test(f.url())))row.providerText=await frame.locator('body').innerText({timeout:2000}).then(t=>t.slice(0,1200)).catch(()=>null);
      const file=`${name}-${clip.id}-failure.jpg`;
      await page.locator('#workout-video-host').screenshot({path:path.join(out,file),type:'jpeg',quality:55}).then(()=>row.frames.push({file,time:null})).catch(()=>{});
     }
     if(!row.played)process.exitCode=1;
     fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(report,null,2));
     await reportClip(name,row);
     console.log(JSON.stringify({engine:name,id:clip.id,played:row.played,error:row.error}));
    }
    // Actual provider changes and the original clock, with short test intervals.
    // No media stubs, manual advance, or synthetic tick calls are used here.
    await page.evaluate(()=>{
     pause();workoutPlayback.close();destroyWorkoutMedia();state.autoAdvance=true;
     const steps=[['march','Warm-up'],['push','Work'],['rest','Rest'],['cheststretch','Cool-down']].map(([id,phase])=>({id,phase,seconds:3,round:0}));
     session={day:1,mode:'full',pace:'beginner',steps,index:0,remaining:3000,elapsed:0,skipped:false,awaiting:false,paused:true,last:0};renderSession();
     window.observedFlow=[];window.flowPoll=setInterval(()=>{if(session&&document.querySelector('#timer-toggle')&&!session.paused){const phase=session.steps[session.index].phase;if(!observedFlow.includes(phase))observedFlow.push(phase)}},100);
    });
    await page.locator('#timer-toggle').click();
    await page.waitForSelector('#save-checkin',{timeout:70000});
    engine.flow=await page.evaluate(()=>{clearInterval(flowPoll);return {phases:observedFlow,dialogs:document.querySelectorAll('dialog[open]').length,path:location.pathname}});
    if(engine.flow.phases.join(',')!=='Warm-up,Work,Rest,Cool-down'||engine.flow.dialogs!==1||engine.flow.path!=='/koko/')throw Error('Continuous real-video session did not complete in one screen');
    engine.flow.passed=true;
    // Use the actual library buttons, not direct calls to the preview loader.
    await page.locator('#finish-exit').click();
    await page.locator('.nav [data-tab="moves"]').click();
    const previewURL=page.url(),savedBefore=await page.evaluate(()=>JSON.stringify(state));let popups=0;
    page.on('popup',()=>popups++);engine.previews=[];
    for(const clip of clips){
     const preview={id:clip.id,passed:false};engine.previews.push(preview);
     await page.locator(`[data-exercise="${clip.id}"]`).click();
     await page.waitForFunction(()=>exercisePreview?.status==='playing',{},{timeout:20000});
     preview.demoPace=await page.evaluate(()=>{const v=document.querySelector('#preview-video-host video');return {requested:demoRate(exercisePreview.id),actual:v.playbackRate}});
     if(preview.demoPace.actual!==preview.demoPace.requested)throw Error('Preview demo pace failed: '+clip.id);
     const before=await page.evaluate(()=>exercisePreview.media.time());await page.waitForTimeout(700);
     const after=await page.evaluate(()=>exercisePreview.media.time());Object.assign(preview,{before,after,start:clip.start,end:clip.end});
     if(before<clip.start-.1||after<=before+.2)throw Error('Preview is not advancing inside its reviewed excerpt: '+clip.id);
     if(await page.locator('#detail-dialog a[href], #detail-dialog iframe').count())throw Error('Preview exposes an external page: '+clip.id);
     await page.locator('#preview-toggle').click();await page.waitForTimeout(250);
     const paused=await page.evaluate(()=>exercisePreview.media.time());await page.waitForTimeout(500);
     if(Math.abs(await page.evaluate(()=>exercisePreview.media.time())-paused)>.25)throw Error('Preview pause failed: '+clip.id);
     await page.locator('#preview-toggle').click();await page.waitForFunction(()=>exercisePreview?.status==='playing');
     // Page-cache suspension keeps a resumable controller and never autoplays.
     await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
     const hiddenAt=await page.evaluate(()=>exercisePreview.media.time());await page.waitForTimeout(500);
     if(await page.evaluate(()=>exercisePreview.wanted)||Math.abs(await page.evaluate(()=>exercisePreview.media.time())-hiddenAt)>.25)throw Error('Preview did not pause on page suspension: '+clip.id);
     await page.locator('#preview-toggle').click();await page.waitForFunction(()=>exercisePreview?.status==='playing');
     await page.evaluate(end=>exercisePreview.media.seek(end-.4),clip.end);
     await page.waitForFunction(start=>exercisePreview.media.time()>=start-.1&&exercisePreview.media.time()<start+2&&exercisePreview.status==='playing',clip.start,{timeout:18000});
     await page.locator('#preview-restart').click();
     await page.waitForFunction(start=>exercisePreview.media.time()>=start+.6&&exercisePreview.media.time()<start+2.5&&exercisePreview.status==='playing',clip.start);
     preview.videoBox=await page.locator('#preview-video-host video').first().evaluate(v=>({width:v.getBoundingClientRect().width,height:v.getBoundingClientRect().height,videoWidth:v.videoWidth,videoHeight:v.videoHeight,seeking:v.seeking,readyState:v.readyState}));
     if(preview.videoBox.width<100||preview.videoBox.height<100||!preview.videoBox.videoWidth||preview.videoBox.seeking||preview.videoBox.readyState<2)throw Error('Preview has no visible decoded video frame: '+clip.id);
     if(['cheststretch','stretch','calfhold'].includes(clip.id)){
      const file=`${name}-preview-${clip.id}.jpg`;await page.screenshot({path:path.join(out,file),type:'jpeg',quality:55,scale:'css'});
      engine.clips.find(c=>c.id===clip.id).screens??=[];engine.clips.find(c=>c.id===clip.id).screens.push({file,time:await page.evaluate(()=>exercisePreview.media.time())});
     }
     await page.locator('[data-close="detail-dialog"]').click();
     await page.waitForFunction(()=>exercisePreview===null&&document.querySelector('#detail-content').innerHTML==='');
     if(page.url()!==previewURL||popups!==0||context.pages().length!==1)throw Error('Preview navigated out of the app: '+clip.id);
     Object.assign(preview,{passed:true,pause:true,replay:true,loop:true,noNavigation:true,disposed:true,pageHidePause:true});
    }
    if(await page.evaluate(()=>JSON.stringify(state))!==savedBefore)throw Error('Preview changed saved workout progress');
    engine.previewFlow={passed:true,count:engine.previews.length,popups,path:new URL(page.url()).pathname,progressUnchanged:true};

   }catch(error){engine.error=error.message.split('\n')[0];process.exitCode=1}
   finally{if(browser)await browser.close()}
  }));
 }finally{await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(report,null,2))}
})().catch(error=>{console.error(error);process.exitCode=1});
