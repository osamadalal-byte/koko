/* Expose browser diagnostics and small UI previews in GitHub Checks. Full images stay in artifacts. */
const fs=require('node:fs');
async function check(name,conclusion,output){
 const response=await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/check-runs`,{
  method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
  body:JSON.stringify({name,head_sha:process.env.REPORT_HEAD_SHA,status:'completed',conclusion,output})
 });
 if(!response.ok)throw Error(`Could not publish ${name}: HTTP ${response.status}`);
}
(async()=>{
 if(process.argv.includes('--inline-only')){
  const dir='test-results/inline-video-audit',file=dir+'/observations.json';
  if(!fs.existsSync(file))throw Error('Inline audit did not produce a report');
  const audit=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const engine of audit.engines){
   const pass=engine.clips.length===18&&engine.clips.every(c=>c.played)&&engine.flow?.passed===true;
   await check('Inline playback: '+engine.name,pass?'success':'failure',{title:'Actual embedded video playback — '+engine.name,summary:'Observed media progress only. Human variant and cue points require visual review.',text:JSON.stringify(engine,null,2).slice(0,65000)});
   for(const clip of engine.clips)for(const frame of (clip.sheets?.length?clip.sheets:clip.frames||[])){
    const bytes=fs.readFileSync(dir+'/'+frame.file);if(bytes.length>45000)continue;
    await check('Inline frame: '+frame.file,'neutral',{title:clip.id+' at '+frame.time+' seconds',summary:'Actual provider player screenshot. This does not certify a human demonstration or variant.',text:JSON.stringify({filename:frame.file,mimeType:'image/jpeg',base64:bytes.toString('base64')})});
   }
  }
  return;
 }
 const reportPath='test-results/browser-results.json';
 const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{results:[],error:'The browser test report was not produced.'};
 const passed=report.results.length===6&&report.results.every(r=>r.status==='passed');
 const summary='Browser automation results. This does not verify physical iPhone installation or external video playback.\n\n```json\n'+JSON.stringify(report,null,2)+'\n```';
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
 if(!process.argv.includes('--video-only'))await check('Browser diagnostics',passed?'success':'failure',{title:passed?'All six browser scenarios passed':'Browser checks need attention',summary:summary.slice(0,65000)});
  if(fs.existsSync('test-results/offline-probe.json'))await check('Offline diagnostic control','neutral',{title:'Independent worker and unavailable-origin comparison',summary:'Diagnostic evidence; the browser release gate remains unchanged.',text:fs.readFileSync('test-results/offline-probe.json','utf8')});
  const auditPath='test-results/video-browser-audit.json';
  if(fs.existsSync(auditPath)){
    const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
    await check('Video source inspection','neutral',{title:'Source-page and playback observations; visual matching is separate',summary:'These observations do not certify human instruction or exact movement variants.',text:JSON.stringify({date:audit.date,scope:audit.scope,pages:audit.pages},null,2).slice(0,65000)});
  }
  for(const file of ['iphone-today.jpg','iphone-session.jpg','iphone-setup.jpg','iphone-library.jpg','iphone-progress.jpg',...fs.readdirSync('test-results').filter(f=>/^video-.*\.jpg$/.test(f))]){
  const filename='test-results/'+file;if(!fs.existsSync(filename))continue;
  const data=fs.readFileSync(filename);
  if(data.length>45000){console.log(`${file}: see full artifact (preview exceeds check output limit).`);continue}
    const video=file.startsWith('video-');
    await check((video?'Video frame: ':'UI preview: ')+file,'neutral',{title:video?'Captured external media frame':'Captured WebKit iPhone viewport',summary:video?'Captured while media time advanced. Visually review before claiming an exact human movement match.':'Screenshot from the /koko/ deployment-artifact browser scenario. Rendering evidence only; not a physical iPhone test.',text:JSON.stringify({filename:file,mimeType:'image/jpeg',base64:data.toString('base64')})});
 }
 console.log('Browser diagnostics and available UI previews published to GitHub Checks.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
