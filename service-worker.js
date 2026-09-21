/* Cache only this app's public static files. Profile data remains in localStorage. */
const PREFIX='form28::'+self.registration.scope+'::';
const CACHE=PREFIX+'release-1.1.0';
const ASSETS=['./index.html','./manifest.webmanifest','./coach-engine.js','./coach.js','./demos.js','./personal.js','./phone.js','./guidance.js','./release.js','./experience.js','./experience.css','./coach.css','./icons/icon-192.png','./icons/icon-512.png'];
const ALLOWED=new Set(ASSETS.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(request.mode==='navigate'){
  // Serve the HTML and its scripts from the same installed release. A network-first
  // document can otherwise load new HTML with cache-first scripts from an old release.
  event.respondWith(caches.open(CACHE).then(cache=>cache.match('./index.html')).then(hit=>hit||fetch(request)));return;
 }
 if(!ALLOWED.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(request).then(hit=>hit||fetch(request))));
});
