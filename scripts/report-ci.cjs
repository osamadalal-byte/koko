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
 const reportPath='test-results/browser-results.json';
 const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{results:[],error:'The browser test report was not produced.'};
 const passed=report.results.length===6&&report.results.every(r=>r.status==='passed');
 const summary='Browser automation results. This does not verify physical iPhone installation or external video playback.\n\n```json\n'+JSON.stringify(report,null,2)+'\n```';
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
 await check('Browser diagnostics',passed?'success':'failure',{title:passed?'All six browser scenarios passed':'Browser checks need attention',summary:summary.slice(0,65000)});
 for(const file of ['iphone-today.jpg','iphone-session.jpg']){
  const filename='test-results/'+file;if(!fs.existsSync(filename))continue;
  const data=fs.readFileSync(filename);
  if(data.length>45000){console.log(`${file}: see full artifact (preview exceeds check output limit).`);continue}
  await check('UI preview: '+file,'neutral',{title:'Captured WebKit iPhone viewport',summary:'Screenshot from the /koko/ deployment-artifact browser scenario. Rendering evidence only; not a physical iPhone test.',text:JSON.stringify({filename:file,mimeType:'image/jpeg',base64:data.toString('base64')})});
 }
 console.log('Browser diagnostics and available UI previews published to GitHub Checks.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
