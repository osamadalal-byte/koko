const fs=require('node:fs');
async function check(name,conclusion,output){
 const response=await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/check-runs`,{method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({name,head_sha:process.env.GITHUB_SHA,status:'completed',conclusion,output})});
 if(!response.ok)throw Error(`Report publication failed: HTTP ${response.status}`);
}
(async()=>{
 const file='test-results/live-results.json',report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{error:'No live report produced'};
 const passed=!report.error&&report.assets?.length===13&&report.browsers?.length===2&&report.browsers.every(r=>r.status==='passed');
 const summary='Live HTTPS checks; physical iPhone installation and complete video verification remain separate.\n\n```json\n'+JSON.stringify(report,null,2)+'\n```';
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
 await check('Live Pages verification',passed?'success':'failure',{title:passed?'Deployed app passed live checks':'Live checks need attention',summary});
 for(const file of ['live-webkit-iphone.jpg','live-webkit-iphone-session.jpg']){
  const path='test-results/'+file;if(!fs.existsSync(path))continue;const bytes=fs.readFileSync(path);if(bytes.length>45000)continue;
  await check('Live preview: '+file,'neutral',{title:'Live HTTPS app in WebKit iPhone emulation',summary:'Rendering evidence, not a physical iPhone test.',text:JSON.stringify({filename:file,mimeType:'image/jpeg',base64:bytes.toString('base64')})});
 }
})().catch(error=>{console.error(error.message);process.exitCode=1});
