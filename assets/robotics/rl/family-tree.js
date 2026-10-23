/* Family-tree camera only. Native scrolling supplies touch/trackpad panning. */
(() => {
  const viewer=document.querySelector('#rc .ft-viewer');
  if(!viewer)return;
  const frame=viewer.querySelector('.ft-viewport'),svg=frame.querySelector('.ft-graph');
  const controls=document.querySelector('#rc .ft-toolbar');
  const levels=[1,2,4,6],readout=controls.querySelector('.ft-zoom-readout');
  const vb=svg.viewBox.baseVal,GW=vb.width||800,GH=vb.height||920;
  const list=buildList(svg),LW=list.viewBox.baseVal.width,LH=list.viewBox.baseVal.height;
  const more=document.createElement('div');
  more.className='ft-more';more.setAttribute('aria-hidden','true');more.textContent='↓ more below';
  frame.append(list,more);
  let level=0,base=1,layout='';
  function setEnd(){viewer.dataset.end=frame.scrollTop+frame.clientHeight>=frame.scrollHeight-more.offsetHeight-4?'1':'0';}
  function size(reset=false){
    if(!frame.clientWidth||!frame.clientHeight)return;
    /* The wide tree shrinks to fit the frame. When its 22-unit labels would fall below about 10.5 CSS px
       (phones, small tablets), the same nodes and numbered problems show as an indented list instead. */
    const box=frame.getBoundingClientRect(),fit=Math.min(box.width/GW,box.height/GH);
    const next=22*fit<10.5?'list':'tree';
    if(next!==layout){layout=next;viewer.dataset.layout=layout;controls.dataset.layout=layout;reset=true;}
    if(layout==='list'){
      const w=Math.min(frame.clientWidth,440);
      list.style.width=w+'px';list.style.height=w*LH/LW+'px';
      readout.textContent='Scroll the list · tap a method or a number';
      if(reset)frame.scrollTop=0;
      setEnd();return;
    }
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
  frame.addEventListener('scroll',()=>{if(layout==='list')setEnd();},{passive:true});
  viewer.querySelectorAll('.ft-graph').forEach(g=>g.addEventListener('click',event=>{
    const edge=event.target.closest('[data-ft-edge]');if(!edge)return;
    const detail=document.getElementById('ft-edge-'+edge.dataset.ftEdge);if(!detail)return;
    event.preventDefault();detail.open=true;
    detail.scrollIntoView({block:'start',behavior:'instant'});
    history.replaceState(null,'','#'+detail.id);
    detail.querySelector('summary').focus({preventScroll:true});
  }));
  new ResizeObserver(()=>size(level===0)).observe(frame);
  const hash=document.getElementById(location.hash.slice(1));
  if(hash?.classList.contains('ft-detail'))hash.open=true;

  /* The list reads the nodes and numbered problems from the wide tree, so the two never disagree.
     Each row is one numbered problem and the method that fixes it, indented under its parent. */
  function buildList(tree){
    const nodes={},kids={},into={};
    tree.querySelectorAll('g[data-node]').forEach(g=>{
      const spans=[...g.querySelector(':scope>text').querySelectorAll('tspan')];
      nodes[g.dataset.node]={
        name:spans.filter(t=>!t.classList.contains('c-blue')).map(t=>t.textContent.trim()).join(' '),
        part:(spans.find(t=>t.classList.contains('c-blue'))||{}).textContent||'',
        year:(g.querySelector('.ft-year text')||{}).textContent||'',
        blue:g.querySelector(':scope>rect').getAttribute('fill')==='#d7e5ee'};
    });
    tree.querySelectorAll('a.ft-edge-link').forEach(a=>{
      const e=a.querySelector('[data-edge]'),label=[...e.querySelectorAll('text')].find(t=>t.getAttribute('fill')!=='#fff');
      into[e.dataset.child]={n:+a.dataset.ftEdge,href:a.getAttribute('href'),aria:a.getAttribute('aria-label'),
        lines:[...label.querySelectorAll('tspan')].map(t=>t.textContent.trim())};
      (kids[e.dataset.parent]=kids[e.dataset.parent]||[]).push(e.dataset.child);
    });
    Object.values(kids).forEach(k=>k.sort((x,y)=>into[x].n-into[y].n));
    const root=Object.keys(nodes).find(id=>!into[id]),rows=[];
    (function walk(id,d){rows.push({id,d});(kids[id]||[]).forEach(c=>walk(c,d+1));})(root,0);
    const W=340,RH=40,BH=34,T0=14,STEP=18,LABW=78,esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const trunk=d=>T0+STEP*d,H=8+rows.length*RH;
    let lines='',body='';
    rows.forEach((r,i)=>{
      const y=4+i*RH,cy=y+BH/2,n=nodes[r.id],e=into[r.id];
      let bx=4;
      if(e){
        const cx=trunk(r.d),lx=cx+14;
        bx=lx+LABW+12;
        const parentRow=rows.findIndex(q=>q.id===Object.keys(kids).find(p=>kids[p].includes(r.id)));
        lines+='<path d="M'+trunk(r.d-1)+' '+cy+'H'+(cx-9)+'" fill="none" stroke="#656b62" stroke-width="1.6"/>';
        if(kids[Object.keys(kids).find(p=>kids[p].includes(r.id))].slice(-1)[0]===r.id){
          const top=parentRow===0?4+BH:4+parentRow*RH+BH/2+9;
          lines+='<path d="M'+trunk(r.d-1)+' '+top+'V'+cy+'" fill="none" stroke="#656b62" stroke-width="1.6"/>';
        }
        const t=e.lines.length>1?[cy-2,cy+12]:[cy+4.5];
        body+='<a class="ft-edge-link" data-ft-edge="'+e.n+'" href="'+e.href+'" aria-label="'+esc(e.aria)+'">'+
          '<rect class="ft-edge-label" x="'+(cx-11)+'" y="'+(y+1)+'" width="'+(LABW+26)+'" height="'+(BH-2)+'" rx="5" fill="none" pointer-events="all"/>'+
          '<circle cx="'+cx+'" cy="'+cy+'" r="9" fill="#b44c2c"/>'+
          '<text x="'+cx+'" y="'+(cy+4.5)+'" text-anchor="middle" fill="#fff" font-size="12.5" font-weight="700">'+e.n+'</text>'+
          '<text fill="#242622" font-size="12.5">'+e.lines.map((l,k)=>'<tspan x="'+lx+'" y="'+t[k]+'">'+esc(l)+'</tspan>').join('')+'</text></a>'+
          '<path d="M'+(lx+LABW+1)+' '+cy+'H'+(bx-3)+'M'+(bx-8)+' '+(cy-4)+'L'+(bx-3)+' '+cy+'L'+(bx-8)+' '+(cy+4)+'" fill="none" stroke="#656b62" stroke-width="1.4"/>';
      }
      const bw=e?W-4-bx:200;
      body+='<g data-node="'+r.id+'"><rect x="'+bx+'" y="'+y+'" width="'+bw+'" height="'+BH+'" rx="5" fill="'+(n.blue?'#d7e5ee':'#fff')+'" stroke="'+(n.blue?'#2b6a8e':'#242622')+'" stroke-width="1.6"/>'+
        '<text x="'+(bx+8)+'" y="'+(y+15)+'" font-size="14.5" font-weight="700" fill="#242622">'+esc(n.name)+'</text>'+
        '<text x="'+(bx+8)+'" y="'+(y+29)+'" font-size="11.5" class="c-dim">'+esc(n.year)+(n.part?' · <tspan class="c-blue">'+esc(n.part)+'</tspan>':'')+'</text></g>';
    });
    const box=document.createElement('div');
    box.innerHTML='<svg class="ft-graph ft-list" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="group" aria-label="The same tree as a list: nine methods, each under the numbered problem that it fixes">'+
      lines+body+'</svg>';
    return box.firstChild;
  }
})();

/* Method cards, after the Breaking Bellman method panel: click, tap, Enter or Space on a method
   opens its card (dates, context, a checked quote). The card text lives in the closed
   "The nine methods" drawer in the article, so it also reads without JavaScript. */
(() => {
  const graphs=document.querySelectorAll('#rc .ft-graph'),notes=document.getElementById('ft-methods');
  if(!graphs.length||!notes)return;
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
  graphs.forEach(svg=>svg.querySelectorAll('g[data-node]').forEach(node=>{
    const card=notes.querySelector('.ft-method[data-node="'+node.dataset.node+'"]');
    if(!card)return;
    node.classList.add('ft-node-btn');
    node.setAttribute('tabindex','0');node.setAttribute('role','button');
    node.setAttribute('aria-haspopup','dialog');node.setAttribute('aria-expanded','false');
    const h=card.querySelector('h4');node.setAttribute('aria-label',(h?h.textContent:node.dataset.node)+': open the method card');
    node.addEventListener('click',e=>{e.stopPropagation();open(node);});
    node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(node);}});
  }));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close(true);});
  document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target))close(false);});
  window.addEventListener('scroll',()=>{if(!pop.hidden&&window.matchMedia('(min-width: 700px)').matches)close(false);},{passive:true});
})();
