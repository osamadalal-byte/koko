'use strict';
// This plan applies the user's stated priorities; it does not infer their current fitness.
const PERSONAL_FOCUS='chest-arms-core-mobility';
Object.assign(EX,{
  kneepush:{name:'Modified push-up',area:'Chest · triceps · core',cue:'Lower your chest slowly and press back up. Keep a straight line from shoulders to knees.',steps:['Start on your hands and knees, hands slightly wider than shoulders. Move your knees back enough to form a straight line from shoulders to knees.','Brace gently. Bend your elbows and lower only as far as you can control, then push away from the floor.','Breathe steadily and stop while you could still do a couple of good repetitions.'],easy:'Use the wall push-up instead. Change your push-up variation in your profile.',pose:'wall'},
  deadbug:{name:'Dead bug heel tap',area:'Abs · trunk control',cue:'Lower one heel gently toward the floor, return, and alternate. Keep your back comfortable and still.',steps:['Lie on your back with hips and knees bent to about 90 degrees and arms resting by your sides.','Keep breathing as you slowly lower one heel toward the floor, without arching your lower back.','Return and alternate sides. Move only as far as you can keep control.'],easy:'Keep both feet on the floor and use the supine heel slide instead.',pose:'dead'},
  plankknees:{name:'Kneeling forearm plank',area:'Abs · shoulder stability',cue:'Brace gently in a straight line from shoulders to knees. Use short holds and breathe throughout.',steps:['Place your forearms on the floor, elbows under shoulders, and keep your knees supported.','Move your knees back slightly and keep your head, trunk and thighs aligned.','Hold for a comfortable 10–15 seconds, rest, and repeat within the interval if it still feels controlled.'],easy:'Rest sooner, or use the supine heel slide. Do not hold your breath.',pose:'cat'},
  wrist:{name:'Gentle wrist circles',area:'Warm-up · wrists',cue:'Make small comfortable circles with relaxed hands. Reverse halfway through.',steps:['Hold your forearms comfortably in front of you with elbows relaxed.','Slowly circle both wrists through a small range without forcing them.','Reverse direction halfway through the interval.'],easy:'Use a smaller range. Stop if the movement causes pain.',pose:'stand'},
  chestopen:{name:'Dynamic chest opener',area:'Warm-up · chest · shoulders',cue:'Slowly open your arms to the sides, then bring them forward. Keep shoulders relaxed.',steps:['Stand comfortably with arms in front at a height that feels easy.','Open your arms out to the sides without pulling them behind your body.','Return forward and repeat smoothly. This is gentle movement, not a held stretch.'],easy:'Keep your arms lower and reduce the range.',pose:'stand'},
  cheststretch:{name:'Gentle chest stretch',area:'Cool-down · chest · shoulders',cue:'Gently open the front of your chest. Hold without bouncing, then release.',steps:['Stand comfortably and gently clasp your hands behind your lower back, palms facing up, if that position feels comfortable.','Let your arms straighten only as far as comfortable and gently open your chest without arching your lower back.','Hold a mild stretch for 15–20 seconds while breathing, then release. Never force your shoulders or raise your hands high.'],easy:'Keep your hands resting at the back of your hips instead of clasping them, and use a smaller movement.',pose:'stand'},
  calfhold:{name:'Standing calf stretch',area:'Cool-down · calves · ankles',cue:'One foot back, heel grounded. Lean gently forward and switch sides halfway.',steps:['Stand comfortably and step one foot back, with both feet pointing forward. Rest your hands on your hips.','Keep the back heel down and the back leg comfortably straight as you bend the front knee slightly.','Hold a mild stretch and breathe. Switch legs halfway through the interval.'],easy:'Use a shorter stance. Place your hands on a solid wall for balance if needed.',pose:'stand'},
  hipcircles:{name:'Standing hip circles',area:'Mobility · hips',cue:'Draw a small circle with your hips. Keep feet grounded and use support if needed.',steps:['Stand with feet comfortably apart near a wall for balance.','Make a small, slow circle with your pelvis while keeping your knees soft.','Reverse direction halfway through. Stay in a comfortable range.'],easy:'Make the circle smaller or gently shift weight from side to side.',pose:'stand'},
  turn:{name:'Gentle upper-body turn',area:'Mobility · upper back',cue:'Turn your chest gently side to side. Keep the movement small and comfortable.',steps:['Stand with feet stable, knees soft and arms crossed loosely over your chest.','Turn your chest a little to one side without forcing your hips or neck.','Return through the centre and alternate slowly.'],easy:'Reduce the turn to a very small movement.',pose:'stand'}
});
DEMO_SOURCES.kneepush={provider:'Mayo Clinic',url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/modified-pushup/vid-20084674',type:'video',label:'Modified and wall push-up demonstrations',note:'Use the knees-on-floor variation only if you can keep good control. The same page also explains the wall version.'};
DEMO_SOURCES.cheststretch={provider:'NHS',url:NHS_DEMOS,type:'video',label:'Chest-stretch demonstration',note:'Choose the chest-stretch section. Use a mild stretch and a comfortable shoulder range.'};
DEMO_SOURCES.calfhold={provider:'NHS',url:NHS_DEMOS,type:'video',label:'Calf-stretch demonstration',note:'Choose the calf-stretch section and change sides halfway through your interval.'};
for(const id of ['deadbug','plankknees','wrist','chestopen','hipcircles','turn'])DEMO_SOURCES[id]={type:'pending',label:'Written guide available',note:'The step-by-step instructions and easier option are below. A matched human demonstration has not yet been added.'};
const sourcePanelBeforePersonal=sourcePanel;
sourcePanel=function(id,compact=false){if(DEMO_SOURCES[id]?.type!=='pending')return sourcePanelBeforePersonal(id,compact);return `<div class="source-panel"><span class="label">Technique instructions</span><h3>${esc(EX[id].name)}</h3><p>${compact?'Tap “How to do it” for the steps and easier option.':esc(DEMO_SOURCES[id].note)}</p></div>`};

function personalDay(n,p,type){
  const w=Math.floor((n-1)/7),i=(n-1)%7;
  if(p.days===3&&! [0,2,4].includes(i))type='rest';
  if(type==='rest')return {n,w,type,title:n===28?'Recover & review':'Rest & recover',focus:'Optional easy walking. No guided workout is required today.',ex:[]};
  if(type==='move')return {n,w,type,title:'Mobility & movement',focus:'Your fourth session: shoulders, upper back, hips and ankles.',ex:['circles','side','cat','hinge','calf','march']};
  const push=p.pushVariation==='knees'?'kneepush':'push';
  const groups=[[push,'squat','dead','prone',push],[push,'bird','bridge','prone','dead'],[push,'bridge','plankknees','prone','dead']];
  const k=p.days===2?(i===0?0:1):({0:0,2:1,4:2}[i]);
  const titles=['Chest, triceps & abs','Strength & core control','Upper body & core'];
  const count=p.minutes<=15?4:5;
  return {n,w,type,title:titles[k],focus:'Build strength with controlled repetitions, a gentle warm-up and stretches afterward.',ex:groups[k].slice(0,count)};
}
function personalSteps(n,mode,pace){
  const d=getDay(n),steps=[];if(d.type==='rest')return steps;
  const add=(id,seconds,phase,round=0)=>steps.push({id,seconds,phase,round});
  if(d.type==='move'){
    add('march',90,'Warm-up');add('circles',45,'Warm-up');add('march',45,'Warm-up');
    for(const id of ['circles','side','cat','hinge','calf','side','cat','hinge','march']){add(id,45,'Easy movement');add('rest',15,'Rest')}
    add('cheststretch',45,'Cool-down');add('stretch',45,'Cool-down');add('calfhold',60,'Cool-down');add('breath',30,'Cool-down');return steps;
  }
  const p=FORMCOACH.recommend(state.coach,currentReadiness,mode,pace==='gentle');
  if(p.warm===300){add('march',120,'Warm-up');add('circles',60,'Warm-up');add('hinge',60,'Warm-up');add('side',60,'Warm-up')}
  else {add('march',p.warm/2,'Warm-up');add('circles',p.warm/4,'Warm-up');add('hinge',p.warm/4,'Warm-up')}
  const moves=d.ex.slice(0,p.moves);
  for(let r=1;r<=p.rounds;r++)moves.forEach((id,i)=>{add(id,p.work,'Work',r);if(i<moves.length-1||r<p.rounds)add('rest',p.rest,'Rest',r)});
  if(p.cool===180){add('cheststretch',45,'Cool-down');add('stretch',45,'Cool-down');add('calfhold',60,'Cool-down');add('breath',30,'Cool-down')}
  else if(p.cool===120){add('cheststretch',30,'Cool-down');add('stretch',30,'Cool-down');add('calfhold',40,'Cool-down');add('breath',20,'Cool-down')}
  else{add('cheststretch',20,'Cool-down');add('stretch',20,'Cool-down');add('breath',20,'Cool-down')}
  return steps;
}
function personalPlanSummary(){const p=state.coach.profile;if(p?.focus!==PERSONAL_FOCUS)return '';return `<section class="card personal-plan"><div class="row between wrap"><h3>Your strength & mobility plan</h3><span class="badge">${p.age||35} · iPhone · No equipment</span></div><p class="coach-help">${p.days===4?'Three strength sessions are your minimum. The fourth session builds mobility.':'Three strength sessions, with mobility included in each warm-up and cool-down.'} Keep a recovery day between strength sessions.</p><div class="personal-session-grid">${[[1,'Chest, triceps & abs'],[3,'Strength & core control'],[5,'Upper body & core'],...(p.days===4?[[6,'Mobility & movement']]:[])].map(([n,title],i)=>`<button type="button" class="personal-session" data-day="${Math.floor((selected-1)/7)*7+n}"><span class="label">Session ${i+1}</span><b>${title}</b><span>${mins(n)} min · includes preparation & stretches</span></button>`).join('')}</div><p class="small">15-minute setting: shorten the main circuit while keeping preparation and stretches. Timings are guided time; pausing or watching a demonstration adds time.</p></section>`}

// These badges identify a movement category; they do not depict exercise technique.
const poseBeforePersonal=pose;
pose=function(id){const labels={kneepush:'PUSH',deadbug:'CORE',plankknees:'CORE',wrist:'WRIST',chestopen:'OPEN',cheststretch:'CHEST',calfhold:'CALF',hipcircles:'HIPS',turn:'TURN'};return labels[id]?`<svg viewBox="0 0 150 145" role="img" aria-label="${esc(EX[id].name)} category badge"><circle cx="75" cy="72" r="47" fill="none" stroke="#8a9e80" stroke-width="2"/><path d="M51 96h48" stroke="#344b36" stroke-width="3"/><text x="75" y="77" text-anchor="middle" fill="#344b36" font-family="system-ui,sans-serif" font-size="18" font-weight="700" letter-spacing="1">${labels[id]}</text></svg>`:poseBeforePersonal(id)};
