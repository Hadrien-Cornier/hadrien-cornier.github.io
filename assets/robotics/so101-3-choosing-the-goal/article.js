import {startArticle} from '/assets/robotics/rebuild/article-runtime.js';
await startArticle(["/assets/robotics/rl/canvas.js"]);
(function(){'use strict';
var TICK=2*Math.PI/4096;
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function q1(s,r){return (r||document).querySelector(s);}
function mk(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function clamp(x,a,b){return x<a?a:x>b?b:x;}
function btnify(li){var b=mk('button','w-btn',li.innerHTML);b.type='button';li.innerHTML='';li.appendChild(b);return b;}
function reveal(a){if(a){a.hidden=false;a.open=true;}}
function predict(w){var list=q1('.w-choices',w),ans=q1('.w-answer',w);if(!list)return;var items=qa('li',list);if(ans){ans.hidden=false;ans.open=false;}
if(w.getAttribute('data-mode')==='rank'){var picks=[];items.forEach(function(li){var b=btnify(li);b.addEventListener('click',function(){if(w.classList.contains('w-done')||picks.indexOf(li)>=0)return;picks.push(li);b.appendChild(mk('span','w-badge',' #'+picks.length));if(picks.length<items.length)return;w.classList.add('w-done');picks.forEach(function(p,i){p.classList.add(+p.getAttribute('data-rank')===i+1?'w-right':'w-wrong');q1('button',p).appendChild(mk('span','w-val',' · '+p.getAttribute('data-value')+' mrad'));});reveal(ans);});});return;}
items.forEach(function(li){var b=btnify(li);b.addEventListener('click',function(){if(w.classList.contains('w-done'))return;w.classList.add('w-done');items.forEach(function(o){o.classList.add(o.hasAttribute('data-correct')?'w-right':'w-dim');});if(!li.hasAttribute('data-correct')){li.classList.remove('w-dim');li.classList.add('w-wrong');}reveal(ans);});});}
var GE=[['direct',[],'T = 0 and nothing else: the goal is the target, q*(t).'],['lead',['T'],'T = one command interval, about 33 ms at 30 Hz.'],['inv',['T','M','d'],'T = D plus fitted damping and acceleration terms.'],['sag',['T','M','d','G'],'inv plus gravity fitted from steady holds.'],['grav',['T','M','d','G'],'inv plus MuJoCo gravity at the target pose.'],['pi',['T','M','d','P','I'],'inv plus K_P = 0.2 and K_I = 2 per second, both limited.'],['pisag',['T','M','d','G','P','I'],'sag plus the same feedback gains.'],['adapt',['T','M','d','w'],'inv plus a per-joint Kalman estimate of ŵ.'],['rls',['T','M','d'],'The model behind these terms is refitted online, then inverted.'],['Classical',['T','M','G','d','f','P','I'],'One-interval preview, K_P = 4, K_I = 10.'],['Fitted',['T','M','C','G','d','f','I'],'Newton inversion of a fitted MuJoCo model over the held interval, K_P = 0, K_I = 3.'],['solve',['T','M','d','G','w'],'Fitted servo model, slow ŵ, 0.25 s search over one whole-tick destination. Dead band and ticks enter through simulation.'],['mpc',['T','M','d','G','w'],'Like solve, but every goal in the 0.25 s plan is free.'],['mpca',['T','M','d','G','w'],'mpc with the Kalman estimate of ŵ from adapt.'],['ilc',['T','M','d','u'],'inv plus a correction u_k learned across runs.'],['ilcmpc',['T','M','d','G','w','u'],'Planning, slow ŵ and learned u_k.'],['network',['T','N','P','I'],'One-step preview plus a learned torque offset τ̂_network / k_p, K_P = -0.25, K_I = 3.']];
function goalEq(w){var bar=q1('.ge-controls',w),note=q1('.ge-note',w),terms=qa('[data-term]',w);if(!bar)return;var btns=GE.map(function(c){var b=mk('button','w-btn',c[0]);b.type='button';b.addEventListener('click',function(){pick(c,b);});bar.appendChild(b);return b;});
function pick(c,b){btns.forEach(function(x){x.classList.toggle('w-on',x===b);});terms.forEach(function(t){var on=c[1].indexOf(t.getAttribute('data-term'))>=0;t.classList.toggle('on',on);t.classList.toggle('off',!on);});note.textContent=c[0]+': '+c[2];}
pick(GE[2],btns[2]);}
function matrix(w){var rows=qa('tbody tr',w);rows.forEach(function(tr){tr.tabIndex=0;function go(){var was=tr.classList.contains('w-hl');rows.forEach(function(o){o.classList.remove('w-hl');});if(!was)tr.classList.add('w-hl');}tr.addEventListener('click',go);tr.addEventListener('keydown',function(e){if(e.key==='Enter')go();});});}
function simPI(KP,KI){var kp=13.64,M=0.0023*kp,d=0.106*kp,D=0.033,Dt=1/30,dt=0.0005,A=0.1,om=Math.PI,load=0.378,Tend=6;
function r(t){return A*Math.sin(om*t);}function rd(t){return A*om*Math.cos(om*t);}function rdd(t){return -A*om*om*Math.sin(om*t);}
var q=0,v=0,I=0,next=0,queue=[],g=0,k=0,out={t:[],r:[],q:[],a:0,na:0,b:0,nb:0,bad:false};
for(var t=0;t<Tend;t+=dt){if(t>=next-1e-9){var meas=Math.round(q/TICK)*TICK,e=r(t)-meas;I+=e*Dt;var iT=clamp(KI*I,-0.1,0.1);if(KI>0)I=iT/KI;var tf=t+D;queue.push([t+D,r(tf)+(d/kp)*rd(tf)+(M/kp)*rdd(tf)+clamp(KP*e,-0.1,0.1)+iT]);next+=Dt;}
while(queue.length&&queue[0][0]<=t+1e-9)g=queue.shift()[1];
var tau=clamp(kp*(g-q),-2.5,2.5)-d*v-(t>=3?load:0);v+=tau/M*dt;q+=v*dt;
var err=r(t)-q;if(Math.abs(err)>0.3)out.bad=true;
if(t>=1&&t<3){out.a+=err*err;out.na++;}else if(t>=3){out.b+=err*err;out.nb++;}
if(k++%20===0){out.t.push(t);out.r.push(r(t));out.q.push(q);}
if(out.bad)break;}
return out;}
function drawServo(cv,s){var c=cv.getContext('2d'),W=cv.width,H=cv.height;c.fillStyle='#1c2622';c.fillRect(0,0,W,H);
var X=function(t){return 50+(W-70)*t/6;},Y=function(v){return clamp(H/2-v/0.15*(H/2-24),4,H-4);};
c.strokeStyle='#3d4a44';c.lineWidth=1;c.beginPath();c.moveTo(50,Y(0));c.lineTo(W-20,Y(0));c.stroke();
c.setLineDash([6,5]);c.strokeStyle='#f29b9b';c.beginPath();c.moveTo(X(3),30);c.lineTo(X(3),H-10);c.stroke();c.setLineDash([]);
function line(arr,col,lw){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();arr.forEach(function(v,i){var x=X(s.t[i]),y=Y(v);if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.stroke();}
line(s.r,'#7fd3e6',2.5);line(s.q,'#f2a65a',2);
c.font='16px sans-serif';c.fillStyle='#7fd3e6';c.fillText('target',56,22);c.fillStyle='#f2a65a';c.fillText('joint',130,22);c.fillStyle='#f29b9b';c.fillText('load step',X(3)+6,22);c.fillStyle='#b9c3bc';c.fillText('0 s',44,H-6);c.fillText('6 s',W-40,H-6);}
function servo(w){var box=mk('div','sp-box'),cv=mk('canvas','sp-cv'),out=mk('p','ge-note');cv.width=720;cv.height=260;
function S(lbl,min,max,step,val){var l=mk('label','sp-l'),s=mk('input'),v=mk('span','',String(val));s.type='range';s.min=min;s.max=max;s.step=step;s.value=val;l.appendChild(document.createTextNode(lbl+' '));l.appendChild(s);l.appendChild(v);s.addEventListener('input',function(){v.textContent=s.value;draw();});box.appendChild(l);return s;}
var kP=S('outer K_P',0,6,0.1,0.2),kI=S('outer K_I (1/s)',0,15,0.5,2);
function draw(){var s=simPI(+kP.value,+kI.value);drawServo(cv,s);out.textContent=s.bad?'Unstable: the delayed loop rings and grows. Lower K_P.':'RMS from 1 to 3 s: '+(1000*Math.sqrt(s.a/s.na)).toFixed(1)+' mrad · after the load step, 3 to 6 s: '+(1000*Math.sqrt(s.b/s.nb)).toFixed(1)+' mrad';}
box.appendChild(cv);box.appendChild(out);w.appendChild(box);draw();}
function plan(w){var T=TICK*1000,g=100,mode='solve',best=null;var cv=mk('canvas','pc-cv');cv.width=720;cv.height=300;var row=mk('div','ge-controls'),msg=mk('p','ge-note');
function B(lbl,f){var b=mk('button','w-btn',lbl);b.type='button';b.addEventListener('click',f);row.appendChild(b);return b;}
function joint(x){return x>110?x-10:x<90?x+10:100;}function cost(x){var e=115-joint(x);return e*e;}
B('gradient step',function(){var s=cost(g+0.5)-cost(g-0.5);if(s===0){msg.textContent='Slope at goal '+g.toFixed(1)+' mrad is 0: the gradient step goes nowhere.';}else{g=clamp(g-0.01*s,80,140);msg.textContent='Slope '+s.toFixed(1)+', moved to '+g.toFixed(1)+' mrad.';}draw();});
B('tick search',function(){var bx=g,bc=Infinity;for(var k=Math.ceil(80/T);k*T<=140;k++){var c=cost(k*T);if(c<bc){bc=c;bx=k*T;}}g=bx;best=bx;msg.textContent='Whole-tick search: best goal '+bx.toFixed(1)+' mrad (exact optimum 125).';draw();});
B('reset',function(){g=100;best=null;msg.textContent='';draw();});
var bs=B('plan: solve',function(){mode='solve';draw();}),bm=B('plan: mpc',function(){mode='mpc';draw();});
function draw(){bs.classList.toggle('w-on',mode==='solve');bm.classList.toggle('w-on',mode==='mpc');var c=cv.getContext('2d');c.fillStyle='#1c2622';c.fillRect(0,0,720,300);
var X=function(x){return 40+(x-80)*5.5;},Y=function(v){return 250-v/625*200;};
c.strokeStyle='#3d4a44';c.lineWidth=1;c.beginPath();c.moveTo(40,250);c.lineTo(370,250);c.stroke();
c.strokeStyle='#eef0e8';c.lineWidth=2.5;c.beginPath();for(var x=80;x<=140;x+=0.25){var px=X(x),py=Y(cost(x));if(x===80)c.moveTo(px,py);else c.lineTo(px,py);}c.stroke();
c.fillStyle='#f2d16b';c.beginPath();c.arc(X(g),Y(cost(g)),6,0,7);c.fill();
c.font='16px sans-serif';c.fillStyle='#b9c3bc';c.fillText('cost vs goal (toy, mrad)',40,24);c.fillText('80',32,270);c.fillText('140',350,270);c.fillStyle='#f2d16b';c.fillText('goal '+g.toFixed(1),X(g)-30,Y(cost(g))-12);
var x0=420,x1=700,yy=function(v){return 250-(v-95)*5;};
c.fillStyle='#b9c3bc';c.fillText(mode==='solve'?'solve: one destination (illustrative)':'mpc: 8 free goals (illustrative)',x0-10,24);
c.strokeStyle='#7fd3e6';c.setLineDash([6,5]);c.beginPath();c.moveTo(x0,yy(115));c.lineTo(x1,yy(115));c.stroke();c.setLineDash([]);c.fillStyle='#7fd3e6';c.fillText('target 115',x1-80,yy(115)-8);
var dst=best||125,off=[4,2,0,-1,0,1,0,0],pts=[];for(var i=0;i<8;i++){pts.push(mode==='solve'?Math.min(dst,100+(dst-100)*(i+1)/3):dst+off[i]);}
c.fillStyle='#f2d16b';pts.forEach(function(p,i){var px=x0+i*(x1-x0)/7;c.fillRect(px-5,yy(p)-5,10,10);});
c.fillStyle='#b9c3bc';c.fillText('0 s',x0-8,270);c.fillText('0.25 s',x1-30,270);}
w.appendChild(row);w.appendChild(cv);w.appendChild(msg);draw();}
var INIT={'predict':predict,'goal-equation':goalEq,'error-matrix':matrix,'servo-playground':servo,'plan-compare':plan};
function boot(){qa('.so101-widget').forEach(function(w){var f=INIT[w.getAttribute('data-type')];if(f&&!w.hasAttribute('data-ready')){w.setAttribute('data-ready','1');f(w);}});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
