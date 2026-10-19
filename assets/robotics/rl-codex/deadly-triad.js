/* Dedicated drawing and camera for the triad section. No shared camera changes. */
(() => {
 const rc=document.getElementById('rc');if(!rc)return;
 const link=rc.querySelector('.dt-original');if(!link)return;
 const viewer=document.createElement('div');viewer.className='dt-viewer';
 viewer.innerHTML='<div class="dt-controls" role="group" aria-label="Deadly triad zoom"><button type="button" data-dt="overview">Overview</button><button type="button" data-dt="out" aria-label="Zoom triad out">−</button><button type="button" data-dt="in" aria-label="Zoom triad in">+</button><span class="dt-readout" aria-live="polite">1×</span></div><div class="dt-frame" tabindex="0" role="region" aria-label="Deadly triad drawing. Zoom then scroll to inspect."><img alt="Three useful ingredients combine in a feedback loop that can diverge. Green pair edges 1, 2, 3 refer to the qualified examples below. Illustrative rising-value sketch, not measured data."></div>';
 rc.querySelector('.rc-view').appendChild(viewer);
 const frame=viewer.querySelector('.dt-frame'),img=frame.querySelector('img');img.src=link.href;
 const levels=[1,2,4,6];let level=0;
 function size(reset=false){if(!frame.clientWidth||!frame.clientHeight)return;const old=img.getBoundingClientRect().width||1,cx=(frame.scrollLeft+frame.clientWidth/2)/old,cy=(frame.scrollTop+frame.clientHeight/2)/(old*680/620);const width=620*Math.min(frame.clientWidth/620,frame.clientHeight/680)*levels[level];img.style.width=width+'px';img.style.height=width*680/620+'px';frame.scrollLeft=reset?0:Math.max(0,cx*width-frame.clientWidth/2);frame.scrollTop=reset?0:Math.max(0,cy*width*680/620-frame.clientHeight/2);viewer.dataset.zoom=String(levels[level]);viewer.querySelector('.dt-readout').textContent=levels[level]+'×';viewer.querySelector('[data-dt=out]').disabled=level===0;viewer.querySelector('[data-dt=in]').disabled=level===3;}
 viewer.querySelector('[data-dt=overview]').addEventListener('click',()=>{level=0;size(true)});
 viewer.querySelector('[data-dt=in]').addEventListener('click',()=>{level=Math.min(3,level+1);size()});viewer.querySelector('[data-dt=out]').addEventListener('click',()=>{level=Math.max(0,level-1);size()});new ResizeObserver(()=>size(level===0)).observe(frame);
})();
