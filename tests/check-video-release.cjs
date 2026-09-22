'use strict';
// Release-only gate. Unit mocks and search results cannot certify a video.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const videos=vm.runInNewContext(fs.readFileSync(path.join(root,'workout-videos.js'),'utf8')+'\nWORKOUT_VIDEOS');
const missing=[];
for(const [id,clip] of Object.entries(videos)){
 const r=clip.review;
 if(!r?.matched||!r.playsInline||!r.reviewedAt||!Number.isFinite(Date.parse(r.reviewedAt))||!r.evidence){missing.push(id);continue}
 const file=path.resolve(root,r.evidence);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(id);continue}
 let evidence;try{evidence=JSON.parse(fs.readFileSync(file,'utf8'))}catch{missing.push(id);continue}
 const row=evidence.clips?.find(c=>c.id===id&&c.videoId===clip.videoId);
 if(!row?.humanReview?.exactVariant||!row.humanReview.demonstrationVisibleAtStart||!row.playback?.chromium||!row.playback.webkit)missing.push(id);
}
if(missing.length){console.error('RELEASE BLOCKED: exact human demonstration, cue point and real Chromium/WebKit inline playback evidence missing for: '+missing.join(', '));process.exitCode=1}
else console.log('PASS: reviewed movement variants, cue points and browser playback evidence for all 18 clips.');
