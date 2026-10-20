/* Family-tree camera only. Native scrolling supplies touch/trackpad panning. */
(() => {
  const viewer=document.querySelector('#rc .ft-viewer');
  if(!viewer)return;
  const frame=viewer.querySelector('.ft-viewport'),svg=frame.querySelector('.ft-graph');
  const controls=document.querySelector('#rc .ft-toolbar');
  const levels=[1,2,4,6],readout=controls.querySelector('.ft-zoom-readout');
  let level=0,base=1;
  function size(reset=false){
    if(!frame.clientWidth||!frame.clientHeight)return;
    const oldWidth=svg.getBoundingClientRect().width||1;
    const cx=(frame.scrollLeft+frame.clientWidth/2)/oldWidth;
    const cy=(frame.scrollTop+frame.clientHeight/2)/(oldWidth*920/800);
    base=Math.min(frame.clientWidth/800,frame.clientHeight/920);
    const w=800*base*levels[level];
    svg.style.width=w+'px';svg.style.height=w*920/800+'px';
    frame.scrollLeft=reset?0:Math.max(0,cx*w-frame.clientWidth/2);
    frame.scrollTop=reset?0:Math.max(0,cy*w*920/800-frame.clientHeight/2);
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
