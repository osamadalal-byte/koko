const {chromium}=require('playwright');
const fs=require('node:fs');
const paths=['hip-hinge','plank-on-knees','calf-raises','cat-cow','wall-push-ups','knee-push-ups','squats','glute-bridge','bird-dog','heel-slides','scapular-squeezes','marching-in-place','shoulder-rolls','standing-hip-abduction','chest-stretches','upper-back-stretches','calf-stretches','diaphragmatic-breathing'];
async function report(name,data){
 const response=await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/check-runs`,{method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({name:'Media discovery: '+name,head_sha:process.env.GITHUB_SHA,status:'completed',conclusion:'neutral',output:{title:'Public provider media metadata: '+name,summary:'Discovery only. URLs and titles do not certify a demonstration.',text:JSON.stringify(data,null,2).slice(0,65000)}})});
 if(!response.ok)throw Error('Check report HTTP '+response.status);
}
(async()=>{
 const browser=await chromium.launch();const all=[];
 try{for(const slug of paths){
  const row={slug,url:'https://www.hingehealth.com/resources/articles/'+slug+'/',requests:[]};all.push(row);
  const page=await browser.newPage({viewport:{width:900,height:800}});
  page.on('request',request=>{const url=request.url();if(/\.m3u8|\.mp4|stream\.mux|videodelivery|players\.brightcove/.test(url)&&!row.requests.includes(url))row.requests.push(url)});
  try{
   const response=await page.goto(row.url,{waitUntil:'domcontentloaded',timeout:18000});row.status=response?.status();row.title=await page.title();
   if(response?.ok()){
    await page.waitForSelector('video',{timeout:8000}).catch(()=>{});
    row.players=await page.locator('video,mux-player,mux-video,iframe').evaluateAll(els=>els.map(el=>({tag:el.tagName,html:el.outerHTML.slice(0,5000)})));
    row.playbackIds=await page.evaluate(()=>[...document.documentElement.innerHTML.matchAll(/(?:playbackId|playback-id|playback_id)["'\s:=]+([a-zA-Z0-9]+)/g)].map(m=>m[1]));
    const videos=page.locator('video');for(let i=0;i<Math.min(await videos.count(),4);i++){try{await videos.nth(i).scrollIntoViewIfNeeded();await videos.nth(i).evaluate(v=>{v.muted=true;v.play().catch(()=>{})});await page.waitForTimeout(900)}catch{}}
    row.playersAfter=await page.locator('video,mux-player,mux-video').evaluateAll(els=>els.map(el=>({tag:el.tagName,html:el.outerHTML.slice(0,5000)})));
    const ids=new Set([...row.playbackIds,...row.requests.map(u=>u.match(/stream\.mux\.com\/([a-zA-Z0-9]+)\.m3u8/)?.[1]).filter(Boolean)]);
    row.mp4=[];
    for(const id of [...ids].slice(0,5)){
     const url='https://stream.mux.com/'+id+'/medium.mp4';
     try{const res=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(8000)});row.mp4.push({id,url,status:res.status,type:res.headers.get('content-type'),length:res.headers.get('content-length')})}catch(error){row.mp4.push({id,error:error.message})}
    }
   }
  }catch(error){row.error=error.message.split('\n')[0]}
  finally{await page.close();await report(slug,row);console.log(slug,row.status,row.requests.length)}
 }}finally{await browser.close();fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/media-discovery.json',JSON.stringify(all,null,2))}
})().catch(error=>{console.error(error);process.exitCode=1});
