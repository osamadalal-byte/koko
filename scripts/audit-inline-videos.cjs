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
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(!pathname.startsWith('/koko/'))return res.writeHead(404).end();
 const file=path.resolve(root,pathname.slice(6)||'index.html');
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/koko/`;
 try{
  for(const [name,type,device] of [['chromium',chromium,{viewport:{width:390,height:844}}],['webkit',webkit,devices['iPhone 13']]]){
   const engine={name,clips:[]};report.engines.push(engine);let browser;
   try{
    browser=await type.launch();const context=await browser.newContext(device);const page=await context.newPage();page.setDefaultTimeout(6000);
    await page.goto(url);const clips=await page.evaluate(()=>Object.entries(WORKOUT_VIDEOS).map(([id,c])=>({id,videoId:c.mediaId||c.videoId,src:c.src||null,start:c.start})));
    for(const clip of clips){
     const row={...clip,played:false,humanReview:'Pending visual inspection'};engine.clips.push(row);
     try{
      await page.evaluate(({id})=>{
       if(session)pause();workoutPlayback.close();destroyWorkoutMedia();state.completed={};state.cycles=[];state.draft=null;selected=1;
       const step={id,seconds:120,phase:['cheststretch','stretch','calfhold','breath'].includes(id)?'Cool-down':'Work',round:0};
       session={day:1,mode:'full',pace:'beginner',steps:[step],index:0,remaining:120000,elapsed:0,skipped:false,awaiting:false,paused:true,last:0};
       renderSession();if(!document.querySelector('#session-dialog').open)document.querySelector('#session-dialog').showModal();
      },clip);
      await page.locator('#timer-toggle').click();
      await page.waitForFunction(()=>(workoutMediaReady&&workoutMedia.getPlayerState()===1&&!session.paused)||['error','blocked'].includes(workoutPlayback.status),{},{timeout:18000});
      const failure=await page.evaluate(()=>['error','blocked'].includes(workoutPlayback.status)?{status:workoutPlayback.status,detail:workoutMediaError}:null);
      if(failure){row.failure=failure;throw Error('Playback refused: '+JSON.stringify(failure))}
      row.before=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),video:workoutMedia.getVideoData(),remaining:session.remaining,duration:workoutMedia.getDuration()}));
      await page.waitForTimeout(1800);
      row.after=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),state:workoutMedia.getPlayerState(),remaining:session.remaining}));
      row.played=row.after.time>row.before.time+.5&&row.after.remaining<row.before.remaining&&row.before.video.video_id===clip.videoId;
      if(!row.played)throw Error('Media identity, advancing frames and workout clock did not agree');
      await page.locator('#timer-toggle').click();await page.waitForTimeout(250);
      const paused=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),remaining:session.remaining,paused:session.paused}));
      await page.waitForTimeout(800);
      const still=await page.evaluate(()=>({time:workoutMedia.getCurrentTime(),remaining:session.remaining,paused:session.paused}));
      row.pauseControl=paused.paused&&still.paused&&still.remaining===paused.remaining&&Math.abs(still.time-paused.time)<.3;
      if(!row.pauseControl)throw Error('Pause did not stop both media and workout clock');
      await page.locator('#timer-toggle').click();
      await page.waitForFunction(()=>workoutMedia.getPlayerState()===1&&!session.paused,{},{timeout:18000});
      row.resumeControl=true;
      row.frames=[];
      // Sample the beginning plus early demonstration positions, always recording
      // actual positions. Review all frames and watch the complete clip before approval.
      for(const seconds of [clip.start,5,10,20]){
       if(seconds>=row.before.duration)continue;
       await page.evaluate(t=>workoutMedia.seekTo(t,true),seconds);await page.waitForTimeout(500);
       const filename=`${name}-${clip.id}-${seconds}.jpg`;
       await page.locator('#workout-video-host').screenshot({path:path.join(out,filename),type:'jpeg',quality:70});
       row.frames.push({file:filename,time:await page.evaluate(()=>workoutMedia.getCurrentTime())});
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
   }catch(error){engine.error=error.message.split('\n')[0];process.exitCode=1}
   finally{if(browser)await browser.close()}
  }
 }finally{await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(report,null,2))}
})().catch(error=>{console.error(error);process.exitCode=1});
