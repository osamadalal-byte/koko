/* Local coaching rules. These support habit building; they are not a clinical assessment. */
var FORMCOACH = (() => {
  const goals = {strength:'Build strength & muscle',leaner:'Work toward a leaner physique',consistency:'Build a consistent routine'};
  const bounded = (n,min,max,fallback) => Number.isFinite(n)&&n>=min&&n<=max?n:fallback;
  function normalize(input) {
    const s=input&&typeof input==='object'?input:{};
    let profile=null;
    if(s.profile&&typeof s.profile==='object'){
      const p=s.profile;
      if(goals[p.goal]&&['unassessed','inactive','some','regular'].includes(p.activity)&&[10,15,20,30].includes(p.minutes)&&[2,3,4].includes(p.days)&&['clear','guidance'].includes(p.health)&&p.adult===true){
        profile={age:Number.isInteger(p.age)&&p.age>=18&&p.age<=100?p.age:null,device:p.device==='iphone'?'iphone':null,focus:p.focus==='chest-arms-core-mobility'?p.focus:null,pushVariation:['wall','knees'].includes(p.pushVariation)?p.pushVariation:'wall',goal:p.goal,activity:p.activity,minutes:p.minutes,days:p.days,health:p.health,adult:true,why:String(p.why||'').slice(0,240),anchor:String(p.anchor||'').slice(0,120),notes:String(p.notes||'').slice(0,400)};
      }
    }
    const measures=Array.isArray(s.measures)?s.measures.filter(m=>m&&/^\d{4}-\d{2}-\d{2}$/.test(m.date)&&['weight','waist','walk'].includes(m.kind)&&Number.isFinite(m.value)&&m.value>0&&m.value<=500).slice(-500).map((m,i)=>({...m,id:typeof m.id==='string'?m.id.slice(0,80):m.date+'-'+m.kind+'-'+i})):[];
    return {personalization:typeof s.personalization==='string'?s.personalization.slice(0,80):null,profile,level:Math.floor(bounded(s.level,0,4,['inactive','unassessed'].includes(profile?.activity)?0:1)),easyRun:Math.floor(bounded(s.easyRun,0,2,0)),note:typeof s.note==='string'?s.note.slice(0,500):'Your first sessions establish a comfortable starting point.',measures};
  }
  function schedule(n,days=3){const index=(n-1)%7;if(days===4)return [0,2,4].includes(index)?'strength':index===5?'move':'rest';return (days===2?[0,3]:[0,2,4]).includes(index)?'strength':[1,5].includes(index)?'move':'rest'}
  function recommend(coach,readiness={},mode='full',manualGentle=false){
    const p=coach.profile;let level=coach.level;
    const blocked=!p?'Complete your profile before starting.':p.health==='guidance'?'Your profile mentions a health concern. Get individual advice on suitable exercise before using this general plan.':readiness.pain==='yes'?'Pause training today. Pain needs attention; avoid the painful movement and seek advice if it persists.':readiness.soreness==='high'?'Take a recovery day. Resume when everyday movement is comfortable.':'';
    const reasons=[];const lighter=manualGentle||readiness.energy==='low'||readiness.soreness==='mild';
    if(readiness.energy==='low'||readiness.soreness==='mild'){level=Math.max(0,level-1);reasons.push('A lighter session because of your readiness check-in.');}
    if(manualGentle){level=0;reasons.push('Your gentle-pace preference is applied.');}
    if(p?.focus==='chest-arms-core-mobility'){
      const budget=mode==='short'?7:Math.min(p.minutes,20);
      const warm=budget<=7?120:budget<=10?180:300;
      const cool=budget<=7?60:budget<=15?120:180;
      const moves=budget<=15?4:5;
      const rounds=budget<=10?1:2;
      const work=lighter&&level===0?15:mode==='short'?20:[20,25,30,35,40][level];
      const rest=60-work;
      const seconds=warm+cool+rounds*moves*work+(rounds*moves-1)*rest;
      if(mode==='short')reasons.push('A shorter session for a busy day; it will not increase difficulty.');
      if(!reasons.length)reasons.push(coach.note);
      return {level,lighter,work,rest,rounds,moves,budget,warm,cool,blocked,reason:reasons.join(' '),seconds};
    }
    const levels=[{work:20,rest:40,rounds:1},{work:25,rest:35,rounds:2},{work:30,rest:30,rounds:2},{work:35,rest:25,rounds:2},{work:35,rest:20,rounds:2}];
    const params={...levels[level]};
    const budget=mode==='short'?7:(p?.minutes||15);
    const warm=mode==='short'?120:180,cool=mode==='short'?60:120;
    const seconds=r=>warm+cool+r*5*params.work+(r*5-1)*params.rest;
    while(params.rounds>1&&seconds(params.rounds)>budget*60)params.rounds--;
    if(mode==='short'){params.rounds=1;params.work=20;params.rest=30;reasons.push('Short session selected. It will not trigger a difficulty increase.');}
    if(!reasons.length)reasons.push(coach.note);
    return {level,...params,budget,warm,cool,blocked,reason:reasons.join(' '),seconds:warm+cool+params.rounds*5*params.work+(params.rounds*5-1)*params.rest};
  }
  function feedback(coach,{type,mode,feeling,pain,level,lighter=false}){
    const next={...coach};
    if(type!=='strength')return next;
    if(pain){next.level=Math.max(0,coach.level-1);next.easyRun=0;next.note='You reported pain. Do not repeat the painful movement; take recovery and seek individual advice if symptoms persist.';return next;}
    if(feeling==='hard'){next.level=Math.max(0,coach.level-1);next.easyRun=0;next.note='Your last strength session felt hard. The next session is lighter, or stays at the easiest starting level.';return next;}
    if(mode!=='full'){next.easyRun=0;next.note='Your short or partial session counts. Keep the same difficulty for the next full workout.';return next;}
    if(lighter){next.easyRun=0;next.note='Your lighter session counts. Keep the same baseline for the next full session.';return next;}
    if(feeling==='easy'&&level===coach.level){next.easyRun++;
      if(next.easyRun>=3){next.level=Math.min(4,coach.level+1);next.easyRun=0;next.note=next.level===coach.level?'You reached this starter plan’s upper level. A new phase needs a fresh assessment.':'Three full sessions felt easy. Try a small increase next time; choose gentle pace whenever needed.';}
      else next.note=`${next.easyRun} of 3 full sessions felt easy. Keep this level while you establish consistency.`;
    } else {next.easyRun=0;next.note='Your last session was manageable. Keep this level and focus on controlled movement.';}
    return next;
  }
  return {goals,normalize,schedule,recommend,feedback};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=FORMCOACH;
