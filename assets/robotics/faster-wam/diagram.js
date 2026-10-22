import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { chapters, clamp, stateAt } from './sequence.js';

const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let time = 0, playing = false, renderer, controls, camera, scene, visible = true;
let lastFrame = 0, dirty = true, lastPhase = -1;
const colors = {video:0x6287bb, cache:0x39a8a1, action:0xd77952, fusion:0xd8b65e};
const layers = [], caches = [], actions = [], wires = [], fusionWires = [], fusionParticles = [], steps = [], labels = [];
const v = (x,y,z=0) => new THREE.Vector3(x,y,z);
const layerY = (i) => .5 + i * .195;
const centerY = 3.3;
const stages = [
  ['01 / Once per action chunk', 'Build the video cache.', 'The observed frame passes through 30 video layers. Each leaves a key/value cache. Both architectures do this once per chunk.'],
  ['02 / Default Fast-WAM', 'Read every layer. Repeat ten times.', 'Each of 30 action layers reads its matching video cache at every denoising step. 30 layers × 10 steps = 300 reads.'],
  ['03 / Change the architecture', 'Remove 29 action layers.', 'A single action layer remains. The video stack and its 30 caches stay. This transition compares architectures; the smaller expert needs training.'],
  ['04 / Lite KV-Fusion', 'Mix all 30 caches, once.', 'Learned softmax weights combine the caches per attention head. K and V share weights. Retracted RoPE aligns fused keys before action attention.'],
  ['05 / Faster-WAM', 'One layer. The same ten steps.', 'The action expert reuses the fixed mixed cache at every denoising step. 1 layer × 10 steps = 10 reads. Fusion is outside this loop.'],
];

function syncTheme() {
  let theme;
  try { theme = window.parent.document.documentElement.dataset.theme; } catch { /* standalone page */ }
  if (!theme) { try { theme = localStorage.getItem('theme'); } catch { /* storage disabled */ } }
  if (!theme) theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  if (scene) scene.background = null;
  dirty = true;
}
syncTheme();
try {
  if (window.parent !== window) new MutationObserver(syncTheme).observe(window.parent.document.documentElement, {attributes:true,attributeFilter:['data-theme']});
} catch { /* cross-origin embedding follows system theme */ }
window.addEventListener('storage', syncTheme);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);

