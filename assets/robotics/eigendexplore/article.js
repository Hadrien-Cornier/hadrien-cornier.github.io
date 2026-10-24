// Three-joint teaching sketch. The basis is illustrative, not paper data.
const direction=[0.57,0.65,0.50];
export const BASIS = Object.freeze(direction.map(value=>value/Math.hypot(...direction)));
export const MEAN = Object.freeze([-0.18,0.10,-0.05]);
export const SIGMA = 0.33;
export function seededNormals(seed) {
  let state=seed>>>0;
  const uniform=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return (state+.5)/4294967296;};
  return Array.from({length:4},()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform()));
}
export function sampleOffsets(seed, mode='structured') {
  const noise=seededNormals(seed);
  if(mode==='independent')return noise.slice(0,3).map(v=>v*SIGMA);
  return noise.slice(0,3).map((v,i)=>v*SIGMA/Math.sqrt(2)+BASIS[i]*noise[3]*SIGMA*Math.sqrt(3/2));
}
export function jointTargets(seed,mode) {return sampleOffsets(seed,mode).map((v,i)=>Math.max(-1,Math.min(1,MEAN[i]+v)));}
export function fingerShape(joint,index) {
  const x=[130,205,280][index],length=[116,125,106][index];
  const curl=(joint+1)*.5;
  const tip={x:x-7+34*curl,y:222-length+78*curl};
  return {path:`M${x} 222Q${x-18+45*curl} ${222-length*.68} ${tip.x} ${tip.y}`,tip};
}

if(typeof document!=='undefined') {
 const demo=document.querySelector('[data-dex-demo]');
 if(demo) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fingers=[...demo.querySelectorAll('[data-finger]')],ghosts=[...demo.querySelectorAll('[data-ghost]')],tips=[...demo.querySelectorAll('[data-tip]')],arrows=[...demo.querySelectorAll('[data-arrow]')],targets=[...demo.querySelectorAll('[data-target]')];
  const play=demo.querySelector('[data-dex-play]'),modeButtons=[...demo.querySelectorAll('[data-mode]')],stepButtons=[...demo.querySelectorAll('[data-step]')],slider=demo.querySelector('[data-dex-joint]');
  const captions=["Map human motion to the robot’s joints.",'Find joints that often move together.','Add shared motion to independent joint noise.','Keep a separate target for every joint.'];
  const scenes=['Human motion → Robot poses','Shared curl pattern','Training exploration','Full joint control'];
  let step=0,mode='structured',playing=false,frame=0,pose=0,lastTime=0,elapsed=0,draw=0,display=[...MEAN];
  let ease=null;
  const examples=[192,32,60,6171,271,61604,396,403];
  const seedFor=(index)=>examples[index%examples.length];
  const poseTargets=(index)=>MEAN.map((v,i)=>v+BASIS[i]*[-.65,.35,.8][index%3]);
  const sampleFor=()=>step<2?poseTargets(pose):step===2?jointTargets(seedFor(draw),mode):MEAN.map((v,i)=>i===1?Number(slider.value):v);
  function paint(values) {
   display=[...values];
   values.forEach((value,i)=>{
    const shape=fingerShape(value,i),base=fingerShape(MEAN[i],i);
    fingers[i].setAttribute('d',shape.path);ghosts[i].setAttribute('d',base.path);
    tips[i].setAttribute('cx',shape.tip.x);tips[i].setAttribute('cy',shape.tip.y);
    const dx=shape.tip.x-base.tip.x,dy=shape.tip.y-base.tip.y;
    const end={x:base.tip.x+dx*.9,y:base.tip.y+dy*.9};
    arrows[i].setAttribute('d',Math.hypot(dx,dy)<4?'':`M${base.tip.x} ${base.tip.y}L${end.x} ${end.y}m-5 -3l5 3-3 5`);
    targets[i].style.left=`${(value+1)*50}%`;targets[i].dataset.value=value.toFixed(4);
    if(i===1){const focus=demo.querySelector('[data-free-tip]');focus.setAttribute('cx',shape.tip.x);focus.setAttribute('cy',shape.tip.y);}
   });
   demo.dataset.sample=String(draw);demo.dataset.targets=values.map(v=>v.toFixed(4)).join(',');
  }
  function refreshLabels() {
   demo.dataset.scene=String(step);demo.dataset.noise=mode;demo.dataset.playing=String(playing);
   stepButtons.forEach((b,i)=>{if(i===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
   modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
   demo.querySelector('[data-dex-caption]').textContent=step===2&&mode==='independent'?'Perturb each joint independently.':captions[step];demo.querySelector('[data-dex-scene]').textContent=step===2?(mode==='structured'?'Coordinated + independent':'Independent joint noise'):scenes[step];
   demo.querySelector('[data-dex-sample]').textContent=step<2?`Pose ${pose%3+1} / 3`:step===2?`Sample ${draw+1}`:'Every target remains free';
   demo.querySelector('.dex-topline > :last-child').textContent=`0${step+1} / ${scenes[step]}`;
   demo.querySelector('[data-dex-progress]').textContent=`${step+1} / 4`;
   demo.querySelector('.dex-mode').hidden=step!==2;demo.querySelector('.dex-joint-control').hidden=step!==3;
   play.innerHTML=reduced.matches?'Next step <span aria-hidden="true">→</span>':playing?'Pause <span aria-hidden="true">Ⅱ</span>':'Play <span aria-hidden="true">▷</span>';
  }
  function transition(values) {if(reduced.matches||!playing){ease=null;paint(values);}else ease={from:[...display],to:values,start:performance.now()};}
  function setStep(index,{stop=true}={}) {if(stop)pause();step=index;elapsed=0;pose=0;draw=0;ease=null;refreshLabels();paint(sampleFor());}
  function pause() {playing=false;cancelAnimationFrame(frame);frame=0;lastTime=0;ease=null;refreshLabels();}
  function tick(time) {
   if(!playing)return;
   const dt=lastTime?Math.min(time-lastTime,100):0;lastTime=time;elapsed+=dt;
   if(ease){let t=Math.min(1,(time-ease.start)/240);t=t*t*(3-2*t);paint(ease.from.map((v,i)=>v+(ease.to[i]-v)*t));if(t>=1)ease=null;}
   if(elapsed>=1100){elapsed=0;if(step<2){pose++;if(pose>=3)setStep(step+1,{stop:false});else{refreshLabels();transition(sampleFor());}}else if(step===2){draw++;if(draw>=8){setStep(3,{stop:false});pause();}else{refreshLabels();transition(sampleFor());}}}
   if(playing)frame=requestAnimationFrame(tick);
  }
  function start() {if(reduced.matches){setStep((step+1)%4);return;}if(step===3)setStep(0);playing=true;lastTime=0;refreshLabels();frame=requestAnimationFrame(tick);}
  stepButtons.forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.step))));
  modeButtons.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;refreshLabels();transition(sampleFor());}));
  play.addEventListener('click',()=>playing?pause():start());
  demo.querySelector('[data-dex-replay]').addEventListener('click',()=>{setStep(0);if(!reduced.matches)start();});
  slider.addEventListener('input',()=>{paint(sampleFor());});
  reduced.addEventListener('change',()=>{pause();paint(sampleFor());});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  stepButtons.forEach(button=>{button.disabled=false;});demo.querySelectorAll('[data-interactive]').forEach(control=>{control.hidden=false;});demo.classList.add('dex-enhanced');setStep(0);
 }
}
