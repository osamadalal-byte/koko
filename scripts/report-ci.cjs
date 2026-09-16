/* Expose the browser report in GitHub Checks as well as the downloadable artifact. */
const fs=require('node:fs');
(async()=>{
 const reportPath='test-results/browser-results.json';
 const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{results:[],error:'The browser test report was not produced.'};
 const passed=report.results.length===6&&report.results.every(r=>r.status==='passed');
 const summary='Browser automation results. This does not verify physical iPhone installation or external video playback.\n\n```json\n'+JSON.stringify(report,null,2)+'\n```';
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
 const response=await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/check-runs`,{
  method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
  body:JSON.stringify({name:'Browser diagnostics',head_sha:process.env.REPORT_HEAD_SHA,status:'completed',conclusion:passed?'success':'failure',output:{title:passed?'All six browser scenarios passed':'Browser checks need attention',summary:summary.slice(0,65000)}})
 });
 if(!response.ok)throw Error(`Could not publish browser diagnostics: HTTP ${response.status}`);
 console.log('Browser diagnostics published to GitHub Checks.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
