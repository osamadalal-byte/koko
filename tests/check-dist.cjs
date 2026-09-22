/* Checks the actual deployment artifact over HTTP at / and a GitHub Pages repository path. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const assets=['index.html','coach-engine.js','demos.js','personal.js','guidance.js','coach.js','phone.js','release.js','experience.js','experience.css','playback-gate.js','workout-videos.js','workout-player.js','workout-player.css','coach.css','service-worker.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
const actual=fs.readdirSync(dist,{recursive:true}).filter(f=>fs.statSync(path.join(dist,f)).isFile()).sort();
assert.deepEqual(actual,[...assets,'.nojekyll'].sort(),'Only release assets may be published');
const hash=crypto.createHash('sha256');for(const file of assets)hash.update(file).update(fs.readFileSync(path.join(root,file)));
const revision=hash.digest('hex').slice(0,16),worker=fs.readFileSync(path.join(dist,'service-worker.js'),'utf8');
assert(worker.includes(`const CACHE=PREFIX+'build-${revision}';`),'Offline cache revision matches the built source');
for(const file of assets.filter(f=>f!=='service-worker.js'))assert.deepEqual(fs.readFileSync(path.join(dist,file)),fs.readFileSync(path.join(root,file)),`Stale build: ${file}`);
const cached=vm.runInNewContext(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]);
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const references=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!/^https?:|^data:/.test(x));
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
(async()=>{
 for(const basePath of ['/','/koko/']){
  const server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://local').pathname;
   if(!pathname.startsWith(basePath))return res.writeHead(404).end();
   const file=path.resolve(dist,pathname.slice(basePath.length)||'index.html');
   if(!file.startsWith(dist+path.sep))return res.writeHead(403).end();
   fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data)});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}${basePath}`;
  try{
   const document=await fetch(base);assert.equal(document.status,200);assert((await document.text()).includes('FORM'));
   const manifest=await (await fetch(new URL('manifest.webmanifest',base))).json();
   assert.equal(new URL(manifest.scope,base).href,base);assert.equal(manifest.display,'standalone');
   for(const ref of new Set([...references,...cached,manifest.start_url,...manifest.icons.map(i=>i.src)])){
    const url=new URL(ref,base);assert(url.href.startsWith(base),`Asset escapes repository path: ${ref}`);
    const response=await fetch(url);assert.equal(response.status,200,`Asset failed: ${url.pathname}`);
    const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.length>0);
    if(url.pathname.endsWith('.js'))assert.match(response.headers.get('content-type'),/javascript/);
   }
   const missing=await fetch(new URL('missing.js',base));assert.equal(missing.status,404);
   console.log(`PASS: dist over HTTP at ${basePath}, manifest, icons, scripts, styles and offline asset paths.`);
  }finally{await new Promise(resolve=>server.close(resolve))}
 }
 console.log('PASS: clean deployment allowlist, current source bytes and content-derived cache revision. This is not a browser or HTTPS deployment test.');
})().catch(error=>{console.error(error);process.exitCode=1});
