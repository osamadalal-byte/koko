'use strict';
/* Individual clip candidates, researched 2026-09-22. Search titles are NOT a
   visual review. Every entry must pass check-video-release.cjs before Pages.
   Keep the existing provider library intact while reviewing these replacements.
   Only public provider embeds are used; media is never downloaded or cached. */
const WORKOUT_VIDEOS={
  march:{videoId:'_Ox0N-Ab3Sc',title:'Marching on the Spot',variant:'Standing easy march, no equipment'},
  circles:{videoId:'Bv8QPOs7xks',title:'NUHS Physiotherapy - Shoulder Rolls',variant:'Standing shoulder rolls, relaxed arms'},
  hinge:{videoId:'2W_gXhut5S8',title:'How to Do a Hip Hinge: A Guide from Physical Therapists',variant:'Standing unweighted hip hinge'},
  side:{videoId:'oKzLYBh4Ui0',title:'Hip abduction in standing',variant:'Supported standing side leg raise',source:'https://www.southtees.nhs.uk/resources/hip-abduction-in-standing/'},
  push:{videoId:'kmzcmFZ9NyY',title:'Wall press-up',variant:'Standing press-up against a solid wall',source:'https://www.southtees.nhs.uk/resources/combined-press-ups/'},
  kneepush:{videoId:'LD9qrH7o2fY',title:'Knee-supported press-up',variant:'Floor press-up with knees supported',source:'https://www.southtees.nhs.uk/resources/combined-press-ups/'},
  squat:{videoId:'L61HQqjYFdQ',title:'How to Do Squats: A Guide from Physical Therapists',variant:'Bodyweight squat, no weights or chair'},
  bridge:{videoId:'iZ611vwxI4I',title:'Bridge - Spine School',variant:'Supine two-leg bridge',source:'https://www.nuh.nhs.uk/exercise-videos-spine-school/'},
  bird:{videoId:'xo7Qpb_NTKE',title:'Bird dog',variant:'On hands and knees, opposite arm and leg'},
  dead:{videoId:'t2sYmCjr7Hs',title:'Trans Abdominal Heel Slide',variant:'Supine heel slide with heel supported on floor',source:'https://www.nuh.nhs.uk/exercise-videos-spine-school/'},
  plankknees:{videoId:'Dx81DAI0SKs',title:'How To Perform Plank on Knees',variant:'Forearms and knees supported, short comfortable holds'},
  prone:{videoId:'hNseglwRJhY',title:'Shoulder posture',variant:'Standing shoulder-blade squeeze, not a prone raise',source:'https://www.southtees.nhs.uk/resources/shoulder-posture/'},
  calf:{videoId:'Mjkh9vBfm_E',title:'How to Do Calf Raises: A Guide from Physical Therapists',variant:'Two-leg heel raise on flat floor with support'},
  cat:{videoId:'1Y0YjXS9sKI',title:'How to Do a Cat Cow Stretch: A Guide from Physical Therapists',variant:'Hands-and-knees cat–cow'},
  cheststretch:{videoId:'LJEbiC_6Paw',title:'Standing Chest Stretch | PureGym Academy',variant:'Standing chest opening with hands behind body'},
  stretch:{videoId:'Cus9IRgnvcY',title:'How to do Standing Upper Back Stretch | Joanna Soh',variant:'Standing upper-back stretch with hands in front'},
  calfhold:{videoId:'XTGUHBFrWZo',title:'NHS Calf Stretch',variant:'Standing calf stretch, straight rear knee and heel down'},
  breath:{videoId:'W9Gx6sT-W1A',title:'How to Do Diaphragmatic Breathing: A Guide from Physical Therapists',variant:'Comfortable relaxed belly breathing, no holds or forced breaths'}
};
// Public media published in the corresponding Hinge Health article. Streams
// are played from the provider; no third-party videos are bundled or rehosted.
for(const [id,slug,mediaId,mp4] of [
 ['hinge','hip-hinge','qSkGC596TLeguMh9Iq8pqumZi47my3AiUGejudrnJqo',true],
 ['plankknees','plank-on-knees','Yc4H37Gk00EWaL3IxXarTQAVibGUeZniAKCNfLZBvDNQ',false],
 ['calf','calf-raises','v01wHv3RIaTi5AX61ziFTQMrE01d00hY9C01HK7swASG8O8',true],
 ['cat','cat-cow','17dtlSux2l01lgJzVmoNEBOcrnmFUTQ7x7rFvQZ74bNg',true],
 ['push','wall-push-ups','j02WICI81riUEnxjCWVOkTz8vD6uGdKs7eMc6WnAXsGA',false],
 ['bird','bird-dog','vABAJR5hkBrLn01WDfNtSKtHfiNPJrMTKqrnT7QnwCPs',true]
])Object.assign(WORKOUT_VIDEOS[id],{mediaId,src:'https://stream.mux.com/'+mediaId+(mp4?'/medium.mp4':'.m3u8'),provider:'Hinge Health',source:'https://www.hingehealth.com/resources/articles/'+slug+'/'});
for(const entry of Object.values(WORKOUT_VIDEOS)){
  entry.source=entry.source||'https://www.youtube.com/watch?v='+entry.videoId;
  entry.start??=0; // No guessed cue points. Replace only after watching the clip.
  entry.review??={matched:false,playsInline:false,reviewedAt:null,evidence:null};
}