function slab(width,height,depth,color) {
  const material = new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.12,transparent:true});
  return new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material);
}
function line(a,b,color) {
  const curve = new THREE.CubicBezierCurve3(a,a.clone().add(v(.8,0,.2)),b.clone().add(v(-.8,0,.2)),b);
  const mesh = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.3}));
  mesh.userData.curve = curve;
  scene.add(mesh);
  return mesh;
}
function label(html,position) {
  const element = document.createElement('div'); element.className='label'; element.innerHTML=html;
  $('labels').append(element); labels.push({element,position}); return element;
}
let mixed, mixedV, mixedWire, particle, fusedParticle, actionLabel, mixedLabel, stepsLabel;
function init3D() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33,1,.1,100);
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0,0);
  $('scene').append(renderer.domElement);
  controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping = false; controls.enablePan = false;
  controls.minDistance=10; controls.maxDistance=35; controls.maxPolarAngle=Math.PI*.85;
  controls.addEventListener('change',()=>{dirty=true;});
  // OrbitControls uses one-finger rotation, leaving page scroll available outside the scene.
  scene.add(new THREE.AmbientLight(0xffffff,2));
  const light = new THREE.DirectionalLight(0xffffff,3);light.position.set(0,10,9);scene.add(light);
  for (let i=0;i<30;i++) {
    const y = layerY(i);
    const block=slab(1.7,.105,1.1,colors.video);block.position.set(-4,y,0);scene.add(block);layers.push(block);
    const k=slab(.47,.11,.8,colors.cache);k.position.set(-2.2,y,0);scene.add(k);
    const val=slab(.47,.11,.8,colors.cache);val.position.set(-1.63,y,0);scene.add(val);caches.push([k,val]);
    const a=slab(1.65,.105,1.1,colors.action);a.position.set(3.8,y,0);scene.add(a);actions.push(a);
    line(v(-3.15,y),v(-2.45,y),colors.cache);
    wires.push(line(v(-1.36,y),v(2.97,y),colors.action));
    fusionWires.push(line(v(-1.36,y),v(.7,centerY),colors.fusion));
  }
  mixed=slab(.55,.5,1,colors.fusion);mixed.position.set(.65,centerY,0);scene.add(mixed);
  mixedV=slab(.55,.5,1,colors.fusion);mixedV.position.set(1.3,centerY,0);scene.add(mixedV);
  mixedWire=line(v(1.58,centerY),v(2.97,centerY),colors.fusion);
  particle=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:0xffdb9e}));scene.add(particle);
  fusedParticle=particle.clone();scene.add(fusedParticle);
  for(let i=0;i<10;i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.095,12,8),new THREE.MeshBasicMaterial({color:colors.action,transparent:true}));
    dot.position.set(-2.7+i*.66,-.48,1.25);scene.add(dot);steps.push(dot);
    label(String(i+1),v(-2.7+i*.66,-.2,1.25));
  }
  label('Video world model<small>30 layers · once</small>',v(-4.4,7.4));
  label('KV caches<small>30 pairs · reused</small>',v(-1.7,6.2));
  actionLabel=label('Action expert<small>30 layers · repeated</small>',v(3.8,7.4));
  mixedLabel=label('Lite KV-Fusion<small>per-head weighted mix</small>',v(.95,4.35));
  stepsLabel=document.createElement('div');stepsLabel.className='step-caption';stepsLabel.textContent='Denoising steps';$('labels').append(stepsLabel);
  for(let i=0;i<30;i++){const p=particle.clone();scene.add(p);fusionParticles.push(p);}
  const floor = new THREE.GridHelper(14,28,0x81968a,0x81968a);floor.position.y=-1.9;floor.material.transparent=true;floor.material.opacity=.09;scene.add(floor);
  new ResizeObserver(resize).observe($('scene'));
  resetCamera();
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('fallback').hidden=false;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{$('fallback').hidden=true;dirty=true;});
}
function resize() {
  if(!renderer) return;
  const {width,height}=$('scene').getBoundingClientRect();
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;
}
function resetCamera() {
  if(!camera) return;
  const narrow = $('scene').clientWidth < 540;
  camera.position.set(5,5.4,narrow?18:17);
  controls.target.set(-.25,2.7,0);controls.update();resize();
}
function opacity(object,value) { object.visible=value>.003;object.material.opacity=value; }
function draw(s) {
  if (!renderer) return;
  layers.forEach((block,i)=>{
    const filled=s.prefill*30>=i+1;
    block.material.emissive.setHex(s.phase===0&&Math.floor(s.prefill*30)===i?0x25486d:0);
    opacity(block,filled?.95:.2);
    caches[i].forEach(k=>opacity(k,filled?.95:.15));
    const live = s.phase===1 && s.activeLayer===i && s.baselineReads<300;
    actions[i].position.y=i===0?THREE.MathUtils.lerp(layerY(0),centerY,s.removal):layerY(i);
    opacity(actions[i],i===0?1:1-s.removal);
    actions[i].material.emissive.setHex(live?0x74351a:0);
    opacity(wires[i],(1-s.removal)*(live?.95:.17));
    opacity(fusionWires[i],s.fusion*.35);
  });
  opacity(mixed,s.fusion);opacity(mixedV,s.fusion);opacity(mixedWire,s.fusion*.7);
  particle.visible=s.phase===1&&s.baselineReads<300;
  if(particle.visible) particle.position.copy(wires[s.activeLayer].userData.curve.getPoint(s.readProgress));
  fusedParticle.visible=s.phase===4&&s.fasterReads<10;
  if(fusedParticle.visible) fusedParticle.position.copy(mixedWire.userData.curve.getPoint(s.fasterReadProgress));
  // Transfer pulses visualize contributions without consuming the original caches.
  fusionWires.forEach((wire,i)=>{
    const progress=clamp(s.fusion*1.7-i/30*.7);
    fusionParticles[i].visible=s.phase===3&&progress>0&&progress<1;
    fusionParticles[i].position.copy(wire.userData.curve.getPoint(progress));
    if(s.phase===3)wire.material.opacity=.12+.65*clamp(1-Math.abs(s.fusion-i/30)*8);
  });
  const currentStep=s.phase===1?s.baselineStep:s.phase===4?s.fasterStep:-1;
  steps.forEach((dot,i)=>{
    const complete=(s.phase>1&&s.phase<4)||s.phase===4&&s.fasterReads===10;
    dot.material.opacity=complete||i<=currentStep?1:.18;
    dot.material.color.setHex(s.phase>=3?colors.fusion:colors.action);
    dot.scale.setScalar(i===currentStep?1.5:1);
  });
  actionLabel.innerHTML=s.removal>.5?'Action expert<small>1 layer · repeated</small>':'Action expert<small>30 layers · repeated</small>';
  mixedLabel.style.display=s.fusion>0?'':'none';
  for(const item of labels){
    const point=item.position.clone().project(camera);
    const halfWidth=item.element.offsetWidth/2;
    const x=clamp((point.x*.5+.5)*$('scene').clientWidth,halfWidth+5,$('scene').clientWidth-halfWidth-5);
    const y=clamp((-point.y*.5+.5)*$('scene').clientHeight,item.element.offsetHeight+6,$('scene').clientHeight-30);
    item.element.style.left=`${x}px`;item.element.style.top=`${y}px`;
    item.element.style.visibility=point.z>1?'hidden':'visible';
  }
  renderer.render(scene,camera);
}
function update() {
  const s=stateAt(time);
  $('timeline').value=Math.round(time*1000);
  $('default-count').value=s.baselineReads;$('faster-count').value=s.fasterReads;
  const stage=stages[s.phase];
  $('stage-kicker').textContent=stage[0];$('stage-title').textContent=stage[1];$('stage-copy').textContent=stage[2];
  $('baseline').setAttribute('aria-pressed',s.phase<2);$('faster').setAttribute('aria-pressed',s.phase>=2);
  document.querySelectorAll('[data-time]').forEach((b,i)=>b.setAttribute('aria-current',i===s.phase));
  if(lastPhase!==s.phase){$('announcement').textContent=stage[1];lastPhase=s.phase;}
  draw(s);dirty=false;
}
function setPlaying(value) {
  playing=value;lastFrame=0;$('play').textContent=value?'Pause Ⅱ':'Play ▷';$('play').setAttribute('aria-label',value?'Pause animation':'Play animation');
}
function seek(t,play=false){time=clamp(t);setPlaying(play);dirty=true;update();}
$('play').addEventListener('click',()=>{if(time>=1)time=0;setPlaying(!playing);});
$('timeline').addEventListener('input',e=>seek(Number(e.target.value)/1000));
$('baseline').addEventListener('click',()=>seek(.12,!reduced.matches));
$('faster').addEventListener('click',()=>seek(reduced.matches ? .94 : .43,!reduced.matches));
$('view').addEventListener('click',resetCamera);
$('previous').addEventListener('click',()=>seek([...chapters].reverse().find(t=>t<time-.001)??0));
$('next').addEventListener('click',()=>seek(chapters.find(t=>t>time+.001)??1));
for(const b of document.querySelectorAll('[data-time]'))b.addEventListener('click',()=>seek(Number(b.dataset.time)/1000));
try { init3D(); } catch(error) { $('fallback').hidden=false;console.error('Architecture diagram:',error); }
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastFrame=0;dirty=true;}).observe(document.querySelector('main'));
document.addEventListener('visibilitychange',()=>{lastFrame=0;});
function frame(now) {
  if(visible&&!document.hidden) {
    if(playing){if(lastFrame)time=clamp(time+Math.min((now-lastFrame)/1000,.1)/32);dirty=true;if(time>=1)setPlaying(false);}
    if(dirty)update();lastFrame=now;
  } else lastFrame=0;
  requestAnimationFrame(frame);
}
update();requestAnimationFrame(frame);
