/* Family-tree camera only. Native scrolling supplies touch/trackpad panning. */
(() => {
  const viewer=document.querySelector('#rc .ft-viewer');
  if(!viewer)return;
  const frame=viewer.querySelector('.ft-viewport'),svg=frame.querySelector('.ft-graph');
  const controls=document.querySelector('#rc .ft-toolbar');
  const levels=[1,2,4,6],readout=controls.querySelector('.ft-zoom-readout');
  const vb=svg.viewBox.baseVal,GW=vb.width||800,GH=vb.height||920;
  let level=0,base=1;
  function size(reset=false){
    if(!frame.clientWidth||!frame.clientHeight)return;
    const oldWidth=svg.getBoundingClientRect().width||1;
    const cx=(frame.scrollLeft+frame.clientWidth/2)/oldWidth;
    const cy=(frame.scrollTop+frame.clientHeight/2)/(oldWidth*GH/GW);
    base=Math.min(frame.clientWidth/GW,frame.clientHeight/GH);
    const w=GW*base*levels[level];
    svg.style.width=w+'px';svg.style.height=w*GH/GW+'px';
    frame.scrollLeft=reset?0:Math.max(0,cx*w-frame.clientWidth/2);
    frame.scrollTop=reset?0:Math.max(0,cy*w*GH/GW-frame.clientHeight/2);
    readout.textContent=levels[level]+'×';viewer.dataset.zoom=String(levels[level]);
    controls.querySelector('[data-ft-zoom="out"]').disabled=level===0;
    controls.querySelector('[data-ft-zoom="in"]').disabled=level===levels.length-1;
  }
  controls.querySelector('[data-ft-zoom="overview"]').addEventListener('click',()=>{level=0;size(true)});
  controls.querySelector('[data-ft-zoom="in"]').addEventListener('click',()=>{level=Math.min(level+1,levels.length-1);size()});
  controls.querySelector('[data-ft-zoom="out"]').addEventListener('click',()=>{level=Math.max(0,level-1);size()});
  svg.addEventListener('click',event=>{
    const edge=event.target.closest('[data-ft-edge]');if(!edge)return;
    const detail=document.getElementById('ft-edge-'+edge.dataset.ftEdge);if(!detail)return;
    event.preventDefault();detail.open=true;
    detail.scrollIntoView({block:'start',behavior:'instant'});
    history.replaceState(null,'','#'+detail.id);
    detail.querySelector('summary').focus({preventScroll:true});
  });
  new ResizeObserver(()=>size(level===0)).observe(frame);
  const hash=document.getElementById(location.hash.slice(1));
  if(hash?.classList.contains('ft-detail'))hash.open=true;
})();

/* Method cards, after the Breaking Bellman method panel: click, tap, Enter or Space on a method
   opens its card (dates, context, a checked quote). The card text lives in the closed
   "The nine methods" drawer in the article, so it also reads without JavaScript. */
(() => {
  const svg=document.querySelector('#rc .ft-graph'),notes=document.getElementById('ft-methods');
  if(!svg||!notes)return;
  const pop=document.createElement('div');
  pop.className='ft-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-modal','false');pop.hidden=true;
  document.body.appendChild(pop);
  let opener=null;
  function close(refocus){
    if(pop.hidden)return;
    pop.hidden=true;
    if(opener){opener.setAttribute('aria-expanded','false');if(refocus)opener.focus({preventScroll:true});}
    opener=null;
  }
  function open(node){
    const id=node.dataset.node,card=notes.querySelector('.ft-method[data-node="'+id+'"]');
    if(!card)return;
    if(opener===node&&!pop.hidden){close(true);return;}
    close(false);
    pop.replaceChildren();
    const x=document.createElement('button');
    x.type='button';x.className='ft-pop-close';x.setAttribute('aria-label','Close method card');x.textContent='×';
    x.addEventListener('click',()=>close(true));
    const body=card.cloneNode(true);
    body.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));body.removeAttribute('id');
    const h=body.querySelector('h4');
    if(h){h.id='ft-pop-title';pop.setAttribute('aria-labelledby','ft-pop-title');}
    pop.append(x,body);pop.hidden=false;
    opener=node;node.setAttribute('aria-expanded','true');
    if(window.matchMedia('(min-width: 700px)').matches){
      const r=node.getBoundingClientRect(),w=pop.offsetWidth,hgt=pop.offsetHeight;
      let left=r.right+12;if(left+w>innerWidth-8)left=Math.max(8,r.left-w-12);
      if(left<8)left=Math.max(8,Math.min(innerWidth-w-8,r.left));
      pop.style.left=left+'px';pop.style.top=Math.max(8,Math.min(innerHeight-hgt-8,r.top))+'px';
    }else{pop.style.left='';pop.style.top='';}
    x.focus({preventScroll:true});
  }
  svg.querySelectorAll('g[data-node]').forEach(node=>{
    const card=notes.querySelector('.ft-method[data-node="'+node.dataset.node+'"]');
    if(!card)return;
    node.classList.add('ft-node-btn');
    node.setAttribute('tabindex','0');node.setAttribute('role','button');
    node.setAttribute('aria-haspopup','dialog');node.setAttribute('aria-expanded','false');
    const h=card.querySelector('h4');node.setAttribute('aria-label',(h?h.textContent:node.dataset.node)+': open the method card');
    node.addEventListener('click',e=>{e.stopPropagation();open(node);});
    node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(node);}});
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close(true);});
  document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target))close(false);});
  window.addEventListener('scroll',()=>{if(!pop.hidden&&window.matchMedia('(min-width: 700px)').matches)close(false);},{passive:true});
})();
