/* Live provider inspection. A playing media element alone does not prove a human/variant match. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const sources=JSON.parse(fs.readFileSync('validation/local-2026-09-16/video-audit.json','utf8')).entries;
const report={date:new Date().toISOString(),scope:'Public source-page and media inspection in Chromium on GitHub Actions. Human technique and exact variant require visual review of evidence.',pages:[],exercises:[]};
fs.mkdirSync('test-results',{recursive:true});
(async()=>{
  const browser=await chromium.launch();
  try{
    for(const url of [...new Set(sources.map(s=>s.embed?'https://www.youtube.com/watch?v='+s.embed:s.url))]){
      const ids=sources.filter(s=>(s.embed?'https://www.youtube.com/watch?v='+s.embed:s.url)===url).map(s=>s.id);
      const entry={ids,url,playbackObserved:false};report.pages.push(entry);
      const context=await browser.newContext({viewport:{width:960,height:760}});
      const page=await context.newPage();page.setDefaultTimeout(3500);
      try{
        const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
        entry.httpStatus=response?.status();entry.finalURL=page.url();
        await page.waitForTimeout(1500);
        entry.title=await page.title();
        entry.headings=await page.locator('h1,h2,h3').allTextContents();
        entry.iframes=await page.locator('iframe').evaluateAll(es=>es.map(e=>({title:e.title,src:e.src})));
        entry.pageExcerpt=(await page.locator('body').innerText()).slice(0,700);
        entry.media=[];
        for(const frame of page.frames()){
          const videos=frame.locator('video');
          for(let i=0;i<await videos.count();i++){
            const video=videos.nth(i);
            try{
              await video.scrollIntoViewIfNeeded();
              const before=await video.evaluate(async v=>{v.muted=true;let playError=null;try{await Promise.race([v.play(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Playback timeout')),4000))])}catch(e){playError=e.message}return {src:v.currentSrc,time:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:null,readyState:v.readyState,error:playError}});
              await page.waitForTimeout(2200);
              const after=await video.evaluate(v=>({time:v.currentTime,readyState:v.readyState,paused:v.paused,width:v.videoWidth,height:v.videoHeight}));
              const observed=after.time>before.time+0.5&&after.width>0;
              entry.media.push({frame:frame.url(),before,after,observed});
              if(observed){
                entry.playbackObserved=true;
                const filename=`video-${ids[0]}-${entry.media.length}.jpg`;
                await video.screenshot({path:'test-results/'+filename,type:'jpeg',quality:45});
                entry.media.at(-1).screenshot=filename;
              }
            }catch(error){entry.media.push({frame:frame.url(),error:error.message.split('\n')[0]})}
          }
        }
      }catch(error){entry.error=error.message.split('\n')[0]}
      finally{await context.close()}
      console.log(JSON.stringify({ids,status:entry.httpStatus,playbackObserved:entry.playbackObserved,error:entry.error}));
    }
    report.exercises=sources.map(source=>({id:source.id,name:source.name,page:report.pages.find(p=>p.ids.includes(source.id)),exactFilmedVariant:'Requires visual review; not automatically inferred',humanDemonstration:'Requires visual review; not automatically inferred'}));
  }finally{await browser.close();fs.writeFileSync('test-results/video-browser-audit.json',JSON.stringify(report,null,2))}
})().catch(error=>{console.error(error);process.exitCode=1});
