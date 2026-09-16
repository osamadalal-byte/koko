/* Diagnose Playwright offline emulation separately from a real unavailable origin. */
const {webkit}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const result={date:new Date().toISOString(),platform:process.platform,cases:[]};
async function probe(kind){
 let originDown=false;
 const controlWorker="self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(new Response('<title>Offline control</title><p>Worker response</p>',{headers:{'Content-Type':'text/html'}}))});";
 const server=http.createServer((req,res)=>{
  if(originDown){req.socket.destroy();return}
  if(kind==='control'){
   res.setHeader('Content-Type',req.url==='/worker.js'?'application/javascript':'text/html');
   res.end(req.url==='/worker.js'?controlWorker:"<title>Offline control</title><script>navigator.serviceWorker.register('worker.js')</script>");return;
  }
  const request=new URL(req.url,'http://localhost').pathname;
  const file=path.join(__dirname,'..','dist',request==='/'?'index.html':request);
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(data)});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await webkit.launch(),context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 page.setDefaultTimeout(10000);const url=`http://127.0.0.1:${server.address().port}/`,entry={kind};result.cases.push(entry);
 try{
  await page.goto(url);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  entry.before=await page.evaluate(async()=>({title:document.title,online:navigator.onLine,caches:await caches.keys(),scope:(await navigator.serviceWorker.getRegistration()).scope}));
  await context.setOffline(true);
  try{await page.reload();entry.emulatedOfflineReload={loaded:true,title:await page.title()}}catch(e){entry.emulatedOfflineReload={loaded:false,error:e.message}}
  await context.setOffline(false);await page.goto(url);originDown=true;
  entry.originUnreachable=await page.evaluate(async()=>{try{await fetch('uncached-probe-'+Date.now(),{cache:'no-store'});return false}catch{return true}});
  try{await page.reload();entry.originDownReload={loaded:true,title:await page.title(),appLoaded:await page.evaluate(()=>typeof state!=='undefined'||document.body.textContent.includes('Worker response'))}}catch(e){entry.originDownReload={loaded:false,error:e.message}}
 }catch(e){entry.error=e.message}
 finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
}
(async()=>{for(const kind of ['control','form28'])await probe(kind);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/offline-probe.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))})().catch(e=>{console.error(e);process.exitCode=1});
