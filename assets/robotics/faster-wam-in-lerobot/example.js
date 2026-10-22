import './embed-height.js';
const $=id=>document.getElementById(id);
const fmt=(n,d=4)=>Number(n).toFixed(d);
const panels=['input','layers','attention','training','inference'];
const components=['x','y','z','roll','pitch','yaw','gripper'];
let current=0,data;
function syncTheme(){
 let theme;try{theme=parent.document.documentElement.dataset.theme;}catch{}
 if(!theme){try{theme=localStorage.getItem('theme');}catch{}}
 document.documentElement.dataset.theme=theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
 if(data){drawAttention();drawInference();}
}
syncTheme();
try{if(parent!==window)new MutationObserver(syncTheme).observe(parent.document.documentElement,{attributes:true,attributeFilter:['data-theme']});}catch{}
addEventListener('storage',syncTheme);matchMedia('(prefers-color-scheme: dark)').addEventListener('change',syncTheme);
function selectPanel(i,scroll=false){
 current=i;for(const [j,id]of panels.entries()){$(id).hidden=i!==j;document.querySelector(`[data-panel="${id}"]`).setAttribute('aria-current',i===j?'step':'false');}
 $('back').disabled=i===0;$('forward').disabled=i===4;$('page-count').textContent=`${i+1} / 5`;
 if(scroll)requestAnimationFrame(()=>document.querySelector('header').scrollIntoView({block:'start',behavior:'instant'}));
}
for(const [i,id]of panels.entries())document.querySelector(`[data-panel="${id}"]`).addEventListener('click',()=>selectPanel(i,true));
$('back').addEventListener('click',()=>selectPanel(Math.max(0,current-1),true));$('forward').addEventListener('click',()=>selectPanel(Math.min(4,current+1),true));
function values(row){return components.map((c,i)=>`<div><small>${c}</small>${fmt(row[i])}</div>`).join('');}
function heatmap(id){const max=Math.max(...data.raw_actions.flat().map(Math.abs),.001);$(id).innerHTML=components.flatMap((_,dim)=>data.raw_actions.map((row,t)=>`<i title="action ${t}, ${components[dim]}: ${row[dim]}" style="background:${row[dim]<0?'#bb7955':'#218e88'};opacity:${.15+.85*Math.abs(row[dim])/max}"></i>`)).join('');}
function labelRow(){const i=+$('label-row').value;$('label-index').value=i;$('label-values').innerHTML=values(data.raw_actions[i]);}
function layer(){const i=+$('layer').value;$('layer-index').value=i+1;const kv=data.video_kv_samples[i];$('kv-values').innerHTML=['k','v'].map(kind=>`<div><b>${kind.toUpperCase()}<sub>${i+1}</sub> · token 0, head 0</b><code>[${kv[kind][0].slice(0,6).map(x=>fmt(x)).join(', ')}]</code></div>`).join('');}
let selectedRow=0,selectedToken=0;
const tokenIndices=[0,1,13,14,41,55,83,97];
function drawAttention(){
 const rows=data.attention.weights;
 const dark=document.documentElement.dataset.theme==='dark';
 function table(indices,interactive){return `<table><thead><tr><th>Q ↓ / K →</th>${indices.map(t=>`<th>${t<98?'v'+t:'a'+(t-98)}</th>`).join('')}</tr></thead><tbody>${rows.map((row,r)=>`<tr><th>a${r}</th>${indices.map(t=>`<td><${interactive?'button':'span'} ${interactive?`data-row="${r}" data-token="${t}"`:''} aria-label="Action query ${r}, ${t<98?'video token '+t:'action token '+(t-98)}, weight ${fmt(row[t]*100,3)} percent" style="background:rgba(${dark?'64,176,161':'19,127,130'},${.12+Math.min(.65,row[t]*35)})" class="${interactive?'':'matrix-value '}${r===selectedRow&&t===selectedToken?'selected':''}">${fmt(row[t]*100,2)}%</${interactive?'button':'span'}></td>`).join('')}</tr>`).join('')}</tbody></table>`;}
 $('attention-matrix').innerHTML=table(tokenIndices,true);
 $('full-matrix').innerHTML=table(Array.from({length:130},(_,i)=>i),false);
 for(const b of $('attention-matrix').querySelectorAll('button'))b.addEventListener('click',()=>{selectedRow=+b.dataset.row;selectedToken=+b.dataset.token;drawAttention();});
 for(const [i,tile]of [...$('attention-grid').children].entries())tile.classList.toggle('selected',i===selectedToken);
 const q=data.attention.q[selectedRow],k=data.attention.k[selectedToken],dot=q.reduce((s,x,i)=>s+x*k[i],0),logit=dot/Math.sqrt(6),weight=rows[selectedRow][selectedToken];
 $('cell-detail').innerHTML=`<b>Query a${selectedRow} reads video token v${selectedToken}</b><br>Q = <code>[${q.map(x=>fmt(x,3)).join(', ')}]</code><br>K = <code>[${k.map(x=>fmt(x,3)).join(', ')}]</code><br>Q · K / √6 = <b>${fmt(logit,5)}</b> → joint softmax over 130 tokens → weight <b>${fmt(weight*100,3)}%</b><br><span class="small">Q/K include normalization and rotary position encoding. This probe uses head dimension 6; the paper uses 128. A cache stores K and V before the query-dependent attention weights are computed.</span>`;
}
function training(){
 $('loss-values').innerHTML=[['Video loss',data.loss.loss_video],['Action loss',data.loss.loss_action],['Total',data.loss.total]].map(([title,value])=>`<div><small>${title} · dry run</small><span>${fmt(value,6)}</span></div>`).join('');
 const x=data.normalized_actions[0][0],u=data.loss.action_target[0][0],pred=data.loss.action_prediction[0][0],epsilon=u+x,sigma=data.loss.sigma_action,noisy=(1-sigma)*x+sigma*epsilon,squared=(pred-u)**2;
 const allErrors=data.loss.action_target.flatMap((row,i)=>row.map((u,j)=>(data.loss.action_prediction[i][j]-u)**2));const mse=allErrors.reduce((a,b)=>a+b,0)/allErrors.length;
 $('loss-example').innerHTML=`<b>Action 0, x component</b><br>Recorded control: ${fmt(data.raw_actions[0][0],6)} → normalized X = ${fmt(x,6)}<br>Sampled ε = ${fmt(epsilon,6)}; σ = ${fmt(sigma,6)}<br>Noisy input X<sub>σ</sub> = ${fmt(noisy,6)}<br>Target velocity u = ε − X = ${fmt(u,6)}<br>Random model prediction f = ${fmt(pred,6)}<br>Squared error (f − u)² = <b>${fmt(squared,6)}</b><br>Mean over all 32 × 7 coordinates: ${fmt(mse,6)}<br>Schedule weight w(σ) = ${fmt(data.loss.action_weight,6)}<br>Weighted action loss = <b>${fmt(data.loss.loss_action,6)}</b><br><span class="small">Displayed scalars are rounded from the recorded tensors. The final loss is the actual float32 LeRobot result.</span>`;
}
function drawInference(){
 const step=+$('inference-step').value,dim=+$('component').value;
 $('inference-index').value=step;
 const truth=data.normalized_actions.map(row=>row[dim]),pred=data.inference_states[step].map(row=>row[dim]);
 const lo=Math.min(...truth,...pred)-.2,hi=Math.max(...truth,...pred)+.2;
 const y=n=>180-(n-lo)/(hi-lo)*150;
 const points=arr=>arr.map((n,i)=>`${42+i/31*530},${y(n)}`).join(' ');
 $('inference-chart').innerHTML=`<path d="M42 20V180H575" fill="none" stroke="var(--line)"/><text x="8" y="26" fill="var(--muted)" font-size="11">${fmt(hi,1)}</text><text x="8" y="180" fill="var(--muted)" font-size="11">${fmt(lo,1)}</text><text x="42" y="200" fill="var(--muted)" font-size="11">action 0</text><text x="525" y="200" fill="var(--muted)" font-size="11">action 31</text><polyline points="${points(truth)}" fill="none" stroke="var(--green)" stroke-width="2"/><polyline points="${points(pred)}" fill="none" stroke="var(--orange)" stroke-width="2"/>`;
 const raw=data.inference_states[step][0].map((n,i)=>n*data.action_std[i]+data.action_mean[i]);
 $('prediction-values').innerHTML=`<b>${step===0?'Initial noise':'After update '+step} · first action, normalized</b><br><code>[${data.inference_states[step][0].map(n=>fmt(n)).join(', ')}]</code><br><b>After undoing dataset normalization</b><br><code>[${raw.map(n=>fmt(n)).join(', ')}]</code><br><span class="small">Random weights, reduced width. Not suitable for robot execution.</span>`;
}
try{
 const response=await fetch('example/results.json');if(!response.ok)throw Error(response.status);data=await response.json();
 for(const id of ['token-grid','attention-grid'])$(id).innerHTML='<i></i>'.repeat(98);
 heatmap('label-heatmap');heatmap('training-actions');labelRow();layer();drawAttention();training();drawInference();
 $('label-row').addEventListener('input',labelRow);$('layer').addEventListener('input',layer);
 $('future').addEventListener('input',e=>{const index=+e.target.value*4;$('future-index').value=index;$('future-frame').src=`example/frame-${String(index).padStart(2,'0')}.jpg`;});
 $('inference-step').addEventListener('input',drawInference);$('component').addEventListener('change',drawInference);
 $('loading').hidden=true;selectPanel(0);
}catch(error){$('loading').textContent='The numeric record could not load. Reload or open the linked record below.';console.error(error);}
