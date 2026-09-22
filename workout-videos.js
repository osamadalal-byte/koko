'use strict';
/* Public provider demonstrations reviewed on 2026-09-22.
   Evidence binds the exact variant, URL and excerpt to real browser playback.
   No third-party video is bundled, rehosted or cached offline. */
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
 ['bird','bird-dog','vABAJR5hkBrLn01WDfNtSKtHfiNPJrMTKqrnT7QnwCPs',true],
 ['squat','squat','x1d5wfYzJ2o6aVM4VZsC00QCUZrnUi02YTqHkLhyh8BYk',true],
 ['bridge','bridge-exercise','00oJ021DCcVhnnHEhSsbJm9TtvQV7OgZWiF7v6BZmOgpU',true],
 ['prone','scapular-squeezes','zi01a02BbRi9JvNuTrKAOwsCagj4s02zOM1gjNPx5WrH6Y',true],
 ['breath','diaphragmatic-breathing','lKBNySeNbOZK01EZSGG6LcCyZiNsjNgEIu9Rc2200O9cI',false],
 ['kneepush','push-ups','7GqB01HWWS5KIWH6ZSvYPJLq2khgyT601fyPI02aqANYsw',false],
 ['side','standing-side-leg-raise','O88ZO1yUbXPjIdnSWx02IVf02QDoOEk4vQeZqzcdJxXbQ',true]
])Object.assign(WORKOUT_VIDEOS[id],{mediaId,src:'https://stream.mux.com/'+mediaId+(mp4?'/medium.mp4':'.m3u8'),provider:'Hinge Health',source:'https://www.hingehealth.com/resources/articles/'+slug+'/'});
Object.assign(WORKOUT_VIDEOS.dead,{mediaId:'dd7b9bef-40cc-45ee-a7a7-0b6552605a41',src:'https://media.physitrack.com/exercises/dd7b9bef-40cc-45ee-a7a7-0b6552605a41/en/video_1280x720.mp4',provider:'Physitrack',source:'https://us.physitrack.com/home-exercise-video/supine-heel-slides---movement-control'});
for(const [id,mediaId] of [['cheststretch','1763467661001'],['stretch','1763945821001'],['calfhold','1763467667001']]){
  Object.assign(WORKOUT_VIDEOS[id],{brightcove:true,mediaId,provider:'NHS',source:'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/'});
}
for(const [id,mediaId,slug] of [
 ['march','71550880-a7cf-402d-9ada-938438d4ba38','standing-marching'],
 ['circles','a267a10f-9cea-4312-abd0-402efdfa9bf7','shoulder-rolls']
])Object.assign(WORKOUT_VIDEOS[id],{mediaId,src:'https://media.physitrack.com/exercises/'+mediaId+'/en/video_1280x720.mp4',provider:'Physitrack',source:'https://na.physitrack.com/home-exercise-video/'+slug});
Object.assign(WORKOUT_VIDEOS.march,{title:'Standing marching',variant:'Standing march, comfortable knee lift; optional wall support'});
WORKOUT_VIDEOS.circles.title='Standing shoulder rolls';
WORKOUT_VIDEOS.bridge.title='Supine bridge';WORKOUT_VIDEOS.prone.title='Standing scapular squeezes';
WORKOUT_VIDEOS.cheststretch.title='NHS chest stretch';WORKOUT_VIDEOS.stretch.title='NHS upper back stretch';
WORKOUT_VIDEOS.dead.title='Supine heel slides — movement control';
// Reviewed demonstration boundaries. See validation/player-2026-09-22/.
for(const [id,start,end] of [
 ['march',2,16],['circles',2,12],['hinge',26,44],['side',17,30],
 ['push',39,56],['kneepush',12,19],['squat',33,43],['bridge',32,42],
 ['bird',39,53],['dead',12,24],['plankknees',18,25],['prone',15,29],
 ['calf',15,32],['cat',24,33],['cheststretch',16,21],['stretch',17,28],
 ['calfhold',23,35],['breath',26,46]
])Object.assign(WORKOUT_VIDEOS[id],{start,end});
for(const entry of Object.values(WORKOUT_VIDEOS)){
  entry.source=entry.source||'https://www.youtube.com/watch?v='+entry.videoId;
  entry.review={matched:true,playsInline:true,reviewedAt:'2026-09-22',evidence:'validation/player-2026-09-22/video-review.json'};
}
