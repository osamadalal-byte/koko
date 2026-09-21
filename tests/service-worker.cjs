const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const scope='https://example.test/fitness/',prefix='form28::'+scope+'::',events={},deleted=[],network=[];
const index={text:'cached app'},asset={text:'cached static asset'};let online=true,hit=true,indexHit=true;
const cache={addAll:async paths=>{for(const p of paths)assert(fs.existsSync(path.join(root,p)),'Missing cached asset '+p)},match:async request=>request==='./index.html'?(indexHit?index:undefined):hit?asset:undefined};
const currentCache=prefix+source.match(/const CACHE=PREFIX\+'([^']+)'/)[1];
const context=vm.createContext({URL,Promise,Error,Set,self:{registration:{scope},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[prefix+'old',currentCache,'another-app-cache'],delete:async key=>{deleted.push(key);return true}},fetch:async request=>{network.push(request);if(!online)throw Error('offline');return {ok:true,text:'network response'}}});
vm.runInContext(source,context);
async function lifecycle(name){let work;events[name]({waitUntil:p=>work=p});await work}
async function fetchEvent(url,mode='cors',method='GET'){let answer;events.fetch({request:{url,mode,method},respondWith:p=>answer=p});return answer?await answer:undefined}
(async()=>{
 await lifecycle('install');await lifecycle('activate');assert.deepEqual(deleted,[prefix+'old']);
 assert.equal(await fetchEvent('https://www.youtube.com/embed/video'),undefined);
 assert.equal(await fetchEvent('https://example.test/other/index.html','navigate'),undefined);
 assert.equal(await fetchEvent(scope+'private-api'),undefined);
 assert.equal(await fetchEvent(scope+'coach.js','cors','POST'),undefined);
 assert.equal(await fetchEvent(scope+'coach.js'),asset);assert.equal(network.length,0);
 online=false;assert.equal(await fetchEvent(scope+'index.html','navigate'),index);
 hit=false;await assert.rejects(fetchEvent(scope+'coach.js'),/offline/,'JS failure must not return HTML');
 online=true;const consistent=await fetchEvent(scope+'index.html','navigate');assert.equal(consistent,index,'Online HTML must match the cached script release');
 indexHit=false;const fresh=await fetchEvent(scope+'index.html','navigate');assert.equal(fresh.text,'network response','Missing document falls back to network');
 const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);for(const s of scripts)assert(source.includes("'./"+s+"'"),'Uncached application script '+s);
 console.log('PASS: scoped cache lifecycle, complete asset manifest, offline navigation, no third-party/private-data caching, and no HTML fallback for JavaScript.');
})().catch(error=>{console.error(error);process.exitCode=1});
