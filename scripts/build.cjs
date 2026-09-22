const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const assets=['index.html','coach-engine.js','demos.js','personal.js','guidance.js','coach.js','phone.js','release.js','experience.js','experience.css','playback-gate.js','workout-videos.js','workout-player.js','workout-player.css','coach.css','service-worker.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
// Only publish the allowlisted assets, including after a rebuild of an older dist/.
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const file of assets){const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest)}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
// Any app change invalidates the offline cache, without relying on a manual bump.
const hash=crypto.createHash('sha256');
for(const file of assets)hash.update(file).update(fs.readFileSync(path.join(root,file)));
const revision=hash.digest('hex').slice(0,16);
const worker=fs.readFileSync(path.join(out,'service-worker.js'),'utf8').replace(/const CACHE=PREFIX\+'[^']+';/,`const CACHE=PREFIX+'build-${revision}';`);
fs.writeFileSync(path.join(out,'service-worker.js'),worker);
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<html lang="en">','<html lang="en" data-local-preview>').replace('<link rel="manifest" href="manifest.webmanifest">','');
html=html.replace('href="icons/icon-192.png"','href="data:image/png;base64,'+fs.readFileSync(path.join(root,'icons/icon-192.png')).toString('base64')+'"');
html=html.replace(/<link rel="stylesheet" href="(coach|experience|workout-player)\.css">/g,(_,name)=>'<style>\n'+fs.readFileSync(path.join(root,name+'.css'),'utf8')+'\n</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8')+'\n</script>');
fs.writeFileSync(path.join(root,'open-preview.html'),html);
console.log(`Built ${assets.length} static assets and the standalone preview.`);
